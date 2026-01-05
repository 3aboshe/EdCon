import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Get all exams
router.get('/', async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { schoolId: req.school.id },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exams by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const exams = await prisma.exam.findMany({
      where: {
        teacherId: teacherId,
        schoolId: req.school.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams by teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await prisma.exam.findFirst({
      where: { id, schoolId: req.school.id }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create exam
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { title, date, maxScore, teacherId, classId, subject } = req.body;

    if (!title || !date || !maxScore) {
      return res.status(400).json({ message: 'Title, date, and max score are required' });
    }

    let resolvedTeacherId = teacherId;
    if (req.user.role === 'TEACHER') {
      resolvedTeacherId = req.user.id;
    }

    if (!resolvedTeacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    const teacher = await prisma.user.findFirst({
      where: { id: resolvedTeacherId, schoolId: req.school.id }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this school' });
    }

    if (classId) {
      const klass = await prisma.class.findFirst({ where: { id: classId, schoolId: req.school.id } });
      if (!klass) {
        return res.status(404).json({ message: 'Class not found in this school' });
      }
    }

    // Require classId since it's a required field in the schema
    if (!classId) {
      return res.status(400).json({ message: 'Class is required for exam creation' });
    }

    // Generate a unique ID for the exam
    const examId = `EX${Date.now()}`;

    const newExam = await prisma.exam.create({
      data: {
        id: examId,
        title,
        date: new Date(date),
        maxScore: parseInt(maxScore),
        teacherId: resolvedTeacherId,
        classId,
        subject: subject || teacher.subject || 'General',
        schoolId: req.school.id
      }
    });

    res.status(201).json(newExam);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update exam
router.put('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, maxScore, classId, subject } = req.body;

    const exam = await prisma.exam.findFirst({ where: { id, schoolId: req.school.id } });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const updatedExam = await prisma.exam.update({
      where: { id: exam.id },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
        classId,
        subject
      }
    });

    res.json(updatedExam);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete exam
router.delete('/:id', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findFirst({ where: { id, schoolId: req.school.id } });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await prisma.exam.delete({
      where: { id: exam.id }
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exam grades
router.get('/:id/grades', async (req, res) => {
  try {
    const { id } = req.params;

    const grades = await prisma.grade.findMany({
      where: { examId: id, schoolId: req.school.id },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(grades);
  } catch (error) {
    console.error('Error fetching exam grades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
