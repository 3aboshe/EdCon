import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signSessionToken } from '../utils/token.js';

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, temporaryPasswordHash, ...safeUser } = user;
  return safeUser;
};

router.post('/login', async (req, res) => {
  try {
    const { accessCode, password } = req.body;
    if (!accessCode || !password) {
      return res.status(400).json({ message: 'Access code and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { accessCode: accessCode.trim() },
      include: { school: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials' });
    }

    // Students are not allowed to login - they don't have credentials
    if (user.role === 'STUDENT') {
      return res.status(403).json({ message: 'Students cannot login directly. Please contact your parent or school administrator.' });
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    const tempPasswordMatches = user.temporaryPasswordHash
      ? await comparePassword(password, user.temporaryPasswordHash)
      : false;

    if (!passwordMatches && !tempPasswordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signSessionToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      token,
      requiresPasswordReset: user.requiresPasswordReset,
      user: sanitizeUser(user),
      school: user.school,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Unable to complete login' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Session cleared' });
});

router.use(authenticate);

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { school: true },
  });

  res.json({ success: true, user: sanitizeUser(user), school: user?.school || null });
});

router.post('/reset-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    // Check if current password matches either regular password or temporary password
    const matchesRegular = await comparePassword(currentPassword, req.user.passwordHash);
    const matchesTemporary = req.user.temporaryPasswordHash
      ? await comparePassword(currentPassword, req.user.temporaryPasswordHash)
      : false;

    if (!matchesRegular && !matchesTemporary) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: hashed,
        temporaryPasswordHash: null,
        temporaryPasswordIssuedAt: null,
        requiresPasswordReset: false,
        status: 'ACTIVE',
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Unable to reset password' });
  }
});

// Get parent's children - mobile app endpoint
router.get('/parent/:parentId/children', resolveSchoolContext, async (req, res) => {
  try {
    const { parentId } = req.params;
    
    // Get parent to verify and get childrenIds
    const parent = await prisma.user.findFirst({
      where: {
        id: parentId,
        schoolId: req.school?.id || req.user.schoolId,
        role: 'PARENT'
      }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const childrenIds = parent.childrenIds || [];
    
    if (childrenIds.length === 0) {
      return res.json([]);
    }

    // Get all children with their class information
    const children = await prisma.user.findMany({
      where: {
        id: { in: childrenIds },
        role: 'STUDENT'
      },
      include: {
        class: true
      }
    });

    res.json(children.map(sanitizeUser));
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({ message: 'Unable to fetch children' });
  }
});

router.get('/users', resolveSchoolContext, async (req, res) => {
  try {
    const { role } = req.query;
    const whereClause = {};

    if (req.user.role === 'SUPER_ADMIN') {
      if (req.school) {
        whereClause.schoolId = req.school.id;
      }
    } else {
      whereClause.schoolId = req.user.schoolId;
    }

    if (role && role !== 'all') {
      whereClause.role = role.toString().toUpperCase();
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        class: true,
        parent: true,
      },
    });

    // Return direct array for mobile app compatibility
    res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Unable to fetch users' });
  }
});

router.get('/users/teachers', resolveSchoolContext, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        schoolId: req.school?.id || req.user.schoolId,
        role: 'TEACHER',
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Unable to fetch teachers' });
  }
});

// Get user by ID (primary lookup method)
router.get('/user/:identifier', resolveSchoolContext, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // First try to find by ID
    let user = await prisma.user.findFirst({
      where: {
        id: identifier,
        schoolId: req.school?.id || req.user.schoolId,
      },
    });

    // If not found by ID, try accessCode
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          accessCode: identifier,
          schoolId: req.school?.id || req.user.schoolId,
        },
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return direct user object (not wrapped) for mobile app compatibility
    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Unable to fetch user' });
  }
});

router.get('/codes', resolveSchoolContext, async (req, res) => {
  try {
    const { role } = req.query;
    const whereClause = {
      schoolId: req.school?.id || req.user.schoolId,
    };

    if (role && role !== 'all') {
      whereClause.role = role.toString().toUpperCase();
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        accessCode: true,
        name: true,
        role: true,
        childrenIds: true,
        classId: true,
        parentId: true,
        subject: true,
        classIds: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ message: 'Unable to fetch codes' });
  }
});

// Update user
router.put('/users/:id', resolveSchoolContext, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        id: id,
        schoolId: req.school?.id || req.user.schoolId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update data
    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.messagingAvailability !== undefined) updateData.messagingAvailability = updates.messagingAvailability;
    if (updates.classId !== undefined) updateData.classId = updates.classId;
    if (updates.parentId !== undefined) updateData.parentId = updates.parentId;

    // Handle teacher subject update - auto-assign classes
    if (updates.subject !== undefined && user.role === 'TEACHER') {
      updateData.subject = updates.subject;

      // Find all classes that have subjects matching this teacher's new subject
      const subjectRecord = await prisma.subject.findFirst({
        where: { name: updates.subject, schoolId: user.schoolId }
      });

      if (subjectRecord) {
        const classesWithSubject = await prisma.class.findMany({
          where: {
            schoolId: user.schoolId,
            subjectIds: { has: subjectRecord.id }
          }
        });

        // Merge with existing classIds (don't remove existing assignments)
        const existingClassIds = user.classIds || [];
        const newClassIds = classesWithSubject.map(c => c.id);
        updateData.classIds = [...new Set([...existingClassIds, ...newClassIds])];
        
        console.log(`Auto-assigned classes to teacher ${user.name} with subject ${updates.subject}:`, updateData.classIds);
      }
    }

    // Handle explicit classIds update
    if (updates.classIds !== undefined) {
      updateData.classIds = updates.classIds;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Sanitize response
    const { passwordHash, temporaryPasswordHash, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Unable to update user' });
  }
});

router.delete('/users/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), resolveSchoolContext, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        schoolId: req.school?.id || req.user.schoolId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Unable to delete user' });
  }
});

export default router;
