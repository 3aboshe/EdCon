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
    
    // Enhanced connection options for Railway
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Give it 30 seconds to find server
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      bufferCommands: true, // Re-enable buffering to queue commands until connected
      bufferMaxEntries: 0, // Disable mongoose buffering
      maxPoolSize: 5, // Smaller pool size for Railway
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    conn.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    conn.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
    });
    
    conn.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('🔍 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.error('🔍 Error type:', error.name);
    console.error('🔍 Error message:', error.message);
    throw error;
  }
};

export default connectDB; 