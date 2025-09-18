import React, { createContext } from 'react';
import { User, Student, Class, Teacher, Subject, Grade, Homework, Announcement, Attendance, Message, TimetableEntry } from '../types';

export interface AppContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
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
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
    setHomework: React.Dispatch<React.SetStateAction<Homework[]>>;
    setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
    setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setTimetable: React.Dispatch<React.SetStateAction<TimetableEntry[]>>;
    updateUserAvatar: (userId: string, avatarDataUrl: string) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
}

const defaultContextValue: AppContextType = {
    user: null,
    login: () => {},
    logout: () => {},
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
    updateUserAvatar: () => {},
    updateUser: () => {},
};

export const AppContext = createContext<AppContextType>(defaultContextValue);
