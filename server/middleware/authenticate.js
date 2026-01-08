import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

const HEADER = 'authorization';

const authenticate = async (req, res, next) => {
  try {
    const headerValue = req.headers[HEADER];
    if (!headerValue || typeof headerValue !== 'string') {
      return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = headerValue.startsWith('Bearer ')
      ? headerValue.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret is not configured' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.sub) {
      return res.status(401).json({ message: 'Invalid session token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { school: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Session expired, please login again' });
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);

    // JWT specific errors should return 401
    const isAuthError =
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError';

    const status = isAuthError ? 401 : 500;
    const message = isAuthError ? 'Session invalid or expired' : 'Authentication failed';

    return res.status(status).json({ message });
  }
};

export default authenticate;
