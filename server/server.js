import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Health check routes - Railway might check these
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
    database: 'PostgreSQL (Pending Setup)',
    status: 'Server Running - Database Setup Disabled for Testing'
  });
});

// Simple test route
app.get('/api/test-simple', (req, res) => {
  res.json({ 
    message: 'Simple test successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    status: 'ok'
  });
});

// Start server only after MongoDB connection is established
const startServer = async () => {
  try {
    console.log('🚀 Starting EdCon server (minimal mode)...');
    console.log('📍 Working directory:', process.cwd());
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔌 Port:', PORT);
    console.log('🔑 Database URL set:', !!process.env.DATABASE_URL);
    console.log('⚠️  Database operations disabled for testing');
    
    // Start server with proper Railway configuration
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Database URL set: ${!!process.env.DATABASE_URL}`);
      console.log('🚀 EdCon API is ready! (Minimal Mode)');
      console.log(`📡 Health check: https://edcon-production.up.railway.app/api/health`);
      console.log(`🌐 External URL: https://edcon-production.up.railway.app/`);
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