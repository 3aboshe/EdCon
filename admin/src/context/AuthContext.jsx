import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from storage
    useEffect(() => {
        const storedUser = authService.getUser();
        if (storedUser && authService.getToken()) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (credentials) => {
        const response = await authService.login(credentials);

        // Check if user has admin role
        const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'];
        if (!allowedRoles.includes(response.user.role)) {
            authService.logout();
            throw new Error('Access denied. Admin privileges required.');
        }

        setUser(response.user);

        // Return full response so LoginPage can check requiresPasswordReset
        return response;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    const resetPassword = useCallback(async (data) => {
        await authService.resetPassword(data);
        // Update local user state
        setUser(prev => prev ? { ...prev, requiresPasswordReset: false } : null);
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isSchoolAdmin: user?.role === 'SCHOOL_ADMIN' || user?.role === 'ADMIN',
        login,
        logout,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
