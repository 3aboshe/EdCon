import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

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
    const { studentId, subject, assignment, marksObtained, maxMarks, type, date } = req.body;
    
    console.log('=== ADD GRADE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Parsed data:', { studentId, subject, assignment, marksObtained, maxMarks, type, date });
    
    const newGrade = await prisma.grade.create({
      data: {
        studentId,
        subject,
        assignment,
        marksObtained,
        maxMarks,
        type,
        date: date ? new Date(date) : undefined
      }
    });
    
    console.log('Created grade:', newGrade);
    res.status(201).json(newGrade);
  } catch (error) {
    console.error('Add grade error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ message: 'Server error', error: error.message });
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