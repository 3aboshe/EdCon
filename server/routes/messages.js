import express from 'express';
import { prisma } from '../config/db.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

router.use(authenticate);
router.use(resolveSchoolContext);

// Get messages for authenticated user only
router.get('/', async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, otherUserId } = req.query;

    // If userId is provided, verify it matches authenticated user
    const targetUserId = userId || authenticatedUserId;

    // SECURITY: Users can only access their own messages
    if (targetUserId !== authenticatedUserId) {
      return res.status(403).json({
        message: 'Access denied: You can only view your own messages'
      });
    }

    let whereClause = {
      schoolId: req.school.id,
      OR: [
        { senderId: targetUserId },
        { receiverId: targetUserId }
      ]
    };

    // If otherUserId is specified, filter to conversation between two users
    if (otherUserId) {
      whereClause = {
        schoolId: req.school.id,
        OR: [
          { senderId: targetUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: targetUserId }
        ]
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages between two users - SECURED
router.get('/conversation/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;

    // SECURITY: User must be part of this conversation
    if (req.user.id !== user1Id && req.user.id !== user2Id) {
      return res.status(403).json({
        message: 'Access denied: You can only view your own conversations'
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ],
        schoolId: req.school.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a user - SECURED
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // SECURITY: User can only access their own messages
    if (req.user.id !== userId) {
      return res.status(403).json({
        message: 'Access denied: You can only view your own messages'
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        schoolId: req.school.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ message: 'Server error' });
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
    const sender = await prisma.user.findFirst({ where: { id: senderId, schoolId: req.school.id } });
    if (!sender) {
      console.error('Sender not found:', senderId);
      return res.status(400).json({ message: 'Sender user not found' });
    }

    // SECURITY: Verify sender is the authenticated user
    if (senderId !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied: You can only send messages as yourself'
      });
    }

    const receiver = await prisma.user.findFirst({ where: { id: receiverId, schoolId: req.school.id } });
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
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        isRead: isRead || false,
        type: messageType,
        content,
        audioSrc: null,
        attachments: attachments,
        schoolId: req.school.id
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

    const message = await prisma.message.findFirst({ where: { id, schoolId: req.school.id } });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // SECURITY: Only receiver can mark message as read
    if (message.receiverId !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied: Only the message recipient can mark it as read'
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: message.id },
      data: { isRead: true }
    });

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

    const message = await prisma.message.findFirst({ where: { id, schoolId: req.school.id } });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // SECURITY: Only sender or receiver can delete message
    if (message.senderId !== req.user.id && message.receiverId !== req.user.id) {
      return res.status(403).json({
        message: 'Access denied: You can only delete messages you sent or received'
      });
    }

    await prisma.message.delete({
      where: { id: message.id }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve uploaded files - SECURED against path traversal
router.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // SECURITY: Prevent path traversal by using basename
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads', sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);

    res.sendFile(filePath);
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});

export default router; 