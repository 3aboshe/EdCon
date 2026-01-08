import api from './api';

class UserService {
    async getUsers(params) {
        const { data } = await api.get('/users', { params });
        return data.data;
    }

    async getUserById(id) {
        const { data } = await api.get(`/users/${id}`);
        return data.data;
    }

    async createUser(userData) {
        const { data } = await api.post('/users', userData);
        return data;
    }

    async updateUser(id, userData) {
        const { data } = await api.put(`/users/${id}`, userData);
        return data.data;
    }

    async deleteUser(id) {
        await api.delete(`/users/${id}`);
    }

    async linkParentToStudent(parentId, studentId) {
        await api.post('/parent-child/link', { parentId, studentId });
    }
}

export const userService = new UserService();
export default userService;
