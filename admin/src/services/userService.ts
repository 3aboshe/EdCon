import api from './api';

export interface User {
    id: string;
    accessCode: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
    status: 'ACTIVE' | 'INACTIVE';
    schoolId?: string;
    classId?: string;
    parent?: User;
    children?: User[];
    class?: {
        id: string;
        name: string;
    };
}

export interface CreateUserData {
    name: string;
    email?: string;
    phone?: string;
    role: string;
    classId?: string; // For students
    parentId?: string; // For linking parents
    accessCode?: string;
}

export interface UserResponse {
    success: boolean;
    data: User;
    credentials?: {
        accessCode: string;
        temporaryPassword: string;
    };
}

class UserService {
    async getUsers(params?: { role?: string; classId?: string; schoolId?: string }): Promise<User[]> {
        const { data } = await api.get<{ success: boolean; data: User[] }>('/users', { params });
        return data.data;
    }

    async getUserById(id: string): Promise<User> {
        const { data } = await api.get<{ success: boolean; data: User }>(`/users/${id}`);
        return data.data;
    }

    async createUser(userData: CreateUserData): Promise<UserResponse> {
        const { data } = await api.post<UserResponse>('/users', userData);
        return data;
    }

    async updateUser(id: string, userData: Partial<CreateUserData>): Promise<User> {
        const { data } = await api.put<{ success: boolean; data: User }>(`/users/${id}`, userData);
        return data.data;
    }

    async deleteUser(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    }

    async linkParentToStudent(parentId: string, studentId: string): Promise<void> {
        await api.post('/parent-child/link', { parentId, studentId });
    }
}

export const userService = new UserService();
export default userService;
