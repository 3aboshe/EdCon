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

    const accessCode = buildAccessCode(normalizedRole, req.school.code);

    let plainPassword = password;
    let requireReset = normalizedRole === 'PARENT';

    if (normalizedRole === 'PARENT' || useOneTimePassword || !plainPassword) {
      plainPassword = generateTempPassword(12);
      requireReset = true;
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
        temporaryPasswordHash: requireReset ? passwordHash : null,
        temporaryPasswordIssuedAt: requireReset ? new Date() : null,
        requiresPasswordReset: requireReset,
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
      credentials: requireReset
        ? { accessCode, temporaryPassword: plainPassword }
        : { accessCode },
    });
  } catch (error) {
    console.error('Create scoped user error:', error);
    res.status(500).json({ message: error.message || 'Unable to create user' });
  }
});

// Get user details with credentials (Super Admin only)
router.get('/:userId/credentials', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        class: true,
        parent: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user details with access code (password is never returned)
    const userDetails = {
      ...sanitize(user),
      hasTemporaryPassword: !!user.temporaryPasswordHash,
      temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt,
      requiresPasswordReset: user.requiresPasswordReset,
    };

    res.json({ success: true, user: userDetails });
  } catch (error) {
    console.error('Get user credentials error:', error);
    res.status(500).json({ message: error.message || 'Unable to fetch user details' });
  }
});

// Reset user password (Super Admin or School Admin)
router.post('/:userId/reset-password', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // School admins can only reset passwords in their school
    if (req.user.role === 'SCHOOL_ADMIN' && user.schoolId !== req.school.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate new temporary password
    const newTempPassword = generateTempPassword();
    const passwordHash = await hashPassword(newTempPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        temporaryPasswordHash: passwordHash,
        temporaryPasswordIssuedAt: new Date(),
        requiresPasswordReset: true,
        passwordHash, // Also update main password hash
      }
    });

    res.json({
      success: true,
      credentials: {
        accessCode: user.accessCode,
        temporaryPassword: newTempPassword,
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Unable to reset password' });
  }
});

export default router;
