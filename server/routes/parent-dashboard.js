import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);
router.use(requireRole(['PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']));

/**
 * Combined Parent Dashboard Endpoint
 * GET /api/parent/dashboard/:parentId
 *
 * Returns all data needed for the parent dashboard in a single request:
 * - Children list with their class information
 * - Recent announcements
 * - Summary statistics
 */
router.get('/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;

    // Verify parent exists in this school
    const parent = await prisma.user.findFirst({
      where: { id: parentId, role: 'PARENT', schoolId: req.school.id },
      select: {
        id: true,
        name: true,
        childrenIds: true
      }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Get all children for this parent
    const children = await prisma.user.findMany({
      where: {
        id: { in: parent.childrenIds || [] },
        schoolId: req.school.id
      },
      select: {
        id: true,
        name: true,
        role: true,
        classId: true
      }
    });

    // Get classes for children
    const classIds = children.map(c => c.classId).filter(Boolean);
    console.log('Parent dashboard - Children classIds:', classIds);
    
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        name: true
      }
    });

    // Create a map of classId -> class data
    const classMap = {};
    classes.forEach(cls => {
      classMap[cls.id] = cls;
    });

    // Get recent announcements (last 50 to filter)
    // Include school-wide (empty classIds) and class-specific ones for parent's children
    const allAnnouncements = await prisma.announcement.findMany({
      where: { schoolId: req.school.id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    console.log('Parent dashboard - Total announcements found:', allAnnouncements.length);
    console.log('Parent dashboard - Sample announcement classIds:', allAnnouncements.slice(0, 3).map(a => ({ id: a.id, classIds: a.classIds })));

    // Filter announcements:
    // - School-wide (empty classIds) shown to all
    // - Class-specific shown only if child is in that class
    const announcements = allAnnouncements.filter(ann => {
      // School-wide announcements (empty or null classIds) are shown to everyone
      if (!ann.classIds || ann.classIds.length === 0) {
        return true;
      }
      // Class-specific announcements: check if ANY of announcement's classIds matches ANY of children's classIds
      const matches = ann.classIds.some(announcementClassId => classIds.includes(announcementClassId));
      return matches;
    }).slice(0, 10);

    console.log('Parent dashboard - Filtered announcements count:', announcements.length);

    // Calculate summary statistics
    const summary = {
      totalChildren: children.length,
      totalAnnouncements: announcements.length
    };

    // Combine children with their class info
    const childrenWithClasses = children.map(child => ({
      ...child,
      class: classMap[child.classId] || null
    }));

    res.json({
      success: true,
      data: {
        children: childrenWithClasses,
        announcements,
        summary
      }
    });

  } catch (error) {
    console.error('Parent dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Combined Child Data Endpoint
 * GET /api/parent/dashboard/:parentId/child/:childId
 *
 * Returns all data for a specific child in a single request:
 * - Child info
 * - Recent grades
 * - Recent attendance
 * - Recent homework
 */
router.get('/:parentId/child/:childId', async (req, res) => {
  try {
    const { parentId, childId } = req.params;

    // Verify parent exists and has this child
    const parent = await prisma.user.findFirst({
      where: { id: parentId, role: 'PARENT', schoolId: req.school.id },
      select: { childrenIds: true }
    });

    if (!parent || !parent.childrenIds?.includes(childId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get child info
    const child = await prisma.user.findFirst({
      where: { id: childId, schoolId: req.school.id },
      select: {
        id: true,
        name: true,
        classId: true,
        grade: true,
        section: true
      }
    });

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Parallel fetch all child data
    const [grades, attendance, homework, childClass] = await Promise.all([
      // Recent grades (last 20)
      prisma.grade.findMany({
        where: { studentId: childId, schoolId: req.school.id },
        take: 20,
        orderBy: { date: 'desc' }
      }),
      // Recent attendance (last 30)
      prisma.attendance.findMany({
        where: { studentId: childId, schoolId: req.school.id },
        take: 30,
        orderBy: { date: 'desc' }
      }),
      // Recent homework (last 20)
      prisma.homework.findMany({
        where: {
          schoolId: req.school.id,
          OR: [
            { classIds: { has: child.classId } },
            { classIds: { equals: [] } }
          ]
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      }),
      // Child's class info
      child.classId ? prisma.class.findFirst({
        where: { id: child.classId }
      }) : null
    ]);

    // Calculate summary stats
    const summary = {
      totalGrades: grades.length,
      totalAttendance: attendance.length,
      totalHomework: homework.length,
      attendanceRate: attendance.length > 0
        ? Math.round((attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        child: {
          ...child,
          class: childClass
        },
        grades,
        attendance,
        homework,
        summary
      }
    });

  } catch (error) {
    console.error('Parent child data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
