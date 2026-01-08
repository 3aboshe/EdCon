import api from './api';

class AuthService {
    async login(credentials) {
        const { data } = await api.post('/auth/login', credentials);

        // Store token and user
        localStorage.setItem('edcon-token', data.token);
        localStorage.setItem('edcon-user', JSON.stringify(data.user));

        if (data.user.schoolCode) {
            localStorage.setItem('edcon-school-code', data.user.schoolCode);
        }

        return data;
    }

    async resetPassword(passwords) {
        await api.post('/auth/reset-password', passwords);

        // Update user state to not require password reset
        const user = this.getUser();
        if (user) {
            user.requiresPasswordReset = false;
            localStorage.setItem('edcon-user', JSON.stringify(user));
        }
    }

    logout() {
        localStorage.removeItem('edcon-token');
        localStorage.removeItem('edcon-user');
        localStorage.removeItem('edcon-school-code');
    }

    getToken() {
        return localStorage.getItem('edcon-token');
    }

    getUser() {
        const userStr = localStorage.getItem('edcon-user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    isAuthenticated() {
        return !!this.getToken() && !!this.getUser();
    }

    isAdmin() {
        const user = this.getUser();
        return user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'ADMIN';
    }

    isSuperAdmin() {
        return this.getUser()?.role === 'SUPER_ADMIN';
    }

    isSchoolAdmin() {
        const user = this.getUser();
        return user?.role === 'SCHOOL_ADMIN' || user?.role === 'ADMIN';
    }
}

export const authService = new AuthService();
export default authService;
