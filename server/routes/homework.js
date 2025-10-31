import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// Get all homework
router.get('/', async (req, res) => {
  try {
    const homework = await prisma.homework.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get homework by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const homework = await prisma.homework.findMany({
      where: {
        teacherId: teacherId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework by teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get homework by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // First, get the student to find their classIds
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get homework assigned to any of the student's classes
    const homework = await prisma.homework.findMany({
      where: {
        OR: [
          // Homework assigned to the student's class
          { classIds: { has: student.classId } },
          // Or homework assigned to all classes (empty array means all classes)
          { classIds: { equals: [] } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework by student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create homework
router.post('/', async (req, res) => {
  try {
    const { title, subject, dueDate, assignedDate, teacherId, classIds } = req.body;
    
    // Generate a unique ID for the homework
    const homeworkId = `HW${Date.now()}`;
    
    const newHomework = await prisma.homework.create({
      data: {
        id: homeworkId,
        title,
        subject,
        dueDate,
        assignedDate,
        teacherId,
        classIds: classIds || []
      }
    });
    
    res.status(201).json(newHomework);
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update homework
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedHomework = await prisma.homework.update({
      where: {
        id: id
      },
      data: updateData
    });
    
    if (!updatedHomework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    
    res.json(updatedHomework);
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete homework
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedHomework = await prisma.homework.delete({
      where: {
        id: id
      }
    });
    
    if (!deletedHomework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 