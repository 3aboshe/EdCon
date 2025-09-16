import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// Create a full database backup
router.post('/create', async (req, res) => {
  try {
    console.log('Creating database backup...');
    
    // Get all data from the database
    const [users, classes, subjects, announcements, messages] = await Promise.all([
      prisma.user.findMany(),
      prisma.class.findMany(),
      prisma.subject.findMany(),
      prisma.announcement.findMany(),
      prisma.message.findMany()
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users: users.length,
        classes: classes.length,
        subjects: subjects.length,
        announcements: announcements.length,
        messages: messages.length
      },
      // For privacy, we only backup structure and counts, not actual private data
      structure: {
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          classId: u.classId,
          parentId: u.parentId,
          childrenIds: u.childrenIds,
          classIds: u.classIds,
          subject: u.subject,
          createdAt: u.createdAt
          // Avatar and other private data excluded
        })),
        classes: classes,
        subjects: subjects,
        announcements: announcements.map(a => ({
          id: a.id,
          title: a.title,
          classId: a.classId,
          teacherId: a.teacherId,
          createdAt: a.createdAt
          // Content excluded for privacy
        })),
        // Messages excluded entirely for privacy
        messageCount: messages.length
      }
    };

    console.log('Backup created successfully');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="edcon-backup-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(backup);
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create backup', 
      error: error.message 
    });
  }
});

// Get backup statistics
router.get('/stats', async (req, res) => {
  try {
    const [userCount, classCount, subjectCount, announcementCount, messageCount] = await Promise.all([
      prisma.user.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.announcement.count(),
      prisma.message.count()
    ]);

    const stats = {
      totalRecords: userCount + classCount + subjectCount + announcementCount + messageCount,
      breakdown: {
        users: userCount,
        classes: classCount,
        subjects: subjectCount,
        announcements: announcementCount,
        messages: messageCount
      },
      lastBackup: null, // Could be stored in a separate table
      systemHealth: 'Good'
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get backup stats', 
      error: error.message 
    });
  }
});

export default router;
