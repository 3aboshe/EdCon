import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages between two users
router.get('/conversation/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new message
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, content, type, audioSrc } = req.body;
    
    const newMessage = await prisma.message.create({
      data: {
        id: `M${Date.now()}`,
        senderId,
        receiverId,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: type || 'text',
        content,
        audioSrc
      }
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });
    
    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedMessage = await prisma.message.delete({
      where: { id }
    });
    
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 