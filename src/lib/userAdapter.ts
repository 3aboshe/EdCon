import { BackendUserRole, UserRole, User } from '../types';

const ROLE_MAP: Record<BackendUserRole, UserRole> = {
  SUPER_ADMIN: 'admin',
  SCHOOL_ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
};

const fallbackRole: UserRole = 'parent';

const normalizeRole = (roleValue?: string): { backendRole?: BackendUserRole; role: UserRole } => {
  if (!roleValue) {
    return { backendRole: undefined, role: fallbackRole };
  }

  const normalized = roleValue.toString().toUpperCase() as BackendUserRole;
  const mappedRole = ROLE_MAP[normalized];

  if (mappedRole) {
    return { backendRole: normalized, role: mappedRole };
  }

  const lower = roleValue.toString().toLowerCase() as UserRole;
  return { backendRole: undefined, role: (['parent', 'teacher', 'student', 'admin'] as UserRole[]).includes(lower) ? lower : fallbackRole };
};

export const mapApiUserToClient = (apiUser: any): User => {
  if (!apiUser) {
    return {
      id: '',
      name: 'Unknown User',
      role: fallbackRole,
    };
  }

  const { backendRole: normalizedBackendRole, role } = normalizeRole(apiUser.role);

  return {
    id: apiUser.id,
    name: apiUser.name || 'Unknown User',
    role,
    backendRole: apiUser.backendRole || normalizedBackendRole,
    accessCode: apiUser.accessCode || undefined,
    schoolId: apiUser.schoolId || undefined,
    schoolCode: apiUser.schoolCode || undefined,
    email: apiUser.email || undefined,
    phone: apiUser.phone || undefined,
    status: apiUser.status || undefined,
    requiresPasswordReset: Boolean(apiUser.requiresPasswordReset),
    parentId: apiUser.parentId || undefined,
    classId: apiUser.classId || undefined,
    avatar: apiUser.avatar || undefined,
    childrenIds: Array.isArray(apiUser.childrenIds) ? apiUser.childrenIds : [],
    classIds: Array.isArray(apiUser.classIds) ? apiUser.classIds : [],
    subject: apiUser.subject || undefined,
    messagingAvailability: apiUser.messagingAvailability || undefined,
    school: apiUser.school || null,
  };
};

export const mapApiUsers = (users: any[] = []): User[] => {
  return users.map(mapApiUserToClient);
};
