const { Op, fn, col } = require('sequelize');
const { Trainer, User, Location, Class, Review } = require('../models');
const { paginate, paginateResponse } = require('../utils/pagination');

const getAll = async (query) => {
  const { locationId, specialty } = query;
  const { page, limit, offset } = paginate(query);

  const where = { isActive: true };
  if (locationId) where.locationId = locationId;
  if (specialty) {
    where.specialties = { [Op.contains]: [specialty] };
  }

  const { count, rows } = await Trainer.findAndCountAll({
    where,
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email'] },
      { model: Location, attributes: ['id', 'name', 'city'] }
    ],
    order: [['rating', 'DESC']],
    limit,
    offset
  });

  return paginateResponse(rows, count, page, limit);
};

const getOne = async (trainerId) => {
  const trainer = await Trainer.findByPk(trainerId, {
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email'] },
      { model: Location }
    ]
  });

  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  const [recentClasses, topReviews] = await Promise.all([
    Class.findAll({
      where: { trainerId: trainer.id, status: 'scheduled' },
      order: [['date', 'ASC'], ['startTime', 'ASC']],
      limit: 5,
      include: [{ model: Location, attributes: ['id', 'name', 'city'] }]
    }),
    Review.findAll({
      where: { trainerId: trainer.id, isPublic: true },
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }],
      order: [['rating', 'DESC'], ['createdAt', 'DESC']],
      limit: 5
    }),
  ]);

  return { trainer, recentClasses, topReviews };
};

const createReview = async (trainerId, { rating, comment, isPublic = true }, user) => {
  if (!rating || rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.statusCode = 400;
    throw err;
  }

  const trainer = await Trainer.findByPk(trainerId);
  if (!trainer) {
    const err = new Error('Trainer not found');
    err.statusCode = 404;
    throw err;
  }

  const review = await Review.create({
    userId: user.id,
    trainerId,
    rating,
    comment,
    isPublic
  });

  const stats = await Review.findOne({
    where: { trainerId: trainer.id },
    attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'count']],
    raw: true,
  });
  const avgRating = parseFloat(Number(stats.avg || 0).toFixed(2));
  const reviewCount = parseInt(stats.count, 10) || 0;
  await trainer.update({ rating: avgRating, reviewCount });

  return { review };
};

module.exports = { getAll, getOne, createReview };
