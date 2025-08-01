import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 