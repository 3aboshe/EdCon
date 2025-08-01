import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all grades
router.get('/', async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get grades for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const grades = await prisma.grade.findMany({
      where: { studentId },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(grades);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new grade
router.post('/', async (req, res) => {
  try {
    const { studentId, subject, assignment, marksObtained, maxMarks, type } = req.body;
    
    const newGrade = await prisma.grade.create({
      data: {
        studentId,
        subject,
        assignment,
        marksObtained,
        maxMarks,
        type
      }
    });
    
    res.status(201).json(newGrade);
  } catch (error) {
    console.error('Add grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a grade
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: updateData
    });
    
    if (!updatedGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json(updatedGrade);
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a grade
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedGrade = await prisma.grade.delete({
      where: { id }
    });
    
    if (!deletedGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 