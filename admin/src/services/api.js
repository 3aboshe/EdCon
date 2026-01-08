import axios from 'axios';

// Use Railway production API or local development
const API_URL = import.meta.env.VITE_API_URL || 'https://edcon-production.up.railway.app/api';

// Create axios instance with base config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('edcon-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add school code header for school admins
        const schoolCode = localStorage.getItem('edcon-school-code');
        if (schoolCode) {
            config.headers['x-edcon-school-code'] = schoolCode;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 - unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('edcon-token');
            localStorage.removeItem('edcon-user');
            localStorage.removeItem('edcon-school-code');
            window.location.href = '/login';
        }

        // Extract error message
        const message = error.response?.data?.message || error.message || 'An error occurred';

        return Promise.reject(new Error(message));
    }
);

export default api;
