import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);
router.use(requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']));

/**
 * Combined Teacher Dashboard Endpoint
 * GET /api/teacher/dashboard/:teacherId
 *
 * Returns all data needed for the teacher dashboard in a single request:
 * - Classes taught by this teacher
 * - Recent homework created
 * - Recent exams created
 * - Recent announcements
 * - Summary statistics
 */
router.get('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Verify teacher exists in this school
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'TEACHER', schoolId: req.school.id },
      select: {
        id: true,
        name: true,
        subject: true
      }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Parallel fetch all dashboard data
    const [classes, homework, exams, announcements] = await Promise.all([
      // Classes taught by this teacher
      prisma.class.findMany({
        where: { teacherId: teacherId, schoolId: req.school.id },
        select: {
          id: true,
          name: true,
          grade: true,
          section: true
        },
        orderBy: { name: 'asc' }
      }),
      // Recent homework by this teacher (last 20)
      prisma.homework.findMany({
        where: { teacherId: teacherId, schoolId: req.school.id },
        take: 20,
        orderBy: { createdAt: 'desc' }
      }),
      // Recent exams by this teacher (last 20)
      prisma.exam.findMany({
        where: { teacherId: teacherId, schoolId: req.school.id },
        take: 20,
        orderBy: { createdAt: 'desc' }
      }),
      // Recent announcements (last 10)
      prisma.announcement.findMany({
        where: { schoolId: req.school.id },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Get student count for each class
    const classIds = classes.map(c => c.id);
    const studentsPerClass = await prisma.user.groupBy({
      by: ['classId'],
      where: {
        classId: { in: classIds },
        role: 'STUDENT',
        schoolId: req.school.id
      },
      _count: { id: true }
    });

    // Create a map of classId -> student count
    const studentCountMap = {};
    studentsPerClass.forEach(item => {
      studentCountMap[item.classId] = item._count.id;
    });

    // Add student counts to classes
    const classesWithCounts = classes.map(cls => ({
      ...cls,
      studentCount: studentCountMap[cls.id] || 0
    }));

    // Calculate summary statistics
    const summary = {
      totalClasses: classes.length,
      totalStudents: Object.values(studentCountMap).reduce((sum, count) => sum + count, 0),
      totalHomework: homework.length,
      totalExams: exams.length
    };

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: teacher.name,
          subject: teacher.subject
        },
        classes: classesWithCounts,
        homework,
        exams,
        announcements,
        summary
      }
    });

  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Combined Class Data Endpoint
 * GET /api/teacher/dashboard/:teacherId/class/:classId
 *
 * Returns all data for a specific class in a single request:
 * - Class info
 * - Students in the class
 * - Recent homework for this class
 * - Recent exams for this class
 */
router.get('/:teacherId/class/:classId', async (req, res) => {
  try {
    const { teacherId, classId } = req.params;

    // Verify teacher exists
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'TEACHER', schoolId: req.school.id },
      select: { id: true }
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify class belongs to this teacher
    const classData = await prisma.class.findFirst({
      where: { id: classId, teacherId: teacherId, schoolId: req.school.id }
    });

    if (!classData) {
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    // Parallel fetch all class data
    const [students, homework, exams, grades] = await Promise.all([
      // Students in this class
      prisma.user.findMany({
        where: { classId: classId, role: 'STUDENT', schoolId: req.school.id },
        select: {
          id: true,
          name: true,
          grade: true,
          section: true
        },
        orderBy: { name: 'asc' }
      }),
      // Recent homework for this class (last 20)
      prisma.homework.findMany({
        where: {
          teacherId: teacherId,
          schoolId: req.school.id,
          OR: [
            { classIds: { has: classId } },
            { classIds: { equals: [] } }
          ]
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      }),
      // Recent exams for this class (last 20)
      prisma.exam.findMany({
        where: {
          teacherId: teacherId,
          schoolId: req.school.id,
          classIds: { has: classId }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      }),
      // Recent grades for students in this class (last 50)
      prisma.grade.findMany({
        where: {
          schoolId: req.school.id,
          studentId: { in: (await prisma.user.findMany({
            where: { classId: classId, role: 'STUDENT', schoolId: req.school.id },
            select: { id: true }
          })).map(s => s.id) }
        },
        take: 50,
        orderBy: { date: 'desc' }
      })
    ]);

    // Calculate summary stats
    const summary = {
      totalStudents: students.length,
      totalHomework: homework.length,
      totalExams: exams.length,
      totalGrades: grades.length
    };

    res.json({
      success: true,
      data: {
        class: classData,
        students,
        homework,
        exams,
        grades,
        summary
      }
    });

  } catch (error) {
    console.error('Teacher class data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
