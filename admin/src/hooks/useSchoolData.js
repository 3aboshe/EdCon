import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { academicService } from '../services/academicService';
import { dashboardService } from '../services/dashboardService';

// Keys
export const QUERY_KEYS = {
    users: (role) => ['users', role || 'all'],
    classes: ['classes'],
    subjects: ['subjects'],
    dashboard: ['dashboard', 'school'],
    user: (id) => ['user', id],
};

// -- USERS --

export function useUsers(role) {
    return useQuery({
        queryKey: QUERY_KEYS.users(role),
        queryFn: async () => {
            try {
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
        mutationFn: (data) => userService.createUser(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users(variables.role) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => userService.deleteUser(id),
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
                return {
                    totalStudents: 0,
                    totalTeachers: 0,
                    totalParents: 0,
                    totalClasses: 0,
                    activeHomework: 0,
                    attendanceRate: 0,
                };
            }
        },
    });
}
