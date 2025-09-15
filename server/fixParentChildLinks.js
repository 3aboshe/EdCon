import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const fixParentChildLinks = async () => {
  try {
    console.log('Fixing parent-child relationships...');
    
    // Get parent P712
    const parent = await prisma.user.findUnique({
      where: { id: 'P712' }
    });
    
    if (!parent) {
      console.log('Parent P712 not found');
      return;
    }
    
    console.log('Parent P712 found:', parent.name);
    console.log('Parent childrenIds:', parent.childrenIds);
    
    if (parent.childrenIds && parent.childrenIds.length > 0) {
      for (const childId of parent.childrenIds) {
        console.log(`Updating student ${childId} to have parentId: P712`);
        
        const updatedStudent = await prisma.user.update({
          where: { id: childId },
          data: { parentId: 'P712' }
        });
        
        console.log(`Updated student: ${updatedStudent.name} now has parentId: ${updatedStudent.parentId}`);
      }
    }
    
    console.log('Parent-child relationships fixed!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

fixParentChildLinks();
