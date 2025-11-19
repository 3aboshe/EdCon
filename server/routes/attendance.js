import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Get all attendance
router.get('/', async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { schoolId: req.school.id },
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
      where: { studentId, schoolId: req.school.id },
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
      where: { date: new Date(date), schoolId: req.school.id },
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
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { date, studentId, status } = req.body;

    const student = await prisma.user.findFirst({ where: { id: studentId, schoolId: req.school.id } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school' });
    }
    
    const newAttendance = await prisma.attendance.create({
      data: {
        date: new Date(date),
        studentId,
        status,
        schoolId: req.school.id
      }
    });
    
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error('Add attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update attendance
router.put('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const attendance = await prisma.attendance.findFirst({ where: { id, schoolId: req.school.id } });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: updateData
    });

    res.json(updatedAttendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete attendance
router.delete('/:id', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findFirst({ where: { id, schoolId: req.school.id } });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await prisma.attendance.delete({
      where: { id: attendance.id }
    });

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 