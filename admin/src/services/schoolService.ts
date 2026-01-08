import api from './api';

export interface School {
    id: string;
    name: string;
    code: string;
    address: string | null;
    timezone: string;
    createdAt: string;
    _count?: {
        users: number;
        classes: number;
    };
}

export interface SchoolAdmin {
    id: string;
    accessCode: string;
    name: string;
    email: string | null;
    role: string;
}

export interface CreateSchoolData {
    name: string;
    code?: string;
    address?: string;
    admin: {
        name: string;
        email?: string;
        accessCode?: string;
    };
}

export interface CreateSchoolResponse {
    success: boolean;
    school: School;
    admin: SchoolAdmin;
    credentials: {
        accessCode: string;
        temporaryPassword: string;
    };
}

export interface AddAdminData {
    name: string;
    email?: string;
    accessCode?: string;
}

class SchoolService {
    async getSchools(): Promise<School[]> {
        const { data } = await api.get<{ success: boolean; data: School[] }>('/schools');
        return data.data;
    }

    async createSchool(schoolData: CreateSchoolData): Promise<CreateSchoolResponse> {
        const { data } = await api.post<CreateSchoolResponse>('/schools', schoolData);
        return data;
    }

    async deleteSchool(schoolId: string): Promise<void> {
        await api.delete(`/schools/${schoolId}`);
    }

    async addAdmin(schoolId: string, adminData: AddAdminData): Promise<{
        admin: SchoolAdmin;
        credentials: { accessCode: string; temporaryPassword: string };
    }> {
        const { data } = await api.post(`/schools/${schoolId}/admins`, adminData);
        return data;
    }
}

export const schoolService = new SchoolService();
export default schoolService;
