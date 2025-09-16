import express from 'express';
import { prisma } from '../config/db.js';

const router = express.Router();

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
    const { name, subjectIds = [] } = req.body;
    console.log('Creating class:', name, 'with subjects:', subjectIds);
    
    // Generate a unique ID for the class
    const classId = `C${Date.now()}`;
    
    const classData = await prisma.class.create({
      data: {
        id: classId,
        name: name,
        subjectIds: subjectIds
      }
    });
    
    // If subjects were assigned, update teachers' classIds
    if (subjectIds.length > 0) {
      console.log('Updating teacher class assignments for new class:', classId);
      
      // Get all teachers
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' }
      });
      
      // For each teacher, check if they teach any of the subjects in this class
      for (const teacher of teachers) {
        if (teacher.subject) {
          // Find the subject by name
          const subject = await prisma.subject.findFirst({
            where: { name: teacher.subject }
          });
          
          if (subject && subjectIds.includes(subject.id)) {
            // This teacher teaches a subject in this class
            const currentClassIds = teacher.classIds || [];
            if (!currentClassIds.includes(classId)) {
              // Add this class to the teacher's classIds
              const updatedClassIds = [...currentClassIds, classId];
              await prisma.user.update({
                where: { id: teacher.id },
                data: { classIds: updatedClassIds }
              });
              console.log(`Added class ${classId} to teacher ${teacher.name} (${teacher.subject})`);
            }
          }
        }
      }
    }
    
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
    if (subjectIds !== undefined) {
      updateData.subjectIds = subjectIds;
    }
    
    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: id },
      data: updateData
    });
    
    // If subjectIds were updated, update teachers' classIds
    if (subjectIds !== undefined) {
      console.log('Updating teacher class assignments for class:', id);
      
      // Get all teachers
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' }
      });
      
      // For each teacher, check if they teach any of the subjects in this class
      for (const teacher of teachers) {
        if (teacher.subject) {
          // Find the subject by name
          const subject = await prisma.subject.findFirst({
            where: { name: teacher.subject }
          });
          
          if (subject && subjectIds.includes(subject.id)) {
            // This teacher teaches a subject in this class
            const currentClassIds = teacher.classIds || [];
            if (!currentClassIds.includes(id)) {
              // Add this class to the teacher's classIds
              const updatedClassIds = [...currentClassIds, id];
              await prisma.user.update({
                where: { id: teacher.id },
                data: { classIds: updatedClassIds }
              });
              console.log(`Added class ${id} to teacher ${teacher.name} (${teacher.subject})`);
            }
          } else if (subject && !subjectIds.includes(subject.id)) {
            // This teacher's subject is no longer in this class
            const currentClassIds = teacher.classIds || [];
            if (currentClassIds.includes(id)) {
              // Remove this class from the teacher's classIds
              const updatedClassIds = currentClassIds.filter(cid => cid !== id);
              await prisma.user.update({
                where: { id: teacher.id },
                data: { classIds: updatedClassIds }
              });
              console.log(`Removed class ${id} from teacher ${teacher.name} (${teacher.subject})`);
            }
          }
        }
      }
    }
    
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