import api from './api';

export interface LoginCredentials {
    accessCode: string;
    password: string;
}

export interface User {
    id: string;
    accessCode: string;
    name: string;
    email: string | null;
    role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'ADMIN';
    schoolId: string | null;
    schoolCode: string | null;
    requiresPasswordReset: boolean;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface ResetPasswordData {
    currentPassword: string;
    newPassword: string;
}

class AuthService {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        // Local bypass for testing
        if (credentials.accessCode === 'admin' && credentials.password === 'admin') {
            const mockData: LoginResponse = {
                success: true,
                token: 'mock-token-super',
                user: {
                    id: 'mock-super-id',
                    accessCode: 'admin',
                    name: 'Local Super Admin',
                    email: 'super@local.test',
                    role: 'SUPER_ADMIN',
                    schoolId: null,
                    schoolCode: null,
                    requiresPasswordReset: false,
                }
            };

            localStorage.setItem('edcon-token', mockData.token);
            localStorage.setItem('edcon-user', JSON.stringify(mockData.user));
            return mockData;
        }

        if (credentials.accessCode === 'school' && credentials.password === 'school') {
            const mockData: LoginResponse = {
                success: true,
                token: 'mock-token-school',
                user: {
                    id: 'mock-school-id',
                    accessCode: 'school',
                    name: 'Local School Admin',
                    email: 'school@local.test',
                    role: 'SCHOOL_ADMIN',
                    schoolId: 'mock-school-id',
                    schoolCode: 'MOCK123',
                    requiresPasswordReset: false,
                }
            };

            localStorage.setItem('edcon-token', mockData.token);
            localStorage.setItem('edcon-user', JSON.stringify(mockData.user));
            return mockData;
        }

        const { data } = await api.post<LoginResponse>('/auth/login', credentials);

        // Store token and user
        localStorage.setItem('edcon-token', data.token);
        localStorage.setItem('edcon-user', JSON.stringify(data.user));

        if (data.user.schoolCode) {
            localStorage.setItem('edcon-school-code', data.user.schoolCode);
        }

        return data;
    }

    async resetPassword(passwords: ResetPasswordData): Promise<void> {
        await api.post('/auth/reset-password', passwords);

        // Update user state to not require password reset
        const user = this.getUser();
        if (user) {
            user.requiresPasswordReset = false;
            localStorage.setItem('edcon-user', JSON.stringify(user));
        }
    }

    logout(): void {
        localStorage.removeItem('edcon-token');
        localStorage.removeItem('edcon-user');
        localStorage.removeItem('edcon-school-code');
    }

    getToken(): string | null {
        return localStorage.getItem('edcon-token');
    }

    getUser(): User | null {
        const userStr = localStorage.getItem('edcon-user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getToken() && !!this.getUser();
    }

    isAdmin(): boolean {
        const user = this.getUser();
        return user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'ADMIN';
    }

    isSuperAdmin(): boolean {
        return this.getUser()?.role === 'SUPER_ADMIN';
    }

    isSchoolAdmin(): boolean {
        const user = this.getUser();
        return user?.role === 'SCHOOL_ADMIN' || user?.role === 'ADMIN';
    }
}

export const authService = new AuthService();
export default authService;
