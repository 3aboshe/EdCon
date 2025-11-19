import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Get all grades
router.get('/', async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      where: { schoolId: req.school.id },
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
      where: { studentId, schoolId: req.school.id },
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
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { studentId, subject, assignment, marksObtained, maxMarks, type, date, examId } = req.body;

    console.log('=== ADD GRADE DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Parsed data:', { studentId, subject, assignment, marksObtained, maxMarks, type, date, examId });

    const student = await prisma.user.findFirst({ where: { id: studentId, schoolId: req.school.id } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school' });
    }

    const newGrade = await prisma.grade.create({
      data: {
        studentId,
        schoolId: req.school.id,
        subject,
        assignment,
        marksObtained,
        maxMarks,
        type,
        date: date ? new Date(date) : undefined,
        examId
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
router.put('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const grade = await prisma.grade.findFirst({ where: { id, schoolId: req.school.id } });
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    const updatedGrade = await prisma.grade.update({
      where: { id: grade.id },
      data: updateData
    });

    res.json(updatedGrade);
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a grade
router.delete('/:id', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const grade = await prisma.grade.findFirst({ where: { id, schoolId: req.school.id } });
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await prisma.grade.delete({
      where: { id: grade.id }
    });

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 