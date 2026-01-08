import api from './api';

class DashboardService {
    async getSchoolDashboard() {
        const { data } = await api.get('/admin/dashboard');
        return data;
    }

    async getSuperAdminStats() {
        // Super admin stats can be derived from schools list
        const { data } = await api.get('/schools');
        const schools = data.data;

        let totalUsers = 0;
        schools.forEach((school) => {
            totalUsers += school._count?.users || 0;
        });

        return {
            totalSchools: schools.length,
            totalUsers,
            activeNow: Math.floor(totalUsers * 0.1), // Estimate
        };
    }

    async getClasses() {
        const { data } = await api.get('/classes');
        return data.data || [];
    }

    async createClass(name) {
        const { data } = await api.post('/classes', { name });
        return data.data;
    }

    async deleteClass(classId) {
        await api.delete(`/classes/${classId}`);
    }

    async getSubjects() {
        const { data } = await api.get('/subjects');
        return data.data || [];
    }

    async createSubject(name) {
        const { data } = await api.post('/subjects', { name });
        return data.data;
    }

    async deleteSubject(subjectId) {
        await api.delete(`/subjects/${subjectId}`);
    }

    async getUsers(role) {
        const params = role ? `?role=${role}` : '';
        const { data } = await api.get(`/classes/users${params}`);
        return data.data || [];
    }

    async createUser(userData) {
        const { data } = await api.post('/users', userData);
        return data;
    }

    async deleteUser(userId) {
        await api.delete(`/classes/users/${userId}`);
    }

    async resetUserPassword(userId) {
        const { data } = await api.post(`/users/${userId}/reset-password`);
        return data.data;
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
