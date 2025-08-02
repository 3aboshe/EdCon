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
    const { senderId, receiverId, timestamp, content, type, audioSrc, isRead } = req.body;
    
    console.log('Creating message with data:', {
      senderId,
      receiverId,
      timestamp,
      content: content ? `${content.substring(0, 50)}...` : 'none',
      type,
      audioSrc: audioSrc ? `${audioSrc.substring(0, 100)}... (${audioSrc.length} chars)` : 'none',
      isRead
    });
    
    // Validate message data
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'senderId and receiverId are required' });
    }
    
    // Validate that sender and receiver users exist
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      console.error('Sender not found:', senderId);
      return res.status(400).json({ message: 'Sender user not found' });
    }
    
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      console.error('Receiver not found:', receiverId);
      return res.status(400).json({ message: 'Receiver user not found' });
    }
    
    console.log('Validated users - Sender:', sender.name, 'Receiver:', receiver.name);
    
    // For voice messages, limit audioSrc size to prevent database issues
    if (type === 'voice' && audioSrc && audioSrc.length > 1000000) { // 1MB limit
      console.error('Audio file too large:', audioSrc.length, 'characters');
      return res.status(400).json({ message: 'Audio file too large. Please use a shorter recording.' });
    }
    
    // Temporary fix: For voice messages, store a placeholder instead of the actual audio data
    // This will help us test if the issue is with the audio data storage
    let processedAudioSrc = audioSrc;
    if (type === 'voice' && audioSrc) {
      console.log('Voice message detected, using placeholder for audio data');
      processedAudioSrc = `VOICE_MESSAGE_PLACEHOLDER_${audioSrc.length}_CHARS`;
    }
    
    const newMessage = await prisma.message.create({
      data: {
        id: `M${Date.now()}`,
        senderId,
        receiverId,
        timestamp: timestamp || new Date().toISOString(),
        isRead: isRead || false,
        type: type === 'voice' ? 'VOICE' : 'TEXT', // Convert to uppercase enum values
        content,
        audioSrc: processedAudioSrc
      }
    });
    
    console.log('Created message successfully:', {
      id: newMessage.id,
      type: newMessage.type,
      hasAudio: !!newMessage.audioSrc
    });
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Add message error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
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