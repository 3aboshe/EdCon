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

    const tempPassword = generateTempPassword(14);
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

export default router;
