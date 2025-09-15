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
    
    // Generate a unique ID for the class
    const classId = `C${Date.now()}`;
    
    const classData = await prisma.class.create({
      data: {
        id: classId,
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

// Update a class
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subjectIds } = req.body;
    console.log('Updating class:', id, 'with data:', { name, subjectIds });
    
    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: id }
    });
    
    if (!existingClass) {
      console.log('Class not found:', id);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    
    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: id },
      data: updateData
    });
    
    console.log('Successfully updated class:', updatedClass);
    res.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a class
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting class:', id);
    
    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: id }
    });
    
    if (!existingClass) {
      console.log('Class not found:', id);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if class has students
    const studentsInClass = await prisma.user.findMany({
      where: { classId: id }
    });
    
    if (studentsInClass.length > 0) {
      console.log('Cannot delete class with students:', studentsInClass.length, 'students');
      return res.status(400).json({ 
        message: 'Cannot delete class with students. Please remove all students first.' 
      });
    }
    
    // Delete the class
    await prisma.class.delete({
      where: { id: id }
    });
    
    console.log('Successfully deleted class:', id);
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 