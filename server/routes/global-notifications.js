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

router.post('/', requireSuperAdmin, async (req, res) => {
  const { title, content, target } = req.body; // target: 'ALL_USERS' | 'SCHOOL_ADMINS'

  if (!title || !content || !target) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    if (target === 'ALL_USERS') {
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

      return res.json({ success: true, message: `Announcement sent to ${schools.length} schools.` });

    } else if (target === 'SCHOOL_ADMINS') {
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

      return res.json({ success: true, message: `Message sent to ${messages.length} admins.` });
    } else {
      return res.status(400).json({ message: 'Invalid target' });
    }

  } catch (error) {
    console.error('Global notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  res.status(500).json({ message: 'Server error', error: error.message });
}
});

router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    // Fetch distinct announcements created by the super admin
    const announcements = await prisma.announcement.findMany({
      where: { teacherId: req.user.id },
      distinct: ['title', 'content', 'createdAt'],
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Fetch global notifications error:', error);


    export default router;
