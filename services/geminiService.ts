
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import { Grade, Student, Announcement, Homework, Attendance } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

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

    const prompt = `
        You are an insightful and encouraging educational assistant.
        Analyze the following academic performance data for a student named ${student.name}.
        The data is in JSON format, showing marks obtained versus maximum possible marks for different assignments.
        
        Data:
        ${JSON.stringify(grades)}

        Based on this data, provide a brief summary for their parent. The summary should be in two parts:
        1.  **Strengths**: Identify subjects or assignments where the student is performing well (e.g., scoring above 80%). Be positive and specific.
        2.  **Areas for Improvement**: Identify subjects or assignments where the student's performance is lower (e.g., below 70%). Frame this constructively, suggesting it as an area to focus on.

        Keep the summary concise, clear, and encouraging. Do not invent any information not present in the data.

        IMPORTANT: The entire response MUST be in ${languageName}.
        
        Example Output Format (in the requested language):
        **Strengths:**
        * Excelling in Mathematics, with a high score in the recent Midterm.
        * Strong performance in creative writing assignments.
        
        **Areas for Improvement:**
        * Could focus more on Science quizzes to boost overall marks.
        * It would be beneficial to review grammar concepts for English.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating student summary:", error);
        throw new Error("Failed to generate summary from Gemini API.");
    }
};


export const generateTop5ParentBriefing = async (data: ParentBriefingData, languageName: string): Promise<string> => {
    const prompt = `
        You are an AI assistant for the EdCon school app. Your task is to create a "Top 5 Things to Know" summary for a parent about their child, ${data.student.name}.
        Use the provided JSON data to identify the most critical and recent information.
        
        Data:
        ${JSON.stringify(data)}

        Analyze the data and generate a bulleted list of the top 5 most important items for the parent to see. Prioritize items in this order:
        1. High-priority announcements.
        2. Overdue or upcoming homework (due in the next 3 days).
        3. Recent low marks (below 60%).
        4. Recent attendance issues (absent or late).
        5. Recent high marks (above 90%) or other positive news.

        For each item, provide a very short, clear, and actionable summary.
        If there are fewer than 5 important items, provide as many as are relevant.
        If there are no significant items, return a friendly message like "Things are looking great! No urgent updates for ${data.student.name} right now."
        
        IMPORTANT: The entire response MUST be in ${languageName}.
        
        Example output (in the requested language):
        * **High Priority:** School trip permission slip due tomorrow.
        * **Homework Due Soon:** The Science project is due in 2 days.
        * **Recent Mark:** Scored 55% on the latest Math quiz.
        * **Attendance:** Was marked 'late' on Monday, Oct 23.
        * **Great Work!:** Achieved 95% on the English essay!
    `;
     try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating parent briefing:", error);
        throw new Error("Failed to generate briefing from Gemini API.");
    }
};