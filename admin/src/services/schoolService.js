import api from './api';

class SchoolService {
    async getSchools() {
        const { data } = await api.get('/schools');
        return data.data;
    }

    async createSchool(schoolData) {
        const { data } = await api.post('/schools', schoolData);
        return data;
    }

    async deleteSchool(schoolId) {
        await api.delete(`/schools/${schoolId}`);
    }

    async addAdmin(schoolId, adminData) {
        const { data } = await api.post(`/schools/${schoolId}/admins`, adminData);
        return data;
    }

    async getAdmins(schoolId) {
        const { data } = await api.get(`/schools/${schoolId}/admins`);
        return data.data || data.admins || data;
    }

    async resetAdminPassword(schoolId, adminId) {
        const { data } = await api.post(`/schools/${schoolId}/admins/${adminId}/reset-password`);
        return data.data || data;
    }
}

export const schoolService = new SchoolService();
export default schoolService;
