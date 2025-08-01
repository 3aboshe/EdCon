import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    console.log('Fetching subjects from database...');
    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    console.log(`Found ${subjects.length} subjects:`, subjects.map(s => ({ id: s.id, name: s.name })));
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new subject
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Creating subject:', name);
    
    const subject = await prisma.subject.create({
      data: {
        name: name
      }
    });
    
    console.log('Created subject:', subject);
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 