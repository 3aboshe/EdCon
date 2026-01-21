import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';
import { sendNotificationToUsers, getParentIdsForClasses } from '../utils/notificationHelper.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { schoolId: req.school.id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get announcements by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const announcements = await prisma.announcement.findMany({
      where: { teacherId, schoolId: req.school.id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements by teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new announcement
router.post('/', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { title, content, date, teacherId, priority, classIds } = req.body;

    let resolvedTeacherId = teacherId;
    if (req.user.role === 'TEACHER') {
      resolvedTeacherId = req.user.id;
    }

    if (!resolvedTeacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Generate a unique ID for the announcement
    const announcementId = `ANN${Date.now()}`;

    // Map frontend priority values to Prisma enum values
    // Frontend: normal, high, urgent
    // Prisma: LOW, MEDIUM, HIGH
    const priorityMap = {
      'normal': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'HIGH',
      'low': 'LOW',
      'medium': 'MEDIUM'
    };
    const priorityValue = priorityMap[priority?.toLowerCase()] || 'MEDIUM';

    const newAnnouncement = await prisma.announcement.create({
      data: {
        id: announcementId,
        title,
        content,
        date: date ? new Date(date) : new Date(),
        teacherId: resolvedTeacherId,
        classIds: classIds || [],
        priority: priorityValue,
        schoolId: req.school.id
      }
    });

    // Send push notifications to parents
    const targetClassIds = classIds && classIds.length > 0 ? classIds : [];
    if (targetClassIds.length > 0) {
      const parentIds = await getParentIdsForClasses(req.school.id, targetClassIds);
      sendNotificationToUsers(parentIds, 'announcement', { title });
    }

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Add announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update announcement
router.put('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Map frontend priority values to Prisma enum values
    if (updateData.priority) {
      const priorityMap = {
        'normal': 'MEDIUM',
        'high': 'HIGH',
        'urgent': 'HIGH',
        'low': 'LOW',
        'medium': 'MEDIUM'
      };
      updateData.priority = priorityMap[updateData.priority.toLowerCase()] || 'MEDIUM';
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const announcement = await prisma.announcement.findFirst({ where: { id, schoolId: req.school.id } });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcement.id },
      data: updateData
    });

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findFirst({ where: { id, schoolId: req.school.id } });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await prisma.announcement.delete({
      where: { id: announcement.id }
    });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 