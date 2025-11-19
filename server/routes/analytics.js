import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);

// Super Admin Metrics
router.get('/super-admin', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const [totalSchools, totalUsers, activeUsers] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } })
    ]);

    res.json({
      success: true,
      data: {
        totalSchools,
        totalUsers,
        activeUsers,
        systemHealth: 'healthy' // You might want to implement real health check logic
      }
    });
  } catch (error) {
    console.error('Super Admin metrics error:', error);
    res.status(500).json({ message: 'Unable to fetch metrics' });
  }
});

// Super Admin Activity Feed
router.get('/activity', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    // Fetch recent users created or updated as a proxy for activity
    // In a real app, you'd have an ActivityLog table
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        school: { select: { name: true } }
      }
    });

    const activities = recentUsers.map(user => ({
      id: user.id,
      type: 'create_user',
      description: `New ${user.role.toLowerCase()} ${user.name} joined ${user.school?.name || 'EdCon'}`,
      timestamp: user.createdAt,
      user: { name: user.name, role: user.role }
    }));

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ message: 'Unable to fetch activity' });
  }
});

// School Admin Stats
router.get('/school/:schoolId', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { schoolId } = req.params;

    // Ensure School Admin can only access their own school
    if (req.user.role === 'SCHOOL_ADMIN' && req.user.schoolId !== schoolId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalStudents, totalTeachers, totalParents, attendanceCount] = await Promise.all([
      prisma.user.count({ where: { schoolId, role: 'STUDENT', status: 'ACTIVE' } }),
      prisma.user.count({ where: { schoolId, role: 'TEACHER', status: 'ACTIVE' } }),
      prisma.user.count({ where: { schoolId, role: 'PARENT', status: 'ACTIVE' } }),
      prisma.attendance.count({ 
        where: { 
          date: new Date().toISOString().split('T')[0],
          student: { schoolId }
        } 
      })
    ]);

    // Calculate attendance rate (simple approximation)
    const attendanceRate = totalStudents > 0 ? Math.round((attendanceCount / totalStudents) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalParents,
        attendanceRate,
        activeAlerts: 0 // Placeholder
      }
    });
  } catch (error) {
    console.error('School stats error:', error);
    res.status(500).json({ message: 'Unable to fetch school stats' });
  }
});

export default router;
