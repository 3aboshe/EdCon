import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
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
      where: { teacherId },
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
router.post('/', async (req, res) => {
  try {
    const { title, content, date, teacherId, priority, classIds } = req.body;
    
    // Generate a unique ID for the announcement
    const announcementId = `ANN${Date.now()}`;
    
    // Convert priority to uppercase to match Prisma enum
    const priorityValue = priority ? priority.toUpperCase() : 'MEDIUM';
    
    const newAnnouncement = await prisma.announcement.create({
      data: {
        id: announcementId,
        title,
        content,
        date,
        teacherId,
        classIds: classIds || [],
        priority: priorityValue
      }
    });
    
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Add announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert priority to uppercase if it exists in the update data
    if (updateData.priority) {
      updateData.priority = updateData.priority.toUpperCase();
    }
    
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: updateData
    });
    
    if (!updatedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAnnouncement = await prisma.announcement.delete({
      where: { id }
    });
    
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 