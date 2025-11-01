import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// Get all exams
router.get('/', async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
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
        teacherId: teacherId
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
    const exam = await prisma.exam.findUnique({
      where: { id }
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
router.post('/', async (req, res) => {
  try {
    const { title, date, maxScore, teacherId, classId, subject } = req.body;

    // Generate a unique ID for the exam
    const examId = `EX${Date.now()}`;

    const newExam = await prisma.exam.create({
      data: {
        id: examId,
        title,
        date,
        maxScore: parseInt(maxScore),
        teacherId,
        classId,
        subject
      }
    });

    res.status(201).json(newExam);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update exam
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, maxScore, classId, subject } = req.body;

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        title,
        date,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
        classId,
        subject
      }
    });

    if (!updatedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(updatedExam);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete exam
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedExam = await prisma.exam.delete({
      where: { id }
    });

    if (!deletedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

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
      where: { examId: id },
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
