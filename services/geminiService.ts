
import { Grade, Student, Announcement, Homework, Attendance } from '../types';

interface ParentBriefingData {
    student: Student;
    grades: Grade[];
    homework: Homework[];
    announcements: Announcement[];
    attendance: Attendance[];
}

export const generateStudentSummary = async (student: Student, grades: Grade[], languageName: string): Promise<string> => {
    if (!grades || grades.length === 0) {
        return "No performance data available to generate a summary.";
    }
    
    const averageScore = grades.reduce((sum, grade) => sum + (grade.marksObtained / grade.maxMarks), 0) / grades.length;
    const percentage = Math.round(averageScore * 100);
    
    return `**Student Summary for ${student.name}**\n\n**Overall Performance:** ${percentage}% average across all subjects.\n\n**Recent Activity:** ${grades.length} assignments completed.\n\n*This is a simplified summary. For detailed AI analysis, please contact your teacher.*`;
};

export const generateTop5ParentBriefing = async (data: ParentBriefingData, languageName: string): Promise<string> => {
    const urgentItems = [];
    
    if (data.announcements.length > 0) {
        urgentItems.push("• Check recent announcements from teachers");
    }
    if (data.homework.length > 0) {
        urgentItems.push("• Review upcoming homework assignments");
    }
    if (data.grades.length > 0) {
        urgentItems.push("• Review recent grades and performance");
    }
    if (data.attendance.length > 0) {
        urgentItems.push("• Check attendance records");
    }
    
    if (urgentItems.length === 0) {
        return "Things are looking great! No urgent updates for " + data.student.name + " right now.";
    }
    
    return `**Top Updates for ${data.student.name}:**\n\n${urgentItems.join('\n')}\n\n*This is a simplified summary. For detailed AI analysis, please contact your teacher.*`;
};