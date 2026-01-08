import api from './api';

export interface Class {
    id: string;
    name: string;
    schoolId: string;
    studentsCount?: number;
}

export interface Subject {
    id: string;
    name: string;
    schoolId: string;
}

export interface Exam {
    id: string;
    title: string;
    date: string;
    subjectId: string;
    classId: string;
    subject?: Subject;
    class?: Class;
}

export interface Homework {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    subjectId: string;
    classId: string;
    subject?: Subject;
    class?: Class;
}

class AcademicService {
    // Classes
    async getClasses(): Promise<Class[]> {
        const { data } = await api.get<{ success: boolean; data: Class[] }>('/classes');
        return data.data;
    }

    async createClass(name: string): Promise<Class> {
        const { data } = await api.post<{ success: boolean; data: Class }>('/classes', { name });
        return data.data;
    }

    async deleteClass(id: string): Promise<void> {
        await api.delete(`/classes/${id}`);
    }

    // Subjects
    async getSubjects(): Promise<Subject[]> {
        const { data } = await api.get<{ success: boolean; data: Subject[] }>('/subjects');
        return data.data;
    }

    async createSubject(name: string): Promise<Subject> {
        const { data } = await api.post<{ success: boolean; data: Subject }>('/subjects', { name });
        return data.data;
    }

    async deleteSubject(id: string): Promise<void> {
        await api.delete(`/subjects/${id}`);
    }

    // Exams
    async getExams(): Promise<Exam[]> {
        const { data } = await api.get<{ success: boolean; data: Exam[] }>('/exams');
        return data.data;
    }

    async createExam(examData: Omit<Exam, 'id' | 'subject' | 'class'>): Promise<Exam> {
        const { data } = await api.post<{ success: boolean; data: Exam }>('/exams', examData);
        return data.data;
    }

    async deleteExam(id: string): Promise<void> {
        await api.delete(`/exams/${id}`);
    }

    // Homework
    async getHomework(): Promise<Homework[]> {
        const { data } = await api.get<{ success: boolean; data: Homework[] }>('/homework');
        return data.data;
    }

    async createHomework(homeworkData: Omit<Homework, 'id' | 'subject' | 'class'>): Promise<Homework> {
        const { data } = await api.post<{ success: boolean; data: Homework }>('/homework', homeworkData);
        return data.data;
    }

    async deleteHomework(id: string): Promise<void> {
        await api.delete(`/homework/${id}`);
    }
}

export const academicService = new AcademicService();
export default academicService;
