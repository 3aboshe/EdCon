import api from './api';

class UserService {
    async getUsers(params) {
        const { data } = await api.get('/users', { params });
        // Backend returns array directly or wrapped in data property
        return Array.isArray(data) ? data : (data.data || data.users || []);
    }

    async getUserById(id) {
        const { data } = await api.get(`/users/${id}`);
        return data.user || data.data || data;
    }

    async createUser(userData) {
        const { data } = await api.post('/users', userData);
        return data;
    }

    async updateUser(id, userData) {
        const { data } = await api.put(`/users/${id}`, userData);
        return data.user || data.data || data;
    }

    async deleteUser(id) {
        await api.delete(`/users/${id}`);
    }

    async linkParentToStudent(parentId, studentId) {
        await api.post('/parent-child/link', { parentId, studentId });
    }

    async resetPassword(userId) {
        const { data } = await api.post(`/users/${userId}/reset-password`);
        return data.data || data;
    }
}

export const userService = new UserService();
export default userService;
