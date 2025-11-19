import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (plain) => {
  if (!plain) {
    throw new Error('Password is required');
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const comparePassword = async (plain, hashed) => {
  if (!plain || !hashed) {
    return false;
  }
  return bcrypt.compare(plain, hashed);
};

export const generateTempPassword = (length = 12) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%!';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length);
    password += alphabet[idx];
  }
  return password;
};
