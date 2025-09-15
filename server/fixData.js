import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixData() {
  try {
    console.log('🔧 Starting data cleanup and fixes...');

    // 1. Remove duplicate subjects
    console.log('📚 Cleaning up duplicate subjects...');
    
    const subjects = await prisma.subject.findMany();
    console.log('Current subjects:', subjects.map(s => s.name));

    // Keep the first version of each subject, delete duplicates
    const uniqueSubjects = {};
    const toDelete = [];
    
    for (const subject of subjects) {
      const baseName = subject.name.replace(/\s*2\s*$/, ''); // Remove " 2" suffix
      if (!uniqueSubjects[baseName]) {
        uniqueSubjects[baseName] = subject;
      } else {
        toDelete.push(subject.id);
      }
    }

    // Delete duplicate subjects
    for (const subjectId of toDelete) {
      await prisma.subject.delete({ where: { id: subjectId } });
      console.log(`❌ Deleted duplicate subject: ${subjectId}`);
    }

    // 2. Get current classes and their assignments
    console.log('🏫 Checking classes...');
    const classes = await prisma.class.findMany();
    console.log('Current classes:', classes);

    // 3. Fix teacher class assignments
    console.log('👨‍🏫 Fixing teacher class assignments...');
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' }
    });

    for (const teacher of teachers) {
      if (teacher.subject) {
        // Find subject by name
        const subject = await prisma.subject.findFirst({
          where: { name: teacher.subject }
        });

        if (subject) {
          // For now, assign teachers to all classes since we don't have class-subject relationships yet
          // In a real scenario, you'd want to assign based on which classes teach that subject
          const classIds = classes.map(c => c.id);
          
          await prisma.user.update({
            where: { id: teacher.id },
            data: { classIds: classIds }
          });
          
          console.log(`✅ Updated teacher ${teacher.name} (${teacher.subject}) with classes: ${classIds.join(', ')}`);
        } else {
          console.log(`⚠️ Subject "${teacher.subject}" not found for teacher ${teacher.name}`);
        }
      }
    }

    // 4. Fix parent-child relationships
    console.log('👨‍👩‍👧‍👦 Fixing parent-child relationships...');
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' }
    });

    for (const parent of parents) {
      // Find students that should belong to this parent
      const students = await prisma.user.findMany({
        where: { 
          role: 'STUDENT',
          parentId: parent.id 
        }
      });

      const childrenIds = students.map(s => s.id);
      
      await prisma.user.update({
        where: { id: parent.id },
        data: { childrenIds: childrenIds }
      });

      console.log(`✅ Updated parent ${parent.name} with children: ${childrenIds.join(', ')}`);
    }

    // 5. Update students to ensure they have parentId set correctly
    console.log('🎓 Checking student-parent relationships...');
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' }
    });

    for (const student of students) {
      if (!student.parentId) {
        // Find a parent who has this student in their childrenIds
        const parent = await prisma.user.findFirst({
          where: {
            role: 'PARENT',
            childrenIds: { has: student.id }
          }
        });

        if (parent) {
          await prisma.user.update({
            where: { id: student.id },
            data: { parentId: parent.id }
          });
          console.log(`✅ Linked student ${student.name} to parent ${parent.name}`);
        }
      }
    }

    console.log('🎉 Data cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixData();
