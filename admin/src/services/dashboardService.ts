import api from './api';

export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
    activeHomework: number;
    attendanceRate: number;
}

export interface SuperAdminStats {
    totalSchools: number;
    totalUsers: number;
    activeNow: number;
}

export interface ClassItem {
    id: string;
    name: string;
    studentCount?: number;
}

export interface SubjectItem {
    id: string;
    name: string;
}

export interface UserItem {
    id: string;
    accessCode: string;
    name: string;
    email: string | null;
    role: string;
    classId?: string | null;
    className?: string;
    subject?: string | null;
    parentId?: string | null;
    childrenIds?: string[];
    createdAt: string;
    hasTemporaryPassword?: boolean;
}

export interface CreateUserData {
    role: 'STUDENT' | 'TEACHER' | 'PARENT';
    name: string;
    email?: string;
    classId?: string;
    classIds?: string[];
    subject?: string;
    parentId?: string;
    accessCode?: string;
}

export interface CreateUserResponse {
    success: boolean;
    user: UserItem;
    credentials: {
        accessCode: string;
        temporaryPassword?: string;
    };
}

class DashboardService {
    async getSchoolDashboard(): Promise<DashboardStats> {
        const { data } = await api.get<DashboardStats>('/admin/dashboard');
        return data;
    }

    async getSuperAdminStats(): Promise<SuperAdminStats> {
        // Super admin stats can be derived from schools list
        const { data } = await api.get<{ data: any[] }>('/schools');
        const schools = data.data;

        let totalUsers = 0;
        schools.forEach((school: any) => {
            totalUsers += school._count?.users || 0;
        });

        return {
            totalSchools: schools.length,
            totalUsers,
            activeNow: Math.floor(totalUsers * 0.1), // Estimate
        };
    }

    async getClasses(): Promise<ClassItem[]> {
        const { data } = await api.get<{ data: ClassItem[] }>('/classes');
        return data.data || [];
    }

    async createClass(name: string): Promise<ClassItem> {
        const { data } = await api.post<{ data: ClassItem }>('/classes', { name });
        return data.data;
    }

    async deleteClass(classId: string): Promise<void> {
        await api.delete(`/classes/${classId}`);
    }

    async getSubjects(): Promise<SubjectItem[]> {
        const { data } = await api.get<{ data: SubjectItem[] }>('/subjects');
        return data.data || [];
    }

    async createSubject(name: string): Promise<SubjectItem> {
        const { data } = await api.post<{ data: SubjectItem }>('/subjects', { name });
        return data.data;
    }

    async deleteSubject(subjectId: string): Promise<void> {
        await api.delete(`/subjects/${subjectId}`);
    }

    async getUsers(role?: string): Promise<UserItem[]> {
        const params = role ? `?role=${role}` : '';
        const { data } = await api.get<{ data: UserItem[] }>(`/classes/users${params}`);
        return data.data || [];
    }

    async createUser(userData: CreateUserData): Promise<CreateUserResponse> {
        const { data } = await api.post<CreateUserResponse>('/users', userData);
        return data;
    }

    async deleteUser(userId: string): Promise<void> {
        await api.delete(`/classes/users/${userId}`);
    }

    async resetUserPassword(userId: string): Promise<{ temporaryPassword: string }> {
        const { data } = await api.post<{ data: { temporaryPassword: string } }>(`/users/${userId}/reset-password`);
        return data.data;
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
