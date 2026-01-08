import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Sanitize user data - remove sensitive fields
const sanitizeUser = (user) => {
    if (!user) return null;
    const { passwordHash, temporaryPasswordHash, ...safeUser } = user;
    return safeUser;
};

/**
 * GET /api/admin/dashboard
 * 
 * Combined endpoint that returns all admin dashboard data in a single request.
 * Uses Promise.all for parallel database queries to minimize response time.
 * 
 * Response: {
 *   success: true,
 *   data: {
 *     users: { students: [], teachers: [], parents: [], all: [] },
 *     classes: [],
 *     subjects: [],
 *     counts: { totalStudents, totalTeachers, totalParents, totalClasses, totalSubjects }
 *   }
 * }
 */
router.get('/', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const schoolId = req.school?.id || req.user.schoolId;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: 'School context required'
            });
        }

        // Execute all queries in parallel using Promise.all
        const [users, classes, subjects] = await Promise.all([
            // Get all users for this school
            prisma.user.findMany({
                where: { schoolId },
                orderBy: { name: 'asc' },
                include: {
                    class: true,
                    parent: true,
                },
            }),

            // Get all classes for this school
            prisma.class.findMany({
                where: { schoolId },
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { students: true }
                    }
                }
            }),

            // Get all subjects for this school
            prisma.subject.findMany({
                where: { schoolId },
                orderBy: { name: 'asc' },
            }),
        ]);

        // Sanitize users and categorize by role
        const sanitizedUsers = users.map(sanitizeUser);
        const students = sanitizedUsers.filter(u => u.role === 'STUDENT');
        const teachers = sanitizedUsers.filter(u => u.role === 'TEACHER');
        const parents = sanitizedUsers.filter(u => u.role === 'PARENT');

        // Format classes with student count
        const formattedClasses = classes.map(c => ({
            ...c,
            studentCount: c._count?.students || 0,
        }));

        // Calculate counts
        const counts = {
            totalStudents: students.length,
            totalTeachers: teachers.length,
            totalParents: parents.length,
            totalUsers: sanitizedUsers.length,
            totalClasses: classes.length,
            totalSubjects: subjects.length,
        };

        res.json({
            success: true,
            data: {
                users: {
                    all: sanitizedUsers,
                    students,
                    teachers,
                    parents,
                },
                classes: formattedClasses,
                subjects,
                counts,
            },
        });
    } catch (error) {
        console.error('Dashboard data fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch dashboard data',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/dashboard/counts
 * 
 * Lightweight endpoint that returns only counts (for quick dashboard refresh).
 * Useful for polling or real-time updates without fetching full data.
 */
router.get('/counts', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const schoolId = req.school?.id || req.user.schoolId;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: 'School context required'
            });
        }

        // Execute count queries in parallel
        const [studentCount, teacherCount, parentCount, classCount, subjectCount] = await Promise.all([
            prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
            prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
            prisma.user.count({ where: { schoolId, role: 'PARENT' } }),
            prisma.class.count({ where: { schoolId } }),
            prisma.subject.count({ where: { schoolId } }),
        ]);

        res.json({
            success: true,
            data: {
                totalStudents: studentCount,
                totalTeachers: teacherCount,
                totalParents: parentCount,
                totalClasses: classCount,
                totalSubjects: subjectCount,
                totalUsers: studentCount + teacherCount + parentCount,
            },
        });
    } catch (error) {
        console.error('Dashboard counts fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch counts',
            error: error.message
        });
    }
});

export default router;
