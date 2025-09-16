import express from 'express';
import { prisma } from '../config/db.js';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow specific file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, Word, Excel, and text files are allowed.'), false);
    }
  }
});

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

// Add new message with file upload support
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    const { senderId, receiverId, timestamp, content, type } = req.body;
    const isRead = req.body.isRead === 'true' || req.body.isRead === true;
    const files = req.files || [];
    
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Files:', files);
    console.log('Creating message with data:', {
      senderId,
      receiverId,
      timestamp,
      content: content ? `${content.substring(0, 50)}...` : 'none',
      type,
      fileCount: files.length,
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
    
    // Process uploaded files
    let attachments = null;
    if (files.length > 0) {
      attachments = files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`
      }));
      console.log('Processed attachments:', attachments.length, 'files');
      console.log('Attachment details:', attachments);
    }
    
    // Determine message type
    let messageType = 'TEXT';
    if (files.length > 0) {
      messageType = 'FILE';
    }
    
    console.log('About to create message with type:', messageType);
    console.log('Message data:', {
      id: `M${Date.now()}`,
      senderId,
      receiverId,
      timestamp: timestamp || new Date().toISOString(),
      isRead: isRead || false,
      type: messageType,
      content,
      attachments: attachments
    });
    
    const newMessage = await prisma.message.create({
      data: {
        id: `M${Date.now()}`,
        senderId,
        receiverId,
        timestamp: timestamp || new Date().toISOString(),
        isRead: isRead || false,
        type: messageType,
        content,
        audioSrc: null,
        attachments: attachments
      }
    });
    
    console.log('Created message successfully:', {
      id: newMessage.id,
      type: newMessage.type,
      hasAttachments: !!newMessage.attachments,
      attachmentCount: attachments ? attachments.length : 0
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

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    console.log('=== FILE DOWNLOAD DEBUG ===');
    console.log('Requested filename:', filename);
    console.log('File path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('File stats:', {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    
    console.log('Serving file:', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ message: 'Error serving file', error: error.message });
  }
});

export default router; 