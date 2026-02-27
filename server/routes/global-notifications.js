import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

// Middleware to ensure Super Admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

const normalizeTarget = (target, targetRole) => {
  const raw = (target || targetRole || '').toString().trim().toUpperCase();
  if (!raw) return null;

  if (raw === 'ALL' || raw === 'ALL_USERS') return 'ALL_USERS';
  if (raw === 'SCHOOL_ADMIN' || raw === 'SCHOOL_ADMINS') return 'SCHOOL_ADMINS';

  return null;
};

router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const [announcements, adminMessages] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          teacherId: req.user.id,
          priority: 'HIGH',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      }),
      prisma.message.findMany({
        where: {
          senderId: req.user.id,
          type: 'TEXT',
          content: {
            startsWith: '[SYSTEM NOTIFICATION] ',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      }),
    ]);

    const allUsersHistory = announcements.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
      targetRole: 'ALL',
    }));

    const schoolAdminHistory = adminMessages.map((item) => {
      const raw = item.content || '';
      const withoutPrefix = raw.replace(/^\[SYSTEM NOTIFICATION\]\s*/, '');
      const [titlePart, ...bodyParts] = withoutPrefix.split('\n\n');

      return {
        id: item.id,
        title: (titlePart || 'System Notification').trim(),
        content: bodyParts.join('\n\n').trim() || withoutPrefix.trim(),
        createdAt: item.createdAt,
        targetRole: 'SCHOOL_ADMIN',
      };
    });

    const history = [...allUsersHistory, ...schoolAdminHistory]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Global notifications history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', requireSuperAdmin, async (req, res) => {
  const { title, content, target, targetRole } = req.body; // target: 'ALL_USERS' | 'SCHOOL_ADMINS'
  const normalizedTarget = normalizeTarget(target, targetRole);

  if (!title || !content || !normalizedTarget) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    if (normalizedTarget === 'ALL_USERS') {
      // Create announcement for all schools
      const schools = await prisma.school.findMany({ select: { id: true } });
      
      if (schools.length === 0) {
        return res.json({ success: true, message: 'No schools found.' });
      }

      const announcements = schools.map(school => ({
        title,
        content,
        date: new Date(),
        teacherId: req.user.id, // Super Admin as author
        schoolId: school.id,
        priority: 'HIGH',
        classIds: [] // Visible to all
      }));

      await prisma.announcement.createMany({
        data: announcements
      });

      return res.json({
        success: true,
        message: `Announcement sent to ${schools.length} schools.`,
        data: { targetRole: 'ALL' },
      });

    } else if (normalizedTarget === 'SCHOOL_ADMINS') {
      // Send message to all school admins
      const admins = await prisma.user.findMany({
        where: { role: 'SCHOOL_ADMIN' },
        select: { id: true, schoolId: true }
      });

      if (admins.length === 0) {
        return res.json({ success: true, message: 'No school admins found.' });
      }

      const messages = admins.map(admin => ({
        senderId: req.user.id,
        receiverId: admin.id,
        schoolId: admin.schoolId, // Message must belong to the school context
        content: `[SYSTEM NOTIFICATION] ${title}\n\n${content}`,
        type: 'TEXT',
        isRead: false
      })).filter(msg => msg.schoolId); // Ensure admin has a school

      if (messages.length > 0) {
        await prisma.message.createMany({
          data: messages
        });
      }

      return res.json({
        success: true,
        message: `Message sent to ${messages.length} admins.`,
        data: { targetRole: 'SCHOOL_ADMIN' },
      });
    } else {
      return res.status(400).json({ message: 'Invalid target' });
    }

  } catch (error) {
    console.error('Global notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
