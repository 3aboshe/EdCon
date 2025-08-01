import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const testDatabase = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`📊 Found ${users.length} users in database`);
    
    // Check classes
    const classes = await prisma.class.findMany();
    console.log(`📚 Found ${classes.length} classes in database`);
    
    // Check subjects
    const subjects = await prisma.subject.findMany();
    console.log(`📖 Found ${subjects.subject} subjects in database`);
    
    // Check parents specifically
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' }
    });
    console.log(`👨‍👩‍👧‍👦 Found ${parents.length} parents in database`);
    
    // Check students
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' }
    });
    console.log(`👨‍🎓 Found ${students.length} students in database`);
    
    // Check teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' }
    });
    console.log(`👨‍🏫 Found ${teachers.length} teachers in database`);
    
    // Show parent-child relationships
    console.log('\n🔗 Parent-Child Relationships:');
    for (const parent of parents) {
      console.log(`${parent.name} (${parent.id}) -> Children: ${parent.childrenIds?.join(', ') || 'None'}`);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

testDatabase(); 