import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new class
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Creating class:', name);
    
    const classData = await prisma.class.create({
      data: {
        name: name
      }
    });
    
    console.log('Created class:', classData);
    res.json({ success: true, class: classData });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 