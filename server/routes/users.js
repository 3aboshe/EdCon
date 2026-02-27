import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';
import resolveSchoolContext from '../middleware/schoolContext.js';
import { hashPassword, generateTempPassword } from '../utils/password.js';
import { buildAccessCode } from '../utils/codeGenerator.js';
import { validateAccessCode, validateName, validateAndSanitizeAccessCode } from '../utils/validation.js';

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

const ensureParentBelongsToSchool = async (parentId, schoolId) => {
  if (!parentId) return null;
  const parent = await prisma.user.findFirst({
    where: { id: parentId, schoolId, role: 'PARENT' },
  });
  if (!parent) {
    throw new Error('Parent not found in this school');
  }
  return parent;
};

router.use(authenticate);
router.use(requireRole(['SCHOOL_ADMIN', 'SUPER_ADMIN']));
router.use(resolveSchoolContext);

// Get all users for the school (with optional role filter)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;

    const whereClause = {
      schoolId: req.school.id,
    };

    // Add role filter if provided
    if (role && ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'SCHOOL_ADMIN'].includes(role.toUpperCase())) {
      whereClause.role = role.toUpperCase();
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Remove sensitive fields
    const sanitizedUsers = users.map(user => sanitize(user));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Unable to fetch users' });
  }
});

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

    // Validate name (supports all languages)
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.error });
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

    // Validate or generate access code
    let accessCode;
    if (req.body.accessCode && req.body.accessCode.trim()) {
      // Custom access code provided - validate it
      const accessCodeValidation = validateAndSanitizeAccessCode(req.body.accessCode);
      if (!accessCodeValidation.valid) {
        return res.status(400).json({ message: accessCodeValidation.error });
      }
      accessCode = accessCodeValidation.sanitized;
    } else {
      // Auto-generate access code
      accessCode = buildAccessCode(normalizedRole, req.school.code);
    }

    let plainPassword = password;
    let useTempPassword = false;

    // Generate temp password for teachers/parents or when no password provided
    // STUDENTS should NOT get a password
    if ((normalizedRole === 'PARENT' || normalizedRole === 'TEACHER') && (useOneTimePassword || !plainPassword)) {
      plainPassword = generateTempPassword(6);
      useTempPassword = true;
    } else if (normalizedRole === 'STUDENT') {
      // Explicitly no password for students.
      plainPassword = generateTempPassword(32);
      useTempPassword = false;
    } else if (!plainPassword) {
      plainPassword = generateTempPassword(8);
    }

    // Run password hashing and access code check in parallel for speed
    const [passwordHash, existingUser, subjectRecord] = await Promise.all([
      hashPassword(plainPassword),
      // Only check custom access codes
      req.body.accessCode && req.body.accessCode.trim()
        ? prisma.user.findFirst({ where: { accessCode: accessCode } })
        : Promise.resolve(null),
      // Pre-fetch subject for teachers to parallelize
      (normalizedRole === 'TEACHER' && subject)
        ? prisma.subject.findFirst({ where: { name: subject, schoolId: req.school.id } })
        : Promise.resolve(null)
    ]);

    if (existingUser) {
      return res.status(400).json({ message: 'This access code is already taken. Please choose another.' });
    }

    // For teachers with a subject, find all classes that have this subject and auto-assign
    let resolvedClassIds = classIds || [];
    if (normalizedRole === 'TEACHER' && subject && subjectRecord) {
      // Find all classes that have this subject in their subjectIds
      const classesWithSubject = await prisma.class.findMany({
        where: {
          schoolId: req.school.id,
          subjectIds: { has: subjectRecord.id }
        }
      });

      // Add these classes to the teacher's classIds
      const classIdsFromSubject = classesWithSubject.map(c => c.id);
      resolvedClassIds = [...new Set([...resolvedClassIds, ...classIdsFromSubject])];
    }

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
        classIds: resolvedClassIds,
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

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      // Unique constraint violation
      const fieldName = error.meta?.target?.[0] || 'field';
      if (fieldName === 'accessCode') {
        return res.status(409).json({ message: 'This access code is already taken. Please choose another.' });
      }
      return res.status(409).json({ message: 'This user already exists.' });
    }

    // Handle validation errors
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid data provided. Please check your input.' });
    }

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
    // SECURITY: We replace BOTH passwordHash AND temporaryPasswordHash
    // This ensures the old password no longer works
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword, // Replace main password so old one doesn't work
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

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      phone,
      status,
      subject,
      classId,
      classIds,
      parentId,
      metadata,
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, schoolId: req.school.id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found in this school' });
    }

    if (name !== undefined) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({ message: nameValidation.error });
      }
    }

    if (classId !== undefined && classId !== null && classId !== '') {
      await ensureClassBelongsToSchool(classId, req.school.id);
    }

    if (Array.isArray(classIds) && classIds.length > 0) {
      await Promise.all(classIds.map((cid) => ensureClassBelongsToSchool(cid, req.school.id)));
    }

    if (parentId !== undefined && parentId !== null && parentId !== '') {
      await ensureParentBelongsToSchool(parentId, req.school.id);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email ? email.toLowerCase() : null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (status !== undefined) updateData.status = status;
    if (subject !== undefined) updateData.subject = subject || null;
    if (classId !== undefined) updateData.classId = classId || null;
    if (classIds !== undefined) updateData.classIds = Array.isArray(classIds) ? classIds : [];
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (metadata !== undefined) updateData.metadata = metadata || null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ success: true, user: sanitize(updatedUser) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message || 'Unable to update user' });
  }
});

router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const schoolId = req.school.id;

    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId },
      select: { id: true, role: true, parentId: true, childrenIds: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found in this school' });
    }

    await prisma.$transaction(async (tx) => {
      if (user.role === 'PARENT') {
        await tx.user.updateMany({
          where: { parentId: user.id, schoolId },
          data: { parentId: null },
        });
      }

      if (user.role === 'STUDENT' && user.parentId) {
        const parent = await tx.user.findUnique({
          where: { id: user.parentId },
          select: { childrenIds: true },
        });
        if (parent) {
          await tx.user.update({
            where: { id: user.parentId },
            data: { childrenIds: (parent.childrenIds || []).filter((id) => id !== user.id) },
          });
        }
      }

      await tx.user.updateMany({
        where: { createdById: user.id, schoolId },
        data: { createdById: null },
      });

      await tx.grade.deleteMany({ where: { studentId: user.id, schoolId } });
      await tx.attendance.deleteMany({
        where: {
          schoolId,
          OR: [{ studentId: user.id }, { teacherId: user.id }],
        },
      });
      await tx.message.deleteMany({
        where: {
          schoolId,
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
      });

      if (user.role === 'TEACHER') {
        const teacherExams = await tx.exam.findMany({
          where: { teacherId: user.id, schoolId },
          select: { id: true },
        });
        const teacherExamIds = teacherExams.map((exam) => exam.id);

        if (teacherExamIds.length > 0) {
          await tx.grade.deleteMany({ where: { examId: { in: teacherExamIds }, schoolId } });
        }

        await tx.exam.deleteMany({ where: { teacherId: user.id, schoolId } });
        await tx.homework.deleteMany({ where: { teacherId: user.id, schoolId } });
        await tx.announcement.deleteMany({ where: { teacherId: user.id, schoolId } });
      }

      await tx.encryptionKey.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message || 'Unable to delete user' });
  }
});

export default router;
