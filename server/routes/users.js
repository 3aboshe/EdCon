import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import { hashPassword, generateTempPassword } from '../utils/password.js';
import { buildAccessCode } from '../utils/codeGenerator.js';

const router = express.Router();

const sanitize = (user) => {
  if (!user) return null;
  const { passwordHash, temporaryPasswordHash, ...rest } = user;
  return rest;
};

const ensureClassBelongsToSchool = async (classId, schoolId) => {
  if (!classId) return null;
  const klass = await prisma.class.findFirst({ where: { id: classId, schoolId } });
  if (!klass) {
    throw new Error('Class does not belong to this school');
  }
  return klass;
};

router.use(authenticate);
router.use(requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']));
router.use(resolveSchoolContext);

router.post('/', async (req, res) => {
  try {
    const {
      role,
      name,
      email,
      phone,
      password,
      useOneTimePassword,
      subject,
      classId,
      classIds,
      parentId,
      metadata,
    } = req.body;

    if (!role || !name) {
      return res.status(400).json({ message: 'Role and name are required' });
    }

    const normalizedRole = role.toString().toUpperCase();

    if (!['TEACHER', 'PARENT', 'STUDENT'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Only teacher, parent, or student accounts can be created here' });
    }

    if (classId) {
      await ensureClassBelongsToSchool(classId, req.school.id);
    }

    if (Array.isArray(classIds) && classIds.length > 0) {
      await Promise.all(classIds.map((cid) => ensureClassBelongsToSchool(cid, req.school.id)));
    }

    if (parentId) {
      const parent = await prisma.user.findFirst({
        where: { id: parentId, schoolId: req.school.id, role: 'PARENT' },
      });
      if (!parent) {
        return res.status(404).json({ message: 'Parent not found in this school' });
      }
    }

    // Use custom access code if provided, otherwise generate one
    const accessCode = req.body.accessCode?.trim() || buildAccessCode(normalizedRole, req.school.code);

    let plainPassword = password;
    let useTempPassword = false;

    // Generate temp password for teachers/parents or when no password provided
    // STUDENTS should NOT get a password
    if ((normalizedRole === 'PARENT' || normalizedRole === 'TEACHER') && (useOneTimePassword || !plainPassword)) {
      plainPassword = generateTempPassword(6);
      useTempPassword = true;
    } else if (normalizedRole === 'STUDENT') {
      // Explicitly no password for students unless manually provided (which shouldn't happen based on reqs)
      // If logic requires existing password, we keep what was passed, but we don't auto-gen temp one.
      useTempPassword = false;
    } else if (!plainPassword) {
      // Fallback for other roles if needed, though they usually have passwords
      plainPassword = generateTempPassword(8);
    }

    const passwordHash = await hashPassword(plainPassword);
    const user = await prisma.user.create({
      data: {
        accessCode,
        name: name.trim(),
        email: email?.toLowerCase() || null,
        phone: phone || null,
        role: normalizedRole,
        schoolId: req.school.id,
        schoolCode: req.school.code,
        passwordHash,
        temporaryPasswordHash: useTempPassword ? passwordHash : null,
        temporaryPasswordIssuedAt: useTempPassword ? new Date() : null,
        requiresPasswordReset: useTempPassword, // Trigger password change on first login
        status: normalizedRole === 'PARENT' ? 'INVITED' : 'ACTIVE',
        subject: subject || null,
        classId: classId || null,
        classIds: classIds || [],
        parentId: parentId || null,
        metadata: metadata || null,
        createdById: req.user.id,
      },
    });

    if (normalizedRole === 'STUDENT' && parentId) {
      await prisma.user.update({
        where: { id: parentId },
        data: {
          childrenIds: { push: user.id },
        },
      });
    }

    res.status(201).json({
      success: true,
      user: sanitize(user),
      credentials: useTempPassword
        ? { accessCode, temporaryPassword: plainPassword }
        : { accessCode },
    });
  } catch (error) {
    console.error('Create scoped user error:', error);
    res.status(500).json({ message: error.message || 'Unable to create user' });
  }
});

// Get user credentials (access code and temp password status) - for admin viewing
router.get('/:userId/credentials', async (req, res) => {
  try {
    const { userId } = req.params;
    const schoolId = req.school.id;

    // Verify user belongs to this school
    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found in this school' });
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessCode: user.accessCode,
        hasTemporaryPassword: !!user.temporaryPasswordHash,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user credentials error:', error);
    res.status(500).json({ message: 'Unable to fetch user credentials' });
  }
});

// Reset user password (admin action) - generates new temporary password
router.post('/:userId/reset-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const schoolId = req.school.id;

    // Verify user belongs to this school
    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found in this school' });
    }

    // Generate new temporary password (shorter for usability)
    const plainPassword = generateTempPassword(6);
    const hashedPassword = await hashPassword(plainPassword);

    // Update user with new temporary password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        temporaryPasswordHash: hashedPassword,
        temporaryPasswordIssuedAt: new Date(),
        requiresPasswordReset: true,
      },
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        accessCode: updatedUser.accessCode,
        temporaryPassword: plainPassword,
        hasTemporaryPassword: true,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ message: 'Unable to reset password' });
  }
});

export default router;
