import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import subjectRoutes from './routes/subjects.js';
import gradeRoutes from './routes/grades.js';
import examRoutes from './routes/exams.js';
import homeworkRoutes from './routes/homework.js';
import attendanceRoutes from './routes/attendance.js';
import announcementRoutes from './routes/announcements.js';
import messageRoutes from './routes/messages.js';
import parentChildRoutes from './routes/parent-child.js';
import healthRoutes from './routes/health.js';
import backupRoutes from './routes/backup.js';
import schoolRoutes from './routes/schools.js';
import userManagementRoutes from './routes/users.js';

dotenv.config();

const app = express();
// Railway provides PORT environment variable, fallback to 5005 for local dev
const PORT = process.env.PORT || 5005;

console.log('🔧 Port configuration:', {
  PORT_ENV: process.env.PORT,
  FINAL_PORT: PORT,
  NODE_ENV: process.env.NODE_ENV
});

// CORS configuration for production - more flexible
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ed-co.vercel.app',
        'https://ed-co-3aboshes-projects.vercel.app',
        'https://edcon-app.vercel.app',
        'https://edcon-app.netlify.app',
        'https://ed-eb22y6x9n-3aboshes-projects.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5179'],
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
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/parent-child', parentChildRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/backup', backupRoutes);

// File serving route
app.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    console.log('=== FILE DOWNLOAD DEBUG ===');
    console.log('Requested filename:', filename);
    console.log('File path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('File stats:', {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    
    console.log('Serving file:', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ message: 'Error serving file', error: error.message });
  }
});

// Health check routes
app.get('/', (req, res) => {
  res.json({ message: 'EdCon API Server is running!', status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'EdCon API is running!' });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Debug route to check environment
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Debug info',
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    port: PORT,
    corsOrigins: corsOptions.origin,
    database: 'PostgreSQL'
  });
});

// PostgreSQL connection test route
app.get('/api/test-db', async (req, res) => {
  try {
    const { prisma } = await import('./config/db.js');
    
    // Test connection by running a simple query
    const userCount = await prisma.user.count();
    
    res.json({ 
      message: 'Database connection test',
      status: 'connected',
      connected: true,
      userCount: userCount,
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database test failed',
      status: 'disconnected',
      connected: false,
      error: error.message,
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting EdCon server...');
    console.log('📍 Working directory:', process.cwd());
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔌 Port:', PORT);
    console.log('🔑 Database URL set:', !!process.env.DATABASE_URL);
    
    // Connect to PostgreSQL and run migrations
    if (process.env.DATABASE_URL) {
      console.log('🔄 Attempting to connect to PostgreSQL...');
      try {
        await connectDB();
        console.log('✅ PostgreSQL connected successfully');
        
        console.log('⏭️ Skipping automatic schema sync; run prisma migrate deploy during CI/CD');
      } catch (dbError) {
        console.error('❌ PostgreSQL connection failed:', dbError.message);
        console.log('⚠️ Server will start without database');
      }
    }
    
    // Start server with proper Railway configuration
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Database URL set: ${!!process.env.DATABASE_URL}`);
      console.log('🚀 EdCon API is ready!');
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 