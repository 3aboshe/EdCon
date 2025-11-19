import jwt from 'jsonwebtoken';

const TOKEN_TTL = '12h';

export const signSessionToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      role: user.role,
      schoolId: user.schoolId || null,
      schoolCode: user.schoolCode || null,
    },
    process.env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: TOKEN_TTL,
    }
  );
};
