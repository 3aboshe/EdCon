import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { id: 'UdBu1F3' }
    });

    if (!admin) {
      // Create admin user
      admin = await prisma.user.create({
        data: {
          id: 'UdBu1F3',
          name: 'Admin',
          role: 'ADMIN',
          avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Admin',
        }
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create some sample classes
    const classes = [
      { id: 'G1A', name: 'Grade 1A' },
      { id: 'G1B', name: 'Grade 1B' },
      { id: 'G2A', name: 'Grade 2A' },
      { id: 'G2B', name: 'Grade 2B' },
    ];

    for (const classData of classes) {
      const existingClass = await prisma.class.findUnique({
        where: { id: classData.id }
      });
      
      if (!existingClass) {
        await prisma.class.create({ data: classData });
        console.log(`✅ Created class: ${classData.name}`);
      }
    }

    // Create some sample subjects
    const subjects = [
      { id: 'MATH', name: 'Mathematics' },
      { id: 'SCI', name: 'Science' },
      { id: 'ENG', name: 'English' },
      { id: 'HIST', name: 'History' },
    ];

    for (const subjectData of subjects) {
      const existingSubject = await prisma.subject.findUnique({
        where: { id: subjectData.id }
      });
      
      if (!existingSubject) {
        await prisma.subject.create({ data: subjectData });
        console.log(`✅ Created subject: ${subjectData.name}`);
      }
    }

    // Create some sample parents
    const parents = [
      { id: 'P001', name: 'Sarah Johnson', role: 'PARENT', avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sarah' },
      { id: 'P002', name: 'Michael Chen', role: 'PARENT', avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Michael' },
      { id: 'P003', name: 'Emily Davis', role: 'PARENT', avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Emily' },
    ];

    for (const parentData of parents) {
      const existingParent = await prisma.user.findUnique({
        where: { id: parentData.id }
      });
      
      if (!existingParent) {
        await prisma.user.create({
          data: {
            ...parentData,
            childrenIds: [],
          }
        });
        console.log(`✅ Created parent: ${parentData.name}`);
      }
    }

    // Create some sample teachers
    const teachers = [
      { id: 'T001', name: 'Dr. Smith', role: 'TEACHER', subject: 'Mathematics', avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Smith', classIds: ['G1A', 'G1B'] },
      { id: 'T002', name: 'Ms. Wilson', role: 'TEACHER', subject: 'Science', avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Wilson', classIds: ['G2A', 'G2B'] },
    ];

    for (const teacherData of teachers) {
      const existingTeacher = await prisma.user.findUnique({
        where: { id: teacherData.id }
      });
      
      if (!existingTeacher) {
        await prisma.user.create({
          data: {
            ...teacherData,
            childrenIds: [],
          }
        });
        console.log(`✅ Created teacher: ${teacherData.name}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    
    // Show summary
    const userCount = await prisma.user.count();
    const classCount = await prisma.class.count();
    const subjectCount = await prisma.subject.count();
    
    console.log(`📊 Summary: ${userCount} users, ${classCount} classes, ${subjectCount} subjects`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase(); 