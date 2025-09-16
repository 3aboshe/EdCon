
export enum UserRole {
  Parent = 'parent',
  Teacher = 'teacher',
  Admin = 'admin',
  Student = 'student'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  childrenIds?: string[];
  classIds?: string[];
  messagingAvailability?: {
    startTime: string;
    endTime: string;
  };
}

export interface Student {
  id: string;
  name: string;
  grade: number;
  classId: string;
  parentId: string;
  avatar: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  classIds?: string[];
}

export interface Grade {
  id?: string;
  studentId: string;
  subject: string;
  assignment: string;
  marksObtained: number;
  maxMarks: number;
  date: string;
  type?: 'quiz' | 'test' | 'homework' | 'project' | 'exam';
  teacherId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  teacherId: string;
  classIds: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  assignedDate: string;
  teacherId: string;
  classIds: string[];
  submitted: string[]; // list of student IDs who submitted
}

export interface Attendance {
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export interface Class {
    id: string;
    name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: string; // ISO string
  isRead: boolean;
  type: 'text' | 'voice';
  content?: string;
  audioSrc?: string;
}

export interface TimetableEntry {
  classId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  time: string; // e.g., '09:00 - 10:00'
  subject: string;
}