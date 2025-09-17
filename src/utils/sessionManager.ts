import { User } from '../types';

// Cookie utilities
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Session management
export const SESSION_KEYS = {
  USER_DATA: 'edcon_user_data',
  SESSION_TOKEN: 'edcon_session_token',
  LAST_ACTIVITY: 'edcon_last_activity',
} as const;

export const saveUserSession = (user: User) => {
  try {
    // Save user data to localStorage for immediate access
    localStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(user));
    
    // Save session token as cookie for persistence across browser sessions
    setCookie(SESSION_KEYS.SESSION_TOKEN, user.id, 30); // 30 days
    
    // Update last activity
    updateLastActivity();
    
    console.log('Session saved for user:', user.name);
  } catch (error) {
    console.error('Error saving user session:', error);
  }
};

export const loadUserSession = (): User | null => {
  try {
    // Check if session token exists
    const sessionToken = getCookie(SESSION_KEYS.SESSION_TOKEN);
    if (!sessionToken) {
      console.log('No session token found');
      return null;
    }
    
    // Check session validity (30 days max)
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    if (lastActivity) {
      const lastActivityTime = new Date(lastActivity);
      const now = new Date();
      const daysSinceLastActivity = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastActivity > 30) {
        console.log('Session expired');
        clearUserSession();
        return null;
      }
    }
    
    // Load user data
    const userData = localStorage.getItem(SESSION_KEYS.USER_DATA);
    if (userData) {
      const user = JSON.parse(userData) as User;
      updateLastActivity();
      console.log('Session loaded for user:', user.name);
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading user session:', error);
    return null;
  }
};

export const clearUserSession = () => {
  try {
    localStorage.removeItem(SESSION_KEYS.USER_DATA);
    localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
    deleteCookie(SESSION_KEYS.SESSION_TOKEN);
    console.log('Session cleared');
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
};

export const updateLastActivity = () => {
  try {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

export const isSessionValid = (): boolean => {
  const sessionToken = getCookie(SESSION_KEYS.SESSION_TOKEN);
  const userData = localStorage.getItem(SESSION_KEYS.USER_DATA);
  return !!(sessionToken && userData);
};

// Auto-update last activity on user interaction
let activityTimer: NodeJS.Timeout | null = null;

export const initActivityTracking = () => {
  const updateActivity = () => {
    if (isSessionValid()) {
      updateLastActivity();
    }
  };

  // Update activity every 5 minutes
  if (activityTimer) {
    clearInterval(activityTimer);
  }
  activityTimer = setInterval(updateActivity, 5 * 60 * 1000);

  // Update on user interactions
  const events = ['click', 'keypress', 'scroll', 'mousemove'];
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
};

export const stopActivityTracking = () => {
  if (activityTimer) {
    clearInterval(activityTimer);
    activityTimer = null;
  }
};
