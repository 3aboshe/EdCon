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

// CORS configuration for production - more flexible
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ed-co.vercel.app',
        'https://ed-co-3aboshes-projects.vercel.app',
        'https://edcon-app.vercel.app',
        'https://edcon-app.netlify.app',
        'https://ed-eb22y6x9n-3aboshes-projects.vercel.app', // Added this URL
        process.env.FRONTEND_URL // Allow environment variable override
      ].filter(Boolean) // Remove undefined values
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5176', 'http://localhost:5177'],
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
app.get('/', (req, res) => {
  res.json({ message: 'EdCon API Server is running!', status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'EdCon API is running!' });
});

// Debug route to check environment
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Debug info',
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
    port: PORT,
    corsOrigins: corsOptions.origin
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

// Start server only after MongoDB connection is established
const startServer = async () => {
  try {
    console.log('🚀 Starting EdCon server...');
    console.log('📍 Working directory:', process.cwd());
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔌 Port:', PORT);
    console.log('🔑 MongoDB URI set:', !!process.env.MONGODB_URI);
    console.log('📋 All env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    
    // Only try to connect to MongoDB if URI is provided
    if (process.env.MONGODB_URI) {
      console.log('🔄 Attempting to connect to MongoDB...');
      
      // Try initial connection but don't block server startup
      try {
        await connectDB();
        console.log('✅ MongoDB connected successfully on startup');
      } catch (dbError) {
        console.error('❌ Initial MongoDB connection failed:', dbError.message);
        console.log('⚠️  Server will start and continue trying to connect in background');
        
        // Continue trying to connect in background
        const retryConnection = async () => {
          let retries = 10;
          while (retries > 0) {
            try {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
              await connectDB();
              console.log('✅ MongoDB connected successfully (background retry)');
              break;
            } catch (error) {
              retries--;
              console.log(`🔄 Background MongoDB retry failed, ${retries} attempts remaining`);
            }
          }
        };
        
        // Don't await this - let it run in background
        retryConnection();
      }
    } else {
      console.log('❌ No MongoDB URI provided, skipping database connection');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ MongoDB URI set: ${!!process.env.MONGODB_URI}`);
      console.log('🚀 EdCon API is ready!');
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
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