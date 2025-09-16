import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// Get all attendance
router.get('/', async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance by student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { date },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new attendance record
router.post('/', async (req, res) => {
  try {
    const { date, studentId, status } = req.body;
    
    const newAttendance = await prisma.attendance.create({
      data: {
        date,
        studentId,
        status
      }
    });
    
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error('Add attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update attendance
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: updateData
    });
    
    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete attendance
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAttendance = await prisma.attendance.delete({
      where: { id }
    });
    
    if (!deletedAttendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 