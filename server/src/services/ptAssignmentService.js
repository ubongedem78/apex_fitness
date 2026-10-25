const { TrainerAssignment, Trainer, User } = require('../models');
const { sendPTAssigned } = require('../utils/email');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const assignTrainer = async ({ userId, trainerId, notes }, assignedByUser) => {
  const member = await User.findOne({ where: { id: userId, role: 'member' } });
  if (!member) throw err('Member not found', 404);

  const trainer = await Trainer.findByPk(trainerId, {
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] }],
  });
  if (!trainer) throw err('Trainer not found', 404);

  await TrainerAssignment.update(
    { isActive: false },
    { where: { userId, isActive: true } }
  );

  const assignment = await TrainerAssignment.create({
    userId,
    trainerId,
    assignedByUserId: assignedByUser.id,
    isActive: true,
    notes: notes || null,
  });

  sendPTAssigned(member, trainer).catch(() => {});

  const { Notification } = require('../models');
  await Notification.create({
    userId: member.id,
    title: 'Personal Trainer Assigned',
    message: `${trainer.User ? `${trainer.User.firstName} ${trainer.User.lastName}` : 'A trainer'} has been assigned as your personal trainer.`,
    type: 'general',
    metadata: { trainerId, assignmentId: assignment.id },
  });

  return { assignment, trainer };
};

const removeAssignment = async (userId) => {
  const updated = await TrainerAssignment.update(
    { isActive: false },
    { where: { userId, isActive: true } }
  );
  return { removed: updated[0] > 0 };
};

const getAssignment = async (userId) => {
  const assignment = await TrainerAssignment.findOne({
    where: { userId, isActive: true },
    include: [
      {
        model: Trainer,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email'] }],
      },
    ],
  });
  return { assignment };
};

const listAssignments = async ({ locationId } = {}) => {
  const where = { isActive: true };
  const assignments = await TrainerAssignment.findAll({
    where,
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'memberNumber'] },
      {
        model: Trainer,
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  return { assignments };
};

module.exports = { assignTrainer, removeAssignment, getAssignment, listAssignments };
