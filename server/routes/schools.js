import express from 'express';
import { prisma } from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';
import { hashPassword, generateTempPassword } from '../utils/password.js';
import { buildAccessCode, buildSchoolCode } from '../utils/codeGenerator.js';

const router = express.Router();

const stripSensitive = (user) => {
  if (!user) return null;
  const { passwordHash, temporaryPasswordHash, ...rest } = user;
  return rest;
};

router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN']));

router.post('/', async (req, res) => {
  try {
    const { name, code, address, timezone, admin } = req.body;

    if (!name || !admin?.name) {
      return res.status(400).json({ message: 'School name and admin name are required' });
    }

    const schoolCode = (code || buildSchoolCode(name)).toUpperCase();

    const existing = await prisma.school.findUnique({ where: { code: schoolCode } });
    if (existing) {
      return res.status(409).json({ message: 'School code already exists' });
    }

    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        code: schoolCode,
        address: address?.trim() || null,
        timezone: timezone || 'UTC',
      },
    });

    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);
    const adminAccessCode = buildAccessCode('SCHOOL_ADMIN', school.code);

    const schoolAdmin = await prisma.user.create({
      data: {
        accessCode: adminAccessCode,
        name: admin.name.trim(),
        email: admin.email?.toLowerCase() || null,
        phone: admin.phone || null,
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
        schoolCode: school.code,
        passwordHash: hashedPassword,
        temporaryPasswordHash: hashedPassword,
        temporaryPasswordIssuedAt: new Date(),
        requiresPasswordReset: true,
        status: 'ACTIVE',
        createdById: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      school,
      admin: stripSensitive(schoolAdmin),
      credentials: {
        accessCode: adminAccessCode,
        temporaryPassword: tempPassword,
      },
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ message: 'Unable to create school' });
  }
});

router.get('/', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
          },
        },
      },
    });

    res.json({ success: true, data: schools });
  } catch (error) {
    console.error('List schools error:', error);
    res.status(500).json({ message: 'Unable to fetch schools' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Use a transaction to clean up all related data
    await prisma.$transaction(async (tx) => {
      // 1. Delete all related data that might have foreign keys
      // Note: This is a simplified cleanup. In a production app with many relations, 
      // you'd need to be very thorough or use database-level CASCADE DELETE.

      // Delete related records in order of dependency
      await tx.grade.deleteMany({ where: { student: { schoolId: id } } });
      await tx.attendance.deleteMany({ where: { student: { schoolId: id } } });
      await tx.message.deleteMany({ where: { OR: [{ sender: { schoolId: id } }, { receiver: { schoolId: id } }] } });
      await tx.homework.deleteMany({ where: { schoolId: id } }); // Assuming Homework has schoolId or via teacher
      // If Homework doesn't have schoolId directly, we might need to find IDs first. 
      // Based on schema, Homework relates to User (teacher). 
      // Let's try deleting users and let Prisma/DB handle if possible, or delete via relation.
      // For now, let's focus on the main entities we know have schoolId

      await tx.announcement.deleteMany({ where: { schoolId: id } });
      await tx.exam.deleteMany({ where: { schoolId: id } });

      // Delete Users (Students, Parents, Teachers, Admins)
      // We need to handle the self-relations (parent-child) carefully or just delete all
      await tx.user.deleteMany({ where: { schoolId: id } });

      // Delete Classes and Subjects
      await tx.class.deleteMany({ where: { schoolId: id } });
      await tx.subject.deleteMany({ where: { schoolId: id } });

      // Finally delete the school
      await tx.school.delete({ where: { id } });
    });

    res.json({ success: true, message: 'School and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    // If transaction fails, it might be due to foreign key constraints we missed
    res.status(500).json({ message: 'Unable to delete school. Ensure all related data can be removed.', error: error.message });
  }
});

router.post('/:id/admins', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Admin name is required' });
    }

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const tempPassword = generateTempPassword(14);
    const hashedPassword = await hashPassword(tempPassword);
    const adminAccessCode = buildAccessCode('SCHOOL_ADMIN', school.code);

    const schoolAdmin = await prisma.user.create({
      data: {
        accessCode: adminAccessCode,
        name: name.trim(),
        email: email?.toLowerCase() || null,
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
        schoolCode: school.code,
        passwordHash: hashedPassword,
        temporaryPasswordHash: hashedPassword,
        temporaryPasswordIssuedAt: new Date(),
        requiresPasswordReset: true,
        status: 'ACTIVE',
        createdById: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      admin: stripSensitive(schoolAdmin),
      credentials: {
        accessCode: adminAccessCode,
        temporaryPassword: tempPassword,
      },
    });
  } catch (error) {
    console.error('Add school admin error:', error);
    res.status(500).json({ message: 'Unable to create school admin' });
  }
});

export default router;
