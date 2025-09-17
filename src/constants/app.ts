export const APP_NAME = "EdCona";

export const API_ENDPOINTS = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://edcon-production.up.railway.app/api'
    : 'http://localhost:3000/api'
};

export const SESSION_CONFIG = {
  COOKIE_EXPIRY_DAYS: 30,
  ACTIVITY_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  POLLING_INTERVAL: 30 * 1000, // 30 seconds
  HIDDEN_POLLING_INTERVAL: 60 * 1000, // 1 minute when hidden
};

export const ROUTES = {
  LOGIN: '/login',
  PARENT: '/parent',
  TEACHER: '/teacher',
  ADMIN: '/admin',
  STUDENT: '/student',
  ROOT: '/',
} as const;
