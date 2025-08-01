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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Connect to MongoDB
connectDB();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app', 'https://your-frontend-domain.netlify.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'EdCon API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 