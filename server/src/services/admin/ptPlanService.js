const { PTPlan, PTRequest } = require('../../models');

const err = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const getAll = async () => {
  const plans = await PTPlan.findAll({ order: [['sortOrder', 'ASC'], ['sessions', 'ASC']] });
  return { plans };
};

const getActive = async () => {
  const plans = await PTPlan.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC'], ['sessions', 'ASC']],
  });
  return { plans };
};

const create = async ({ name, sessions, durationMonths, price, description, sortOrder }) => {
  if (!name || !price) throw err('name and price are required', 400);
  if (sessions == null && durationMonths == null) throw err('sessions is required', 400);
  if (sessions != null && (isNaN(parseInt(sessions)) || parseInt(sessions) < 1)) throw err('sessions must be a positive integer', 400);
  if (durationMonths != null && (isNaN(parseInt(durationMonths)) || parseInt(durationMonths) < 1)) throw err('durationMonths must be a positive integer', 400);
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) throw err('price must be a positive number', 400);

  const plan = await PTPlan.create({
    name,
    sessions: sessions != null ? parseInt(sessions) : null,
    durationMonths: durationMonths != null ? parseInt(durationMonths) : null,
    price: parseFloat(price),
    description: description || null,
    sortOrder: sortOrder != null ? parseInt(sortOrder) : 0,
  });
  return { plan };
};

const update = async (id, { name, sessions, durationMonths, price, description, sortOrder }) => {
  const plan = await PTPlan.findByPk(id);
  if (!plan) throw err('PT plan not found', 404);

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (sessions !== undefined) updates.sessions = sessions != null ? parseInt(sessions) : null;
  if (durationMonths !== undefined) updates.durationMonths = durationMonths != null ? parseInt(durationMonths) : null;
  if (price !== undefined) updates.price = parseFloat(price);
  if (description !== undefined) updates.description = description || null;
  if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder);

  await plan.update(updates);
  return { plan };
};

const activate = async (id) => {
  const plan = await PTPlan.findByPk(id);
  if (!plan) throw err('PT plan not found', 404);
  await plan.update({ isActive: true });
  return { plan };
};

const deactivate = async (id) => {
  const plan = await PTPlan.findByPk(id);
  if (!plan) throw err('PT plan not found', 404);
  await plan.update({ isActive: false });
  return { plan };
};

const remove = async (id) => {
  const plan = await PTPlan.findByPk(id);
  if (!plan) throw err('PT plan not found', 404);

  await PTRequest.update({ ptPlanId: null }, { where: { ptPlanId: id } });
  await plan.destroy();
  return { message: 'PT plan deleted' };
};

module.exports = { getAll, getActive, create, update, activate, deactivate, remove };
