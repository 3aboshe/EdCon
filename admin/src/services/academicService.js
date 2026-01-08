import api from './api';

class AcademicService {
    // Classes
    async getClasses() {
        const { data } = await api.get('/classes');
        // Backend returns array directly or wrapped in data property
        return Array.isArray(data) ? data : (data.data || []);
    }

    async createClass(name, subjectIds = []) {
        const { data } = await api.post('/classes', { name, subjectIds });
        return data.class || data;
    }

    async deleteClass(id) {
        await api.delete(`/classes/${id}`);
    }

    // Subjects
    async getSubjects() {
        const { data } = await api.get('/subjects');
        // Backend returns array directly or wrapped in data property
        return Array.isArray(data) ? data : (data.data || []);
    }

    async createSubject(name) {
        const { data } = await api.post('/subjects', { name });
        return data.subject || data;
    }

    async deleteSubject(id) {
        await api.delete(`/subjects/${id}`);
    }

    // Exams
    async getExams() {
        const { data } = await api.get('/exams');
        return data.data;
    }

    async createExam(examData) {
        const { data } = await api.post('/exams', examData);
        return data.data;
    }

    async deleteExam(id) {
        await api.delete(`/exams/${id}`);
    }

    // Homework
    async getHomework() {
        const { data } = await api.get('/homework');
        return data.data;
    }

    async createHomework(homeworkData) {
        const { data } = await api.post('/homework', homeworkData);
        return data.data;
    }

    async deleteHomework(id) {
        await api.delete(`/homework/${id}`);
    }
}

export const academicService = new AcademicService();
export default academicService;
