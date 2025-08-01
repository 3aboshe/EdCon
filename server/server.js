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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Connect to MongoDB with better error handling
connectDB().then(() => {
  console.log('MongoDB connected successfully');
}).catch((error) => {
  console.error('MongoDB connection failed:', error);
});

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ed-co.vercel.app', 'https://your-frontend-domain.vercel.app', 'https://your-frontend-domain.netlify.app']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5176'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

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

// Debug route to check environment
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Debug info',
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
    port: PORT
  });
});

// MongoDB connection test route
app.get('/api/test-db', async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({ 
      message: 'Database connection test',
      state: states[connectionState],
      readyState: connectionState,
      connected: connectionState === 1,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database test failed',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI set: ${!!process.env.MONGODB_URI}`);
}); 