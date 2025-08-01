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
    
    // Log the actual URI (first part only for security)
    const uriParts = process.env.MONGODB_URI.split('@');
    console.log('🔍 Connecting to cluster:', uriParts[1] ? uriParts[1].split('/')[0] : 'unknown');
    
    // Railway-optimized connection options for MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // Reduced timeout
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      bufferCommands: true,
      bufferMaxEntries: 0,
      maxPoolSize: 3, // Even smaller pool for Railway
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      family: 4, // Force IPv4 for Railway compatibility
      // Railway-specific options
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`🔌 Connection state: ${conn.connection.readyState}`);
    
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
    console.error('🔍 Error code:', error.code);
    throw error;
  }
};

export default connectDB; 