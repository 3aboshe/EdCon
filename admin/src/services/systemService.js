import api from './api';

class SystemService {
    // Announcements
    async getAnnouncements() {
        const { data } = await api.get('/announcements');
        return data.data;
    }

    async createAnnouncement(announcement) {
        const { data } = await api.post('/announcements', announcement);
        return data.data;
    }

    async deleteAnnouncement(id) {
        await api.delete(`/announcements/${id}`);
    }

    // Attendance
    async getAttendance(params) {
        const { data } = await api.get('/attendance', { params });
        return data.data;
    }

    // Global Notifications (Super Admin)
    async sendGlobalNotification(notification) {
        const payload = {
            title: notification.title,
            content: notification.content,
            targetRole: notification.targetRole || 'ALL',
        };
        await api.post('/global-notifications', payload);
    }

    async getGlobalHistory() {
        const { data } = await api.get('/global-notifications');
        return data.data;
    }

    // Backup & Restore (Super Admin)
    async getBackups() {
        const { data } = await api.get('/backup/list');
        return data.backups;
    }

    async createBackup() {
        await api.post('/backup/create');
    }

    async restoreBackup(filename) {
        await api.post('/backup/restore', { filename });
    }

    // Database Relation Checker
    async checkRelations() {
        const { data } = await api.post('/backup/check-relations');
        return data;
    }

    // Export School Data
    async exportData() {
        const response = await api.get('/backup/export', {
            responseType: 'blob'
        });
        return response.data;
    }
}

export const systemService = new SystemService();
export default systemService;
