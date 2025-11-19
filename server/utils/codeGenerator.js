import { customAlphabet } from 'nanoid';

const alphaNumeric = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const numeric = customAlphabet('0123456789', 4);

export const buildAccessCode = (role, schoolCode) => {
  const rolePrefixMap = {
    SUPER_ADMIN: 'SUP',
    SCHOOL_ADMIN: 'ADM',
    TEACHER: 'TCH',
    PARENT: 'PAR',
    STUDENT: 'STD'
  };

  const prefix = rolePrefixMap[role] || 'USR';
  const random = alphaNumeric();
  const schoolSegment = (schoolCode || 'GEN').toUpperCase();
  return `${schoolSegment}-${prefix}-${random}`;
};

export const buildSchoolCode = (name) => {
  const sanitized = name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
  return `${sanitized || 'SCH'}${numeric()}`;
};
