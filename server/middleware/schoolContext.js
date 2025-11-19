import { prisma } from '../config/db.js';

const HEADER_KEY = 'x-edcon-school-code';

const resolveSchoolContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      const requestedCode = req.headers[HEADER_KEY] || req.query.schoolCode;
      if (!requestedCode) {
        return res.status(400).json({ message: 'School code header required for super admin actions' });
      }

      const school = await prisma.school.findUnique({ where: { code: requestedCode } });
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }

      req.school = school;
      return next();
    }

    if (!req.user.schoolId || !req.user.schoolCode) {
      return res.status(409).json({ message: 'User is not attached to a school' });
    }

    // Cache the school so we do not hit the DB repeatedly
    if (!req.school) {
      req.school = {
        id: req.user.schoolId,
        code: req.user.schoolCode,
        name: req.user.school?.name,
      };
    }

    next();
  } catch (error) {
    console.error('School context error:', error);
    res.status(500).json({ message: 'Unable to resolve school context' });
  }
};

export default resolveSchoolContext;
