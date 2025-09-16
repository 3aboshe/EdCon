import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

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
    
    // Check if subject already exists
    const existingSubject = await prisma.subject.findFirst({
      where: { name: name }
    });
    
    if (existingSubject) {
      console.log('Subject already exists:', existingSubject);
      return res.json({ success: true, subject: existingSubject });
    }
    
    // Generate a unique ID for the subject
    const subjectId = `SUB${Date.now()}`;
    
    const subject = await prisma.subject.create({
      data: {
        id: subjectId,
        name: name
      }
    });
    
    console.log('Created subject:', subject);
    console.log('Sending response:', { success: true, subject });
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error creating subject:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: {
        code: error.code,
        meta: error.meta
      }
    });
  }
});

// Delete a subject
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting subject:', id);
    
    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: id }
    });
    
    if (!existingSubject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Delete the subject
    await prisma.subject.delete({
      where: { id: id }
    });
    
    console.log('Successfully deleted subject:', id);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 