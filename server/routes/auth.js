import express from 'express';
import { prisma } from '../config/db.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Helper to generate unique code by role
function generateCode(role) {
  if (role === 'student') {
    const prefix = 'S';
    return prefix + nanoid(6);
  } else if (role === 'teacher') {
    // Simpler teacher codes: T + 3 digits
    const prefix = 'T';
    let code;
    do {
      code = prefix + Math.floor(Math.random() * 900 + 100); // 100-999
    } while (code.length !== 4);
    return code;
  } else if (role === 'parent') {
    // Simpler parent codes: P + 3 digits
    const prefix = 'P';
    let code;
    do {
      code = prefix + Math.floor(Math.random() * 900 + 100); // 100-999
    } while (code.length !== 4);
    return code;
  } else {
    return 'U' + nanoid(6);
  }
}

// Create user (admin only)
router.post('/create', async (req, res) => {
  try {
    const { name, role, avatar, parentId, ...rest } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required.' });
    }
    
    // Convert role to uppercase for enum
    const userRole = role.toUpperCase();
    
    // Generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateCode(role);
      exists = await prisma.user.findUnique({ where: { id: code } });
    }
    
    // For students, ensure the class exists or create a default one
    let classId = rest.classId;
    if (userRole === 'STUDENT' && classId) {
      const existingClass = await prisma.class.findUnique({
        where: { id: classId }
      });
      
      if (!existingClass) {
        // Create the class if it doesn't exist
        await prisma.class.create({
          data: { id: classId, name: classId }
        });
        console.log(`Created class ${classId} for student`);
      }
    }
    
    const user = await prisma.user.create({
      data: { 
        id: code, 
        name, 
        role: userRole, 
        avatar: avatar || '', 
        ...rest 
      }
    });
    
    // If this is a student with a parent, update the parent's childrenIds
    if (userRole === 'STUDENT' && parentId) {
      try {
        const parent = await prisma.user.findUnique({
          where: { id: parentId }
        });
        
        if (parent) {
          await prisma.user.update({
            where: { id: parentId },
            data: {
              childrenIds: [...(parent.childrenIds || []), user.id]
            }
          });
          console.log(`Updated parent ${parent.name} with child ${user.name}`);
        }
      } catch (parentError) {
        console.error('Error updating parent:', parentError);
        // Don't fail the user creation if parent update fails
      }
    }
    
    // If this is a teacher with a subject, automatically assign to classes with that subject
    if (userRole === 'TEACHER' && rest.subject) {
      try {
        // Find the subject by name
        const subject = await prisma.subject.findFirst({
          where: { name: rest.subject }
        });
        
        if (subject) {
          // Find all classes that have this subject
          const classesWithSubject = await prisma.class.findMany({
            where: {
              subjectIds: {
                has: subject.id
              }
            }
          });
          
          const classIds = classesWithSubject.map(c => c.id);
          
          // Update the teacher with the class assignments
          await prisma.user.update({
            where: { id: user.id },
            data: { classIds: classIds }
          });
          
          console.log(`Teacher ${user.name} automatically assigned to ${classIds.length} classes based on subject ${rest.subject}:`, classIds);
        }
      } catch (subjectError) {
        console.error('Error auto-assigning teacher to classes:', subjectError);
        // Don't fail the user creation if class assignment fails
      }
    }
    
    res.status(201).json({ success: true, code, user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Get all users with better error handling
router.get('/users', async (req, res) => {
  try {
    console.log('Attempting to fetch users from PostgreSQL...');
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    console.log(`Successfully fetched ${users.length} users`);
    console.log('Users with avatars:', users.map(u => ({ 
      id: u.id, 
      name: u.name, 
      avatar: u.avatar ? `has avatar (${u.avatar.length} chars)` : 'no avatar',
      avatarPreview: u.avatar ? u.avatar.substring(0, 50) + '...' : 'none'
    })));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user by code with better error handling
router.get('/user/:code', async (req, res) => {
  try {
    console.log('Attempting to fetch user by code:', req.params.code);
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.code,
      },
    });
    if (!user) {
      console.log('User not found for code:', req.params.code);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by code:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login with better error handling and token generation
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for code:', req.body.code);
    const { code } = req.body;

    if (!code) {
      console.log('No code provided');
      return res.status(400).json({ message: 'Code is required' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: code,
      },
    });
    if (!user) {
      console.log('User not found for login code:', code);
      return res.status(404).json({ message: 'Invalid code' });
    }

    // Generate session token
    const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    console.log('Login successful for user:', user.name, 'with token:', token);
    res.json({
      success: true,
      user,
      token // Add session token for Flutter app
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user codes for admin panel
router.get('/codes', async (req, res) => {
  try {
    console.log('Fetching user codes with query:', req.query);
    const { role } = req.query;
    
    let whereClause = {};
    if (role && role !== 'all') {
      // Convert role to uppercase to match enum
      whereClause.role = role.toUpperCase();
    }
    
    console.log('Where clause:', whereClause);
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        role: true,
        childrenIds: true,
        classId: true,
        parentId: true,
        subject: true,
        classIds: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`Found ${users.length} users for role: ${role}`);
    res.json(users);
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Attempting to delete user:', id);
    
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user to delete:', user.name, user.role);
    
    // Delete related records first to avoid foreign key constraint errors
    
    // 1. Delete all messages where this user is sender or receiver
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: id },
          { receiverId: id }
        ]
      }
    });
    console.log('Deleted', deletedMessages.count, 'messages for user', id);
    
    // 2. Delete grades if student
    if (user.role === 'STUDENT') {
      const deletedGrades = await prisma.grade.deleteMany({
        where: { studentId: id }
      });
      console.log('Deleted', deletedGrades.count, 'grades for student', id);
      
      // 3. Delete attendance records
      const deletedAttendance = await prisma.attendance.deleteMany({
        where: { studentId: id }
      });
      console.log('Deleted', deletedAttendance.count, 'attendance records for student', id);
    }
    
    // 4. Delete homework/announcements if teacher
    if (user.role === 'TEACHER') {
      const deletedHomework = await prisma.homework.deleteMany({
        where: { teacherId: id }
      });
      console.log('Deleted', deletedHomework.count, 'homework assignments for teacher', id);
      
      const deletedAnnouncements = await prisma.announcement.deleteMany({
        where: { teacherId: id }
      });
      console.log('Deleted', deletedAnnouncements.count, 'announcements for teacher', id);
    }
    
    // 5. Clean up parent-child relationships
    if (user.role === 'STUDENT') {
      const parents = await prisma.user.findMany({
        where: {
          childrenIds: {
            has: user.id,
          },
        },
      });
      
      for (const parent of parents) {
        await prisma.user.update({
          where: { id: parent.id },
          data: {
            childrenIds: parent.childrenIds.filter(childId => childId !== user.id),
          },
        });
      }
      console.log('Updated', parents.length, 'parents to remove child reference');
    }
    
    // 6. Finally delete the user
    const deletedUser = await prisma.user.delete({
      where: { id: id }
    });
    
    console.log('Successfully deleted user:', deletedUser.name);
    res.json({ success: true, message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Delete user error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update user (for avatar and other fields)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar, name, messagingAvailability } = req.body;
    
    console.log('=== SERVER UPDATE USER DEBUG ===');
    console.log('User ID:', id);
    console.log('Request body:', { avatar: avatar ? 'has avatar' : 'no avatar', name, messagingAvailability });
    console.log('Has avatar update:', !!avatar);
    if (avatar) {
      console.log('Avatar length:', avatar.length);
      console.log('Avatar preview:', avatar.substring(0, 100) + '...');
    }
    
    const updateData = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    if (name !== undefined) updateData.name = name;
    if (messagingAvailability !== undefined) updateData.messagingAvailability = messagingAvailability;
    
    console.log('Update data:', updateData);
    
    const user = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    console.log('Updated user:', { 
      id: user.id, 
      name: user.name, 
      hasAvatar: !!user.avatar,
      avatarLength: user.avatar ? user.avatar.length : 0,
      avatarPreview: user.avatar ? user.avatar.substring(0, 50) + '...' : 'none'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 