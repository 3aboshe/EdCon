import express from 'express';
import Homework from '../models/Homework.js';

const router = express.Router();

// Get all homework
router.get('/', async (req, res) => {
  try {
    const homework = await Homework.find({}).sort({ assignedDate: -1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get homework by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const homework = await Homework.find({ teacherId }).sort({ assignedDate: -1 });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new homework
router.post('/', async (req, res) => {
  try {
    const { title, subject, dueDate, assignedDate, teacherId, submitted } = req.body;
    
    const newHomework = new Homework({
      id: `HW${Date.now()}`,
      title,
      subject,
      dueDate,
      assignedDate,
      teacherId,
      submitted: submitted || []
    });
    
    const savedHomework = await newHomework.save();
    res.status(201).json(savedHomework);
  } catch (error) {
    console.error('Add homework error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update homework
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedHomework = await Homework.findOneAndUpdate({ id }, updateData, { new: true });
    
    if (!updatedHomework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    
    res.json(updatedHomework);
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete homework
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedHomework = await Homework.findOneAndDelete({ id });
    
    if (!deletedHomework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 