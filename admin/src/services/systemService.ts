import api from './api';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    targetRole?: string;
    createdAt: string;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    student?: { name: string };
}

export interface Backup {
    id: string;
    filename: string;
    size: number;
    createdAt: string;
}

class SystemService {
    // Announcements
    async getAnnouncements(): Promise<Announcement[]> {
        const { data } = await api.get<{ success: boolean; data: Announcement[] }>('/announcements');
        return data.data;
    }

    async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
        const { data } = await api.post<{ success: boolean; data: Announcement }>('/announcements', announcement);
        return data.data;
    }

    async deleteAnnouncement(id: string): Promise<void> {
        await api.delete(`/announcements/${id}`);
    }

    // Attendance
    async getAttendance(params?: { date?: string; classId?: string; studentId?: string }): Promise<AttendanceRecord[]> {
        const { data } = await api.get<{ success: boolean; data: AttendanceRecord[] }>('/attendance', { params });
        return data.data;
    }

    // Global Notifications (Super Admin)
    async sendGlobalNotification(notification: { title: string; content: string; targetSchoolId?: string }): Promise<void> {
        await api.post('/global-notifications', notification);
    }

    async getGlobalHistory(): Promise<Announcement[]> {
        const { data } = await api.get<{ success: boolean; data: Announcement[] }>('/global-notifications');
        return data.data;
    }

    // Backup & Restore (Super Admin)
    async getBackups(): Promise<Backup[]> {
        const { data } = await api.get<{ success: boolean; backups: Backup[] }>('/backup/list');
        return data.backups;
    }

    async createBackup(): Promise<void> {
        await api.post('/backup/create');
    }

    async restoreBackup(filename: string): Promise<void> {
        await api.post('/backup/restore', { filename });
    }

    // Database Relation Checker
    async checkRelations(): Promise<{
        success: boolean;
        issues?: string[];
        fixes?: string[];
        totalIssues?: number;
        totalFixes?: number;
    }> {
        const { data } = await api.post<{
            success: boolean;
            issues?: string[];
            fixes?: string[];
            totalIssues?: number;
            totalFixes?: number;
        }>('/backup/check-relations');
        return data;
    }

    // Export School Data
    async exportData(): Promise<Blob> {
        const response = await api.get('/backup/export', {
            responseType: 'blob'
        });
        return response.data;
    }
}

export const systemService = new SystemService();
export default systemService;
