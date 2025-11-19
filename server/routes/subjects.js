import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(authenticate);
router.use(resolveSchoolContext);
router.use(requireRole(['SCHOOL_ADMIN', 'TEACHER', 'SUPER_ADMIN']));

// Get all subjects
router.get('/', async (req, res) => {
  try {
    console.log('Fetching subjects from database...');
    const subjects = await prisma.subject.findMany({
      where: { schoolId: req.school.id },
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
router.post('/', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Creating subject:', name);
    
    // Check if subject already exists
    const existingSubject = await prisma.subject.findFirst({
      where: { name: name, schoolId: req.school.id }
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
        name: name,
        schoolId: req.school.id
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
router.delete('/:id', requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting subject:', id);
    
    // Check if subject exists
    const existingSubject = await prisma.subject.findFirst({
      where: { id: id, schoolId: req.school.id }
    });
    
    if (!existingSubject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Delete the subject
    await prisma.subject.delete({
      where: { id: existingSubject.id }
    });
    
    console.log('Successfully deleted subject:', id);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 