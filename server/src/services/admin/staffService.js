const { Op } = require('sequelize');
const { User } = require('../../models');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'staff'];

const getAll = async (query = {}) => {
  const where = { role: { [Op.in]: STAFF_ROLES } };
  if (query.search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${query.search}%` } },
      { lastName:  { [Op.iLike]: `%${query.search}%` } },
      { email:     { [Op.iLike]: `%${query.search}%` } },
    ];
  }
  if (query.role && STAFF_ROLES.includes(query.role)) where.role = query.role;

  const staff = await User.findAll({
    where,
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'createdAt'],
    order: [['role', 'ASC'], ['firstName', 'ASC']],
  });
  return { staff };
};

const create = async ({ firstName, lastName, email, phone, password, role }) => {
  if (!firstName || !lastName || !email || !password || !role) {
    throw err('firstName, lastName, email, password, and role are required', 400);
  }
  if (!STAFF_ROLES.includes(role)) throw err(`role must be one of: ${STAFF_ROLES.join(', ')}`, 400);
  if (password.length < 8) throw err('Password must be at least 8 characters', 400);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) throw err('An account with this email already exists', 409);

  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    phone: phone || null,
    passwordHash: password,
    role,
    isActive: true,
    isEmailVerified: true,
  });

  const { passwordHash: _, ...safe } = user.toJSON();
  return { user: safe };
};

const update = async (id, { firstName, lastName, email, phone, role }, requestingUserId) => {
  const user = await User.findByPk(id);
  if (!user) throw err('Staff member not found', 404);
  if (!STAFF_ROLES.includes(user.role)) throw err('This user is not a staff member', 400);

  if (role && id === requestingUserId && role !== user.role) {
    throw err('You cannot change your own role', 403);
  }
  if (role && !STAFF_ROLES.includes(role)) throw err(`role must be one of: ${STAFF_ROLES.join(', ')}`, 400);

  const normalizedEmail = email ? email.trim().toLowerCase() : email;
  if (normalizedEmail && normalizedEmail !== user.email) {
    const conflict = await User.findOne({ where: { email: normalizedEmail, id: { [Op.ne]: id } } });
    if (conflict) throw err('Email is already in use', 409);
  }

  const updates = {};
  if (firstName) updates.firstName = firstName;
  if (lastName)  updates.lastName  = lastName;
  if (normalizedEmail) updates.email = normalizedEmail;
  if (phone !== undefined) updates.phone = phone || null;
  if (role)      updates.role      = role;

  if (role && role !== user.role) updates.tokenVersion = (user.tokenVersion || 0) + 1;

  await user.update(updates);
  const { passwordHash: _, ...safe } = user.toJSON();
  return { user: safe };
};

const resetPassword = async (id, { password }) => {
  if (!password || password.length < 8) throw err('Password must be at least 8 characters', 400);
  const user = await User.findByPk(id);
  if (!user) throw err('Staff member not found', 404);
  if (!STAFF_ROLES.includes(user.role)) throw err('This user is not a staff member', 400);

  await user.update({ passwordHash: password, tokenVersion: (user.tokenVersion || 0) + 1 });
  return { message: 'Password updated successfully' };
};

const toggleActive = async (id, requestingUserId) => {
  const user = await User.findByPk(id);
  if (!user) throw err('Staff member not found', 404);
  if (!STAFF_ROLES.includes(user.role)) throw err('This user is not a staff member', 400);
  if (id === requestingUserId) throw err('You cannot deactivate your own account', 403);

  await user.update({ isActive: !user.isActive });
  const { passwordHash: _, ...safe } = user.toJSON();
  return { user: safe };
};

module.exports = { getAll, create, update, resetPassword, toggleActive };
