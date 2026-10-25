const { Trainer, User, Location, Class, TrainerAssignment, Review } = require('../../models');
const { paginate, paginateResponse } = require('../../utils/pagination');

const getAll = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { locationId, isActive } = query;

  const where = {};
  if (locationId) where.locationId = locationId;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const { count, rows } = await Trainer.findAndCountAll({
    where,
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatarUrl', 'isActive'] },
      { model: Location, attributes: ['id', 'name', 'city'] }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const create = async ({ userId, userEmail, bio, specialties, certifications, photoUrl, yearsExperience, locationId, newUser }) => {
  let targetUserId = userId;

  if (!targetUserId && userEmail) {
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
      const err = new Error('No user account found with that email address. The person must register first.');
      err.statusCode = 404;
      throw err;
    }
    targetUserId = user.id;
  }

  if (!targetUserId && newUser) {
    const { firstName, lastName, email, password, phone } = newUser;
    if (!firstName || !lastName || !email || !password) {
      const err = new Error('firstName, lastName, email, password required for new user');
      err.statusCode = 400;
      throw err;
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || null,
      passwordHash: password,
      role: 'trainer'
    });

    targetUserId = user.id;
  } else if (!targetUserId) {
    const err = new Error('userId, userEmail, or newUser is required');
    err.statusCode = 400;
    throw err;
  }

  const existingTrainer = await Trainer.findOne({ where: { userId: targetUserId } });
  if (existingTrainer) {
    const err = new Error('Trainer profile already exists for this user');
    err.statusCode = 409;
    throw err;
  }

  await User.update({ role: 'trainer' }, { where: { id: targetUserId } });

  const trainer = await Trainer.create({
    userId: targetUserId,
    bio: bio || null,
    specialties: specialties || [],
    certifications: certifications || [],
    photoUrl: photoUrl || null,
    yearsExperience: yearsExperience || null,
    locationId: locationId || null
  });

  const trainerWithDetails = await Trainer.findByPk(trainer.id, {
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      { model: Location, attributes: ['id', 'name', 'city'] }
    ]
  });

  return { trainer: trainerWithDetails };
};

const update = async (trainerId, body) => {
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['bio', 'specialties', 'certifications', 'photoUrl', 'yearsExperience', 'locationId', 'isActive'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  await trainer.update(updates);

  const updatedTrainer = await Trainer.findByPk(trainer.id, {
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Location, attributes: ['id', 'name', 'city'] }
    ]
  });

  return { trainer: updatedTrainer };
};

const deactivate = async (trainerId) => {
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  await trainer.update({ isActive: false });
  return { message: 'Trainer deactivated', trainer };
};

const activate = async (trainerId) => {
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  await trainer.update({ isActive: true });
  return { message: 'Trainer activated', trainer };
};

const remove = async (trainerId) => {
  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  const classCount = await Class.count({ where: { trainerId } });
  if (classCount > 0) {
    const err = new Error('This trainer is assigned to classes. Reassign or delete those classes first.');
    err.statusCode = 400;
    throw err;
  }
  await TrainerAssignment.destroy({ where: { trainerId } });
  await Review.destroy({ where: { trainerId } });
  await trainer.destroy();
  return { message: 'Trainer deleted' };
};

module.exports = { getAll, create, update, deactivate, activate, remove };
