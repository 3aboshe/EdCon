import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);

// Upload or update public key
router.post('/keys', async (req, res) => {
  try {
    const { publicKey } = req.body;
    const userId = req.user.id;

    if (!publicKey) {
      return res.status(400).json({ message: 'Public key is required' });
    }

    // Validate public key format (basic check)
    if (!publicKey.includes('-----BEGIN PUBLIC KEY-----') ||
        !publicKey.includes('-----END PUBLIC KEY-----')) {
      return res.status(400).json({ message: 'Invalid public key format' });
    }

    // Get the highest key version for this user
    const latestKey = await prisma.encryptionKey.findFirst({
      where: { userId },
      orderBy: { keyVersion: 'desc' }
    });

    const newKeyVersion = (latestKey?.keyVersion || 0) + 1;

    // Deactivate old keys
    await prisma.encryptionKey.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    // Create new encryption key
    const encryptionKey = await prisma.encryptionKey.create({
      data: {
        userId,
        publicKey,
        keyVersion: newKeyVersion,
        isActive: true,
      }
    });

    res.status(201).json(encryptionKey);
  } catch (error) {
    console.error('Error storing public key:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's public key
router.get('/keys/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const encryptionKey = await prisma.encryptionKey.findFirst({
      where: { userId, isActive: true },
      orderBy: { keyVersion: 'desc' }
    });

    if (!encryptionKey) {
      return res.status(404).json({ message: 'Public key not found' });
    }

    res.json({
      publicKey: encryptionKey.publicKey,
      keyVersion: encryptionKey.keyVersion
    });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get own public key
router.get('/keys', async (req, res) => {
  try {
    const userId = req.user.id;

    const encryptionKey = await prisma.encryptionKey.findFirst({
      where: { userId, isActive: true },
      orderBy: { keyVersion: 'desc' }
    });

    if (!encryptionKey) {
      return res.status(404).json({ message: 'No public key found' });
    }

    res.json({
      publicKey: encryptionKey.publicKey,
      keyVersion: encryptionKey.keyVersion
    });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
