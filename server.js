import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import gradeRoutes from './routes/grades.js';
import classRoutes from './routes/classes.js';
import subjectRoutes from './routes/subjects.js';
import homeworkRoutes from './routes/homework.js';
import announcementRoutes from './routes/announcements.js';
import attendanceRoutes from './routes/attendance.js';
import messageRoutes from './routes/messages.js';
import mongoose from 'mongoose';

// Environment variables loaded
dotenv.config();

// ... existing code ... 