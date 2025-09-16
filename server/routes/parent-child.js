import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// Assign student to parent
router.post('/assign-student', async (req, res) => {
  try {
    const { studentId, parentId } = req.body;
    
    console.log('=== ASSIGN STUDENT TO PARENT ===');
    console.log('Student ID:', studentId);
    console.log('Parent ID:', parentId);
    
    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });
    
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentId }
    });
    
    if (!parent || parent.role !== 'PARENT') {
      return res.status(404).json({ message: 'Parent not found' });
    }
    
    // Update student's parentId
    await prisma.user.update({
      where: { id: studentId },
      data: { parentId: parentId }
    });
    
    // Update parent's childrenIds array
    const currentChildrenIds = parent.childrenIds || [];
    if (!currentChildrenIds.includes(studentId)) {
      await prisma.user.update({
        where: { id: parentId },
        data: {
          childrenIds: [...currentChildrenIds, studentId]
        }
      });
    }
    
    console.log(`Successfully assigned student ${student.name} to parent ${parent.name}`);
    
    res.json({ 
      success: true, 
      message: `Student ${student.name} assigned to parent ${parent.name}` 
    });
    
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Remove student from parent
router.post('/unassign-student', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    console.log('=== UNASSIGN STUDENT FROM PARENT ===');
    console.log('Student ID:', studentId);
    
    // Get current student
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });
    
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const oldParentId = student.parentId;
    
    // Remove parentId from student
    await prisma.user.update({
      where: { id: studentId },
      data: { parentId: null }
    });
    
    // Remove student from old parent's childrenIds
    if (oldParentId) {
      const oldParent = await prisma.user.findUnique({
        where: { id: oldParentId }
      });
      
      if (oldParent) {
        const updatedChildrenIds = (oldParent.childrenIds || []).filter(id => id !== studentId);
        await prisma.user.update({
          where: { id: oldParentId },
          data: { childrenIds: updatedChildrenIds }
        });
      }
    }
    
    console.log(`Successfully unassigned student ${student.name} from parent`);
    
    res.json({ 
      success: true, 
      message: `Student ${student.name} unassigned from parent` 
    });
    
  } catch (error) {
    console.error('Unassign student error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all parent-child relationships
router.get('/relationships', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        parentId: true,
        classId: true
      }
    });
    
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
      select: {
        id: true,
        name: true,
        childrenIds: true
      }
    });
    
    res.json({ students, parents });
    
  } catch (error) {
    console.error('Get relationships error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;
