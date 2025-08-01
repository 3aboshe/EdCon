import express from 'express';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// Get all attendance
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find({}).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendance = await Attendance.find({ studentId }).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const attendance = await Attendance.find({ date });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new attendance record
router.post('/', async (req, res) => {
  try {
    const { date, studentId, status } = req.body;
    
    const newAttendance = new Attendance({
      date,
      studentId,
      status
    });
    
    const savedAttendance = await newAttendance.save();
    res.status(201).json(savedAttendance);
  } catch (error) {
    console.error('Add attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete attendance
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAttendance = await Attendance.findByIdAndDelete(id);
    
    if (!deletedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 