import express from 'express';
import Grade from '../models/Grade.js';

const router = express.Router();

// Get all grades
router.get('/', async (req, res) => {
  try {
    const grades = await Grade.find({}).sort({ date: -1 });
    res.json(grades);
  } catch (error) {
    console.error('Get all grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get grades for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const grades = await Grade.find({ studentId }).sort({ date: -1 });
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
    
    const newGrade = new Grade({
      studentId,
      subject,
      assignment,
      marksObtained,
      maxMarks,
      type
    });
    
    const savedGrade = await newGrade.save();
    res.status(201).json(savedGrade);
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
    
    const updatedGrade = await Grade.findByIdAndUpdate(id, updateData, { new: true });
    
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
    
    const deletedGrade = await Grade.findByIdAndDelete(id);
    
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