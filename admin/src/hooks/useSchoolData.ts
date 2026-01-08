import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type { CreateUserData } from '../services/userService';
import { academicService } from '../services/academicService';
import type { Class, Subject } from '../services/academicService';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../services/dashboardService';

// Keys
export const QUERY_KEYS = {
    users: (role?: string) => ['users', role || 'all'],
    classes: ['classes'],
    subjects: ['subjects'],
    dashboard: ['dashboard', 'school'],
    user: (id: string) => ['user', id],
};

// -- USERS --

export function useUsers(role?: string) {
    return useQuery({
        queryKey: QUERY_KEYS.users(role),
        queryFn: async () => {
            try {
                // If dashboardService has a capable getUsers(role), use it, otherwise userService
                // userService.getUsers(role) is defined in your existing code
                const users = await userService.getUsers({ role });
                return users || [];
            } catch (error) {
                console.error(`Failed to fetch users [${role}]`, error);
                return [];
            }
        },
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserData) => userService.createUser(data),
        onSuccess: (_, variables) => {
            // Invalidate relevant user lists
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users(variables.role) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => userService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
        },
    });
}

// -- ACADEMIC --

export function useClasses() {
    return useQuery({
        queryKey: QUERY_KEYS.classes,
        queryFn: async () => {
            try {
                const data = await academicService.getClasses();
                return data || [];
            } catch (error) {
                console.error('Failed to fetch classes', error);
                return [];
            }
        },
    });
}

export function useSubjects() {
    return useQuery({
        queryKey: QUERY_KEYS.subjects,
        queryFn: async () => {
            try {
                const data = await academicService.getSubjects();
                return data || [];
            } catch (error) {
                console.error('Failed to fetch subjects', error);
                return [];
            }
        },
    });
}

// -- DASHBOARD --

export function useSchoolDashboard() {
    return useQuery({
        queryKey: QUERY_KEYS.dashboard,
        queryFn: async () => {
            try {
                return await dashboardService.getSchoolDashboard();
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
                // Return fallback empty stats to prevent crashes
                return {
                    totalStudents: 0,
                    totalTeachers: 0,
                    totalParents: 0,
                    totalClasses: 0,
                    activeHomework: 0,
                    attendanceRate: 0,
                } as DashboardStats;
            }
        },
    });
}
