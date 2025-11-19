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

export default router;
