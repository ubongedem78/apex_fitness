const { Op } = require('sequelize');
const { AuditLog, User } = require('../../models');
const { paginate, paginateResponse } = require('../../utils/pagination');

const getAll = async (query) => {
  const { userId, action, resource, dateFrom, dateTo } = query;
  const { page, limit, offset } = paginate(query);

  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = { [Op.iLike]: `%${action}%` };
  if (resource) where.resource = { [Op.iLike]: `%${resource}%` };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'role'], required: false }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

module.exports = { getAll };
