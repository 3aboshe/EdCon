const normalize = (role) => role?.toUpperCase();

const requireRole = (allowedRoles = []) => {
  const normalized = allowedRoles.map(normalize);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = normalize(req.user.role);
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export default requireRole;
