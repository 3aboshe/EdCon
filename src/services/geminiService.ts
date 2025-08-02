
import { Grade, Student, Announcement, Homework, Attendance } from '../types';

const API_KEY = 'AIzaSyC9P5g50rmDIs-exl46IwNZVK-_miVf8Ms';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface ParentBriefingData {
    student: Student;
    grades: Grade[];
    homework: Homework[];
    announcements: Announcement[];
    attendance: Attendance[];
}

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

export const callGeminiAPI = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        return data.candidates[0]?.content.parts[0]?.text || 'No response from AI';
    } catch (error) {
        console.error('Gemini API error:', error);
        return 'AI service temporarily unavailable. Please try again later.';
    }
};

export const generateStudentSummary = async (student: Student, grades: Grade[], languageName: string): Promise<string> => {
    if (!grades || grades.length === 0) {
        return "No performance data available to generate a summary.";
    }

    const prompt = `Analyze the following student data and provide a comprehensive summary in ${languageName}:

Student: ${student.name}
Grades: ${JSON.stringify(grades)}

Please provide:
1. Overall performance assessment
2. Strengths and areas for improvement
3. Recommendations for academic growth
4. Encouraging message for the student

Keep it concise, professional, and educational.`;

    return await callGeminiAPI(prompt);
};

export const generateTop5ParentBriefing = async (data: ParentBriefingData, languageName: string): Promise<string> => {
    const prompt = `Analyze the following student data and provide the top 5 most important things a parent should know in ${languageName}:

Student: ${data.student.name}
Grades: ${JSON.stringify(data.grades)}
Homework: ${JSON.stringify(data.homework)}
Announcements: ${JSON.stringify(data.announcements)}
Attendance: ${JSON.stringify(data.attendance)}

Please provide exactly 5 key points that are most important for the parent to know, prioritized by urgency and importance. Format as a numbered list with brief explanations.`;

    return await callGeminiAPI(prompt);
};

export const generateAcademicInsights = async (grades: Grade[], languageName: string): Promise<string> => {
    if (!grades || grades.length === 0) {
        return "No academic data available for analysis.";
    }

    const prompt = `Analyze the following academic performance data and provide insights in ${languageName}:

Grades: ${JSON.stringify(grades)}

Please provide:
1. Performance trends
2. Subject strengths and weaknesses
3. Improvement suggestions
4. Academic recommendations

Keep it educational and actionable.`;

    return await callGeminiAPI(prompt);
};

export const generateAttendanceAnalysis = async (attendance: Attendance[], languageName: string): Promise<string> => {
    if (!attendance || attendance.length === 0) {
        return "No attendance data available for analysis.";
    }

    const prompt = `Analyze the following attendance data and provide insights in ${languageName}:

Attendance: ${JSON.stringify(attendance)}

Please provide:
1. Attendance patterns
2. Areas of concern
3. Recommendations for improvement
4. Positive reinforcement for good attendance

Keep it encouraging and constructive.`;

    return await callGeminiAPI(prompt);
};

export const generateHomeworkSummary = async (homework: Homework[], languageName: string): Promise<string> => {
    if (!homework || homework.length === 0) {
        return "No homework data available for analysis.";
    }

    const prompt = `Analyze the following homework data and provide a summary in ${languageName}:

Homework: ${JSON.stringify(homework)}

Please provide:
1. Upcoming deadlines
2. Completion status overview
3. Priority assignments
4. Study recommendations

Keep it organized and actionable.`;

    return await callGeminiAPI(prompt);
};