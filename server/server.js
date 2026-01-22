import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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
import analyticsRoutes from './routes/analytics.js';
import globalNotificationRoutes from './routes/global-notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import encryptionRoutes from './routes/encryption.js';
import parentDashboardRoutes from './routes/parent-dashboard.js';
import teacherDashboardRoutes from './routes/teacher-dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const isProduction = process.env.NODE_ENV === 'production';

// Security: Helmet adds various HTTP headers for security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow file serving
  contentSecurityPolicy: false, // Disable CSP for API server
}));

// Rate limiting for authentication endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { message: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration - secure in production, flexible in development
const allowedOrigins = [
  'https://ed-co.vercel.app',
  'https://ed-co-3aboshes-projects.vercel.app',
  'https://edcon-app.vercel.app',
  'https://edcon-app.netlify.app',
  'https://ed-eb22y6x9n-3aboshes-projects.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow localhost
    if (!isProduction) {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Check against whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In production, reject unknown web origins
    if (isProduction) {
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }

    // Development fallback
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-edcon-school-code', 'Origin', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply stricter rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Error handling middleware - hide details in production
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const message = isProduction ? 'Server error' : err.message;
  res.status(500).json({ message });
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/global-notifications', globalNotificationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/encryption', encryptionRoutes);
app.use('/api/parent/dashboard', parentDashboardRoutes);
app.use('/api/teacher/dashboard', teacherDashboardRoutes);

// Health check routes (public)
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

// Debug routes - DISABLED in production
if (!isProduction) {
  app.get('/api/debug', (req, res) => {
    res.json({
      message: 'Debug info (development only)',
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      port: PORT,
      database: 'PostgreSQL'
    });
  });

  app.get('/api/test-db', async (req, res) => {
    try {
      const { prisma } = await import('./config/db.js');
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
} else {
  // In production, these routes return 404
  app.get('/api/debug', (req, res) => res.status(404).json({ message: 'Not found' }));
  app.get('/api/test-db', (req, res) => res.status(404).json({ message: 'Not found' }));
}

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