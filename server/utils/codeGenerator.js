import { customAlphabet } from 'nanoid';

const alphaNumeric = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const numeric = customAlphabet('0123456789', 4);

export const buildAccessCode = (role, schoolCode) => {
  const rolePrefixMap = {
    SUPER_ADMIN: 'S',
    SCHOOL_ADMIN: 'A',
    TEACHER: 'T',
    PARENT: 'P',
    STUDENT: 'D'
  };

  const prefix = rolePrefixMap[role] || 'U';
  const random = alphaNumeric(); // 6 chars
  return `${prefix}${random}`; // e.g., D2A3B4C
};

export const buildSchoolCode = (name) => {
  const sanitized = name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
  return `${sanitized || 'SCH'}${numeric()}`;
};
