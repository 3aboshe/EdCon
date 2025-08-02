import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    // Check if the attachments column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'attachments'
    `;
    
    if (result.length === 0) {
      console.log('Adding attachments column to messages table...');
      await prisma.$executeRaw`ALTER TABLE messages ADD COLUMN attachments JSONB`;
      console.log('Attachments column added successfully');
    } else {
      console.log('Attachments column already exists');
    }
    
    // Check if FILE type exists in MessageType enum
    const enumResult = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"MessageType")) as enum_value
    `;
    
    const enumValues = enumResult.map(r => r.enum_value);
    console.log('Current MessageType enum values:', enumValues);
    
    if (!enumValues.includes('FILE')) {
      console.log('Adding FILE to MessageType enum...');
      await prisma.$executeRaw`ALTER TYPE "MessageType" ADD VALUE 'FILE'`;
      console.log('FILE enum value added successfully');
    } else {
      console.log('FILE enum value already exists');
    }
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSchema(); 