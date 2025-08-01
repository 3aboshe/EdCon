import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

let prisma;

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to PostgreSQL with Prisma...');
    console.log('📝 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Initialize Prisma Client
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Test the connection
    await prisma.$connect();
    
    console.log('✅ PostgreSQL Connected successfully');
    console.log('🔌 Prisma Client initialized');
    
    return prisma;
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error);
    console.error('🔍 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.error('🔍 Error type:', error.name);
    console.error('🔍 Error message:', error.message);
    throw error;
  }
};

// Export both the connection function and prisma client
export { prisma };
export default connectDB; 