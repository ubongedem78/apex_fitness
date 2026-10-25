const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const requireAdmin            = requireRole('admin');
const requireAdminOrManager   = requireRole('admin', 'manager');
const requireStaffOrAbove     = requireRole('admin', 'manager', 'staff');
const requireReceptionist     = requireRole('receptionist');
const requireReceptionistOrStaff = requireRole('admin', 'manager', 'staff', 'receptionist');

module.exports = {
  requireRole,
  requireAdmin,
  requireAdminOrManager,
  requireStaffOrAbove,
  requireReceptionist,
  requireReceptionistOrStaff,
};
