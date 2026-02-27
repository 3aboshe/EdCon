import api from './api';

class DashboardService {
    async getSchoolDashboard() {
        const { data } = await api.get('/admin/dashboard');
        // Backend returns { success: true, data: { counts: {...}, users: {...}, ... } }
        // We need to extract the counts from the nested structure
        if (data?.data?.counts) {
            return data.data.counts;
        }
        // Fallback if structure is different
        return data?.counts || data?.data || data;
    }

    async getSuperAdminStats() {
        try {
            const { data } = await api.get('/analytics/super-admin');
            const metrics = data?.data || {};

            return {
                totalSchools: metrics.totalSchools || 0,
                totalUsers: metrics.totalUsers || 0,
                activeNow: metrics.activeUsers || 0,
            };
        } catch {
            const { data } = await api.get('/schools');
            const schools = data.data || [];

            let totalUsers = 0;
            schools.forEach((school) => {
                totalUsers += school._count?.users || 0;
            });

            return {
                totalSchools: schools.length,
                totalUsers,
                activeNow: 0,
            };
        }
    }

    async getClasses() {
        const { data } = await api.get('/classes');
        // Backend returns array directly
        return Array.isArray(data) ? data : (data.data || []);
    }

    async createClass(name) {
        const { data } = await api.post('/classes', { name });
        return data.class || data;
    }

    async deleteClass(classId) {
        await api.delete(`/classes/${classId}`);
    }

    async getSubjects() {
        const { data } = await api.get('/subjects');
        // Backend returns array directly
        return Array.isArray(data) ? data : (data.data || []);
    }

    async createSubject(name) {
        const { data } = await api.post('/subjects', { name });
        return data.subject || data;
    }

    async deleteSubject(subjectId) {
        await api.delete(`/subjects/${subjectId}`);
    }

    async getUsers(role) {
        const params = role ? `?role=${role}` : '';
        const { data } = await api.get(`/users${params}`);
        // Backend returns array directly
        return Array.isArray(data) ? data : (data.data || data.users || []);
    }

    async createUser(userData) {
        const { data } = await api.post('/users', userData);
        return data;
    }

    async deleteUser(userId) {
        await api.delete(`/users/${userId}`);
    }

    async resetUserPassword(userId) {
        const { data } = await api.post(`/users/${userId}/reset-password`);
        return data.data || data;
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
