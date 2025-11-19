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

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
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

    const matches = await comparePassword(currentPassword, req.user.passwordHash);
    if (!matches) {
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
    });

    res.json({ success: true, data: users.map(sanitizeUser) });
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

router.get('/user/:code', resolveSchoolContext, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        accessCode: req.params.code,
        schoolId: req.school?.id || req.user.schoolId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Error fetching user by code:', error);
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
