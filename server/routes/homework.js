import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';
import multer from 'multer';
import { sendNotificationToUsers, getParentIdsForClasses } from '../utils/notificationHelper.js';

const router = express.Router();

// Configure multer to store files in memory for database storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and documents
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, Word, Excel, and text files are allowed.'), false);
    }
  }
});

// Serve file from database - PUBLIC endpoint (no auth required)
// Files are accessed by random CUID so they're essentially protected by obscurity
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(file.data, 'base64');

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(buffer);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});

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

// Get single homework by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await prisma.homework.findFirst({
      where: { id, schoolId: req.school.id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    res.json(homework);
  } catch (error) {
    console.error('Error fetching homework by ID:', error);
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
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
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

// Create homework with file upload support
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), upload.array('files', 5), async (req, res) => {
  try {
    const { title, subject, description, dueDate, assignedDate, teacherId, classIds } = req.body;
    const files = req.files || [];

    console.log('=== CREATE HOMEWORK DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Files:', files.length);

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and due date are required' });
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

    // Parse classIds if it's a string
    let parsedClassIds = classIds;
    if (typeof classIds === 'string') {
      try {
        parsedClassIds = JSON.parse(classIds);
      } catch {
        parsedClassIds = [classIds];
      }
    }

    if (Array.isArray(parsedClassIds) && parsedClassIds.length > 0) {
      const classes = await prisma.class.findMany({
        where: {
          id: { in: parsedClassIds },
          schoolId: req.school.id
        }
      });

      if (classes.length !== parsedClassIds.length) {
        console.warn(`Mismatch in classes found. Requested ${parsedClassIds.length}, found ${classes.length}`);
      }
    }

    // Process uploaded files - store in database
    let attachments = [];
    if (files.length > 0) {
      for (const file of files) {
        // Store file in database
        const savedFile = await prisma.file.create({
          data: {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            data: file.buffer.toString('base64'),
            schoolId: req.school.id
          }
        });

        attachments.push({
          id: savedFile.id,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/api/homework/file/${savedFile.id}`
        });
      }
      console.log('Saved attachments to database:', attachments.length, 'files');
    }

    // Generate a unique ID for the homework
    const homeworkId = `HW${Date.now()}`;

    const newHomework = await prisma.homework.create({
      data: {
        id: homeworkId,
        title,
        description: description || null,
        subject: subject || teacher.subject || 'General',
        dueDate: new Date(dueDate),
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        teacherId: resolvedTeacherId,
        classIds: parsedClassIds || [],
        attachments: attachments.length > 0 ? attachments : [],
        schoolId: req.school.id
      }
    });

    // Send push notifications to parents
    const targetClassIds = parsedClassIds && parsedClassIds.length > 0 ? parsedClassIds : [];
    if (targetClassIds.length > 0) {
      const parentIds = await getParentIdsForClasses(req.school.id, targetClassIds);
      sendNotificationToUsers(parentIds, 'homework', { title });
    }

    console.log('Created homework:', newHomework);
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
router.delete('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
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