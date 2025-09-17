import { User, Message, Announcement } from '../types';
import apiService from '../services/apiService';

export type DataUpdateCallback = {
  onMessagesUpdate?: (messages: Message[]) => void;
  onAnnouncementsUpdate?: (announcements: Announcement[]) => void;
  onUsersUpdate?: (users: User[]) => void;
};

class RealTimeManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private callbacks: DataUpdateCallback = {};
  private isPolling = false;
  private pollIntervalMs = 30000; // 30 seconds
  private lastMessageCheck = new Date();
  private lastAnnouncementCheck = new Date();

  // Store last known data to detect changes
  private lastMessageCount = 0;
  private lastAnnouncementCount = 0;

  constructor() {
    // Listen for visibility changes to pause/resume polling
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  public setCallbacks(callbacks: DataUpdateCallback) {
    this.callbacks = callbacks;
  }

  public startPolling() {
    if (this.isPolling) return;
    
    console.log('Starting real-time polling...');
    this.isPolling = true;
    this.poll();
    this.pollingInterval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  public stopPolling() {
    if (!this.isPolling) return;
    
    console.log('Stopping real-time polling...');
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async poll() {
    if (!document.hasFocus() && !document.hidden) {
      // Skip polling if page is not visible to save resources
      return;
    }

    try {
      await Promise.all([
        this.checkForNewMessages(),
        this.checkForNewAnnouncements(),
      ]);
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }

  private async checkForNewMessages() {
    try {
      const messages = await apiService.getAllMessages();
      
      // Check if there are new messages
      if (messages.length !== this.lastMessageCount) {
        console.log(`New messages detected: ${messages.length} (was ${this.lastMessageCount})`);
        this.lastMessageCount = messages.length;
        this.callbacks.onMessagesUpdate?.(messages);
        
        // Show notification for new messages
        if (messages.length > this.lastMessageCount) {
          this.showNotification('New Message', 'You have received a new message');
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }

  private async checkForNewAnnouncements() {
    try {
      const announcements = await apiService.getAllAnnouncements();
      
      // Check if there are new announcements
      if (announcements.length !== this.lastAnnouncementCount) {
        console.log(`New announcements detected: ${announcements.length} (was ${this.lastAnnouncementCount})`);
        this.lastAnnouncementCount = announcements.length;
        this.callbacks.onAnnouncementsUpdate?.(announcements);
        
        // Show notification for new announcements
        if (announcements.length > this.lastAnnouncementCount) {
          const latestAnnouncement = announcements.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          this.showNotification('New Announcement', latestAnnouncement?.title || 'New announcement posted');
        }
      }
    } catch (error) {
      console.error('Error checking for new announcements:', error);
    }
  }

  private showNotification(title: string, body: string) {
    // Check if notifications are supported and permitted
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'edcon-notification',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: 'edcon-notification',
            });
          }
        });
      }
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, reduce polling frequency
      this.pollIntervalMs = 60000; // 1 minute
    } else {
      // Page is visible, normal polling frequency
      this.pollIntervalMs = 30000; // 30 seconds
      // Immediately poll when page becomes visible
      if (this.isPolling) {
        this.poll();
      }
    }

    // Restart polling with new interval
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  public requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  // Manual refresh methods
  public async forceRefreshMessages(): Promise<Message[]> {
    try {
      const messages = await apiService.getAllMessages();
      this.lastMessageCount = messages.length;
      this.callbacks.onMessagesUpdate?.(messages);
      return messages;
    } catch (error) {
      console.error('Error force refreshing messages:', error);
      return [];
    }
  }

  public async forceRefreshAnnouncements(): Promise<Announcement[]> {
    try {
      const announcements = await apiService.getAllAnnouncements();
      this.lastAnnouncementCount = announcements.length;
      this.callbacks.onAnnouncementsUpdate?.(announcements);
      return announcements;
    } catch (error) {
      console.error('Error force refreshing announcements:', error);
      return [];
    }
  }

  // Initialize with current data counts
  public initializeDataCounts(messageCount: number, announcementCount: number) {
    this.lastMessageCount = messageCount;
    this.lastAnnouncementCount = announcementCount;
  }
}

// Export singleton instance
export const realTimeManager = new RealTimeManager();
