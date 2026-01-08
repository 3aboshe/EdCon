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
}

export const schoolService = new SchoolService();
export default schoolService;
