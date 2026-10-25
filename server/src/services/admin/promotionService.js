const { Op } = require('sequelize');
const { Promotion } = require('../../models');
const { paginate, paginateResponse } = require('../../utils/pagination');

const getAll = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { isActive } = query;

  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const { count, rows } = await Promotion.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const create = async ({ code, name, description, discountType, discountAmount, minimumAmount, validFrom, validTo, usageLimit, applicablePlans }) => {
  if (!code || !name || !discountType || !discountAmount) {
    const err = new Error('code, name, discountType, discountAmount are required');
    err.statusCode = 400;
    throw err;
  }

  if (!['percentage', 'fixed'].includes(discountType)) {
    const err = new Error('discountType must be percentage or fixed');
    err.statusCode = 400;
    throw err;
  }

  const existing = await Promotion.findOne({ where: { code: code.toUpperCase() } });
  if (existing) {
    const err = new Error('Promotion code already exists');
    err.statusCode = 409;
    throw err;
  }

  const promotion = await Promotion.create({
    code: code.toUpperCase(),
    name,
    description: description || null,
    discountType,
    discountAmount: parseFloat(discountAmount),
    minimumAmount: minimumAmount ? parseFloat(minimumAmount) : null,
    validFrom: validFrom || null,
    validTo: validTo || null,
    usageLimit: usageLimit || null,
    applicablePlans: applicablePlans || null
  });

  return { promotion };
};

const update = async (promotionId, body) => {
  const promotion = await Promotion.findByPk(promotionId);
  if (!promotion) {
    const err = new Error('Promotion not found');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['name', 'description', 'discountType', 'discountAmount', 'minimumAmount', 'validFrom', 'validTo', 'usageLimit', 'isActive', 'applicablePlans'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  await promotion.update(updates);
  return { promotion };
};

const remove = async (promotionId) => {
  const promotion = await Promotion.findByPk(promotionId);
  if (!promotion) {
    const err = new Error('Promotion not found');
    err.statusCode = 404;
    throw err;
  }

  await promotion.destroy();
  return { message: 'Promotion deleted' };
};

const validate = async ({ code, amount, planId }) => {
  if (!code || !amount) {
    const err = new Error('code and amount are required');
    err.statusCode = 400;
    throw err;
  }

  const promo = await Promotion.findOne({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { [Op.lte]: new Date() },
      validTo: { [Op.gte]: new Date() }
    }
  });

  if (!promo) {
    const err = new Error('Invalid or expired promo code');
    err.statusCode = 404;
    throw err;
  }

  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    const err = new Error('Promo code usage limit reached');
    err.statusCode = 400;
    throw err;
  }

  if (promo.minimumAmount && parseFloat(amount) < parseFloat(promo.minimumAmount)) {
    const err = new Error(`Minimum order amount is ${promo.minimumAmount}`);
    err.statusCode = 400;
    throw err;
  }

  if (planId && promo.applicablePlans && promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planId)) {
    const err = new Error('Promo code not valid for this plan');
    err.statusCode = 400;
    throw err;
  }

  let discountedAmount;
  let discountApplied;
  if (promo.discountType === 'percentage') {
    discountApplied = parseFloat(amount) * parseFloat(promo.discountAmount) / 100;
    discountedAmount = parseFloat(amount) - discountApplied;
  } else {
    discountApplied = parseFloat(promo.discountAmount);
    discountedAmount = Math.max(0, parseFloat(amount) - discountApplied);
  }

  return {
    promo: { id: promo.id, name: promo.name, code: promo.code, discountType: promo.discountType, discountAmount: promo.discountAmount },
    originalAmount: parseFloat(amount),
    discountApplied: parseFloat(discountApplied.toFixed(2)),
    finalAmount: parseFloat(discountedAmount.toFixed(2))
  };
};

module.exports = { getAll, create, update, remove, validate };
