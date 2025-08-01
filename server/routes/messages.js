import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between two users
router.get('/conversation/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new message
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, content, type, audioSrc } = req.body;
    
    const newMessage = new Message({
      id: `M${Date.now()}`,
      senderId,
      receiverId,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: type || 'text',
      content,
      audioSrc
    });
    
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedMessage = await Message.findOneAndUpdate(
      { id },
      { isRead: true },
      { new: true }
    );
    
    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedMessage = await Message.findOneAndDelete({ id });
    
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 