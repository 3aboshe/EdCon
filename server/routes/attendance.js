import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';
import { sendNotificationToUser, getParentIdForStudent, getLocalizedAttendanceStatus } from '../utils/notificationHelper.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Get all attendance with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { schoolId: req.school.id },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.attendance.count({ where: { schoolId: req.school.id } })
    ]);

    res.json({
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance by student (optimized - single query with includes)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Single query with all includes - fixes N+1 query problem
    const attendance = await prisma.attendance.findMany({
      where: { studentId, schoolId: req.school.id },
      include: {
        student: {
          select: { id: true, name: true }
        },
        teacher: {
          select: { id: true, name: true, subject: true }
        },
        class: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match existing response format (teacher/class nested objects)
    const attendanceWithTeacher = attendance.map((att) => ({
      ...att,
      teacher: att.teacher || null,
      class: att.class || null
    }));

    res.json(attendanceWithTeacher);
  } catch (error) {
    console.error('Error fetching attendance by student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { classId } = req.query;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const whereClause = {
      date: attendanceDate,
      schoolId: req.school.id
    };

    // Optionally filter by classId
    if (classId) {
      whereClause.classId = classId;
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
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

// Add or update attendance record (upsert)
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { date, studentId, status, classId, teacherId } = req.body;

    const normalizedStatus = String(status || '').toUpperCase();
    const allowedStatuses = new Set(['PRESENT', 'ABSENT', 'LATE']);
    if (!allowedStatuses.has(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    const student = await prisma.user.findFirst({ where: { id: studentId, schoolId: req.school.id, role: 'STUDENT' } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school' });
    }

    const attendanceDate = new Date(date);
    // Set time to midnight for consistent date comparison
    attendanceDate.setHours(0, 0, 0, 0);

    // Try to find existing attendance record for this student on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: attendanceDate,
        classId: classId || null,
        schoolId: req.school.id
      }
    });

    let attendance;
    let isNewRecord = false;
    const previousStatus = existingAttendance?.status;
    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: normalizedStatus,
          teacherId: teacherId || existingAttendance.teacherId
        }
      });
    } else {
      // Create new record
      isNewRecord = true;
      attendance = await prisma.attendance.create({
        data: {
          date: attendanceDate,
          studentId,
          status: normalizedStatus,
          classId: classId || null,
          teacherId: teacherId || null,
          schoolId: req.school.id
        }
      });
    }

    // Send notification to parent for new attendance and status changes
    const shouldNotifyParent = isNewRecord || previousStatus !== normalizedStatus;
    if (shouldNotifyParent) {
      const parentId = await getParentIdForStudent(studentId);
      if (parentId) {
        // Get parent's language for status translation
        const parent = await prisma.user.findUnique({
          where: { id: parentId },
          select: { preferredLanguage: true }
        });
        const lang = parent?.preferredLanguage || 'en';
        const localizedStatus = getLocalizedAttendanceStatus(normalizedStatus, lang);

        await sendNotificationToUser(parentId, 'attendance', {
          studentName: student.name,
          status: localizedStatus
        });
      }
    }

    res.status(201).json(attendance);
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

    if (updateData.status) {
      const normalizedStatus = String(updateData.status).toUpperCase();
      const allowedStatuses = new Set(['PRESENT', 'ABSENT', 'LATE']);
      if (!allowedStatuses.has(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid attendance status' });
      }
      updateData.status = normalizedStatus;
    }

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

    if (updateData.status && updateData.status !== attendance.status) {
      const student = await prisma.user.findUnique({
        where: { id: attendance.studentId },
        select: { id: true, name: true }
      });

      if (student) {
        const parentId = await getParentIdForStudent(student.id);
        if (parentId) {
          const parent = await prisma.user.findUnique({
            where: { id: parentId },
            select: { preferredLanguage: true }
          });
          const lang = parent?.preferredLanguage || 'en';
          const localizedStatus = getLocalizedAttendanceStatus(updateData.status, lang);

          await sendNotificationToUser(parentId, 'attendance', {
            studentName: student.name,
            status: localizedStatus
          });
        }
      }
    }

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