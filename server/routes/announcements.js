import express from 'express';
import Announcement from '../models/Announcement.js';

const router = express.Router();

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ date: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get announcements by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const announcements = await Announcement.find({ teacherId }).sort({ date: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new announcement
router.post('/', async (req, res) => {
  try {
    const { title, content, date, teacherId, priority } = req.body;
    
    const newAnnouncement = new Announcement({
      id: `AN${Date.now()}`,
      title,
      content,
      date,
      teacherId,
      priority: priority || 'medium'
    });
    
    const savedAnnouncement = await newAnnouncement.save();
    res.status(201).json(savedAnnouncement);
  } catch (error) {
    console.error('Add announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedAnnouncement = await Announcement.findOneAndUpdate({ id }, updateData, { new: true });
    
    if (!updatedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAnnouncement = await Announcement.findOneAndDelete({ id });
    
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 