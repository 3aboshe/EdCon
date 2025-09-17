import React, { createContext } from 'react';
import { User, Student, Class, Teacher, Subject, Grade, Homework, Announcement, Attendance, Message, TimetableEntry } from '../types';

export interface AppContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    lang: string;
    setLang: (lang: string) => void;
    t: (key: string, replacements?: Record<string, string>) => string;
    dir: 'ltr' | 'rtl';
    // Data
    users: User[];
    students: Student[];
    classes: Class[];
    teachers: Teacher[];
    subjects: Subject[];
    grades: Grade[];
    homework: Homework[];
    announcements: Announcement[];
    attendance: Attendance[];
    messages: Message[];
    timetable: TimetableEntry[];
    // Setters
    setUsers: (users: User[]) => void;
    setStudents: (students: Student[]) => void;
    setClasses: (classes: Class[]) => void;
    setTeachers: (teachers: Teacher[]) => void;
    setSubjects: (subjects: Subject[]) => void;
    setGrades: (grades: Grade[]) => void;
    setHomework: (homework: Homework[]) => void;
    setAnnouncements: (announcements: Announcement[]) => void;
    setAttendance: (attendance: Attendance[]) => void;
    setMessages: (messages: Message[]) => void;
    setTimetable: (timetable: TimetableEntry[]) => void;
    // Utility functions
    updateUserAvatar: (userId: string, avatarDataUrl: string) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
}

const defaultContextValue: AppContextType = {
    user: null,
    login: () => {},
    logout: () => {},
    lang: 'en',
    setLang: () => {},
    t: (key: string) => key,
    dir: 'ltr',
    // Data
    users: [],
    students: [],
    classes: [],
    teachers: [],
    subjects: [],
    grades: [],
    homework: [],
    announcements: [],
    attendance: [],
    messages: [],
    timetable: [],
    // Setters
    setUsers: () => {},
    setStudents: () => {},
    setClasses: () => {},
    setTeachers: () => {},
    setSubjects: () => {},
    setGrades: () => {},
    setHomework: () => {},
    setAnnouncements: () => {},
    setAttendance: () => {},
    setMessages: () => {},
    setTimetable: () => {},
    // Utility functions
    updateUserAvatar: () => {},
    updateUser: () => {},
};

export const AppContext = createContext<AppContextType>(defaultContextValue);
