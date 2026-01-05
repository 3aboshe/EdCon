import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Get all homework
router.get('/', async (req, res) => {
  try {
    const homework = await prisma.homework.findMany({
      where: { schoolId: req.school.id },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get homework by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const homework = await prisma.homework.findMany({
      where: {
        teacherId: teacherId,
        schoolId: req.school.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework by teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get homework by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // First, get the student to find their classIds
    const student = await prisma.user.findFirst({
      where: { id: studentId, schoolId: req.school.id }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get homework assigned to any of the student's classes
    const homework = await prisma.homework.findMany({
      where: {
        schoolId: req.school.id,
        OR: [
          // Homework assigned to the student's class
          { classIds: { has: student.classId } },
          // Or homework assigned to all classes (empty array means all classes)
          { classIds: { equals: [] } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework by student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create homework
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { title, subject, dueDate, assignedDate, teacherId, classIds } = req.body;

    if (!title || !subject || !dueDate) {
      return res.status(400).json({ message: 'Title, subject, and due date are required' });
    }

    let resolvedTeacherId = teacherId;
    if (req.user.role === 'TEACHER') {
      resolvedTeacherId = req.user.id;
    }

    if (!resolvedTeacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    const teacher = await prisma.user.findFirst({ where: { id: resolvedTeacherId, schoolId: req.school.id } });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found in this school' });
    }

    if (Array.isArray(classIds) && classIds.length > 0) {
      const classes = await prisma.class.findMany({
        where: {
          id: { in: classIds },
          schoolId: req.school.id
        }
      });

      if (classes.length !== classIds.length) {
        // Some IDs might be invalid or not belong to school
        // return res.status(400).json({ message: 'One or more classes not found or do not belong to this school' });
        // Or just proceed with valid ones if that's preferred, but strict is better
        console.warn(`Mismatch in classes found. Requested ${classIds.length}, found ${classes.length}`);
      }
    }

    // Generate a unique ID for the homework
    const homeworkId = `HW${Date.now()}`;

    const newHomework = await prisma.homework.create({
      data: {
        id: homeworkId,
        title,
        subject,
        dueDate: new Date(dueDate),
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        teacherId: resolvedTeacherId,
        classIds: classIds || [],
        schoolId: req.school.id
      }
    });

    res.status(201).json(newHomework);
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update homework
router.put('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const homework = await prisma.homework.findFirst({ where: { id, schoolId: req.school.id } });
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    if (updateData.assignedDate) {
      updateData.assignedDate = new Date(updateData.assignedDate);
    }

    const updatedHomework = await prisma.homework.update({
      where: {
        id: homework.id
      },
      data: updateData
    });

    res.json(updatedHomework);
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete homework
router.delete('/:id', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const homework = await prisma.homework.findFirst({ where: { id, schoolId: req.school.id } });
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    await prisma.homework.delete({
      where: {
        id: homework.id
      }
    });

    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update homework submission
router.put('/:id/submission', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, status } = req.body;

    // Get the homework
    const homework = await prisma.homework.findFirst({
      where: { id, schoolId: req.school.id }
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Get current submitted list
    let submitted = homework.submitted || [];

    if (status === 'submitted') {
      // Add student to submitted list if not already there
      if (!submitted.includes(studentId)) {
        submitted.push(studentId);
      }
    } else {
      // Remove student from submitted list
      submitted = submitted.filter(sId => sId !== studentId);
    }

    // Update homework with new submitted list
    const updatedHomework = await prisma.homework.update({
      where: { id: homework.id },
      data: {
        submitted: submitted
      }
    });

    res.json({ message: 'Submission status updated', homework: updatedHomework });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 