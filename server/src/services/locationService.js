const { Op } = require('sequelize');
const { Location, Class } = require('../models');
const sequelize = require('../config/database');

const getAll = async () => {
  const locations = await Location.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']]
  });
  return { locations };
};

const getOne = async (locationId) => {
  const location = await Location.findByPk(locationId);
  if (!location) {
    const err = new Error('Location not found');
    err.statusCode = 404;
    throw err;
  }

  const today = new Date().toISOString().split('T')[0];
  const upcomingClassesCount = await Class.count({
    where: {
      locationId: location.id,
      status: 'scheduled',
      date: { [Op.gte]: today }
    }
  });

  return { location, upcomingClassesCount };
};

module.exports = { getAll, getOne };
