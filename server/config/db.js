import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📝 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 60000, // Increased timeout to 60s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      bufferCommands: true, // Enable buffering for now
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      maxIdleTimeMS: 30000, // Close sockets after 30s of inactivity
      retryWrites: true,
      w: 'majority',
      // Add DNS resolution options
      family: 4, // Force IPv4
      lookup: (hostname, options, callback) => {
        // Custom DNS lookup with timeout
        const dns = require('dns');
        dns.lookup(hostname, { family: 4, timeout: 30000 }, callback);
      }
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('🔍 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    throw error;
  }
};

export default connectDB; 