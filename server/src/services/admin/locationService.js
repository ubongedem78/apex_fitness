const { Location } = require('../../models');

const getAll = async () => {
  const locations = await Location.findAll({ order: [['name', 'ASC']] });
  return { locations };
};

const getOne = async (locationId) => {
  const location = await Location.findByPk(locationId);
  if (!location) {
    const err = new Error('Location not found');
    err.statusCode = 404;
    throw err;
  }
  return { location };
};

const create = async ({ name, address, city, state, phone, email, openingHours, amenities, capacity, latitude, longitude }) => {
  if (!name || !address || !city || !state) {
    const err = new Error('name, address, city, and state are required');
    err.statusCode = 400;
    throw err;
  }

  const location = await Location.create({
    name,
    address,
    city,
    state,
    phone: phone || null,
    email: email || null,
    openingHours: openingHours || null,
    amenities: amenities || null,
    capacity: capacity || null,
    latitude: latitude || null,
    longitude: longitude || null,
  });

  return { location };
};

const update = async (locationId, body) => {
  const location = await Location.findByPk(locationId);
  if (!location) {
    const err = new Error('Location not found');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['name', 'address', 'city', 'state', 'phone', 'email', 'openingHours', 'amenities', 'capacity', 'latitude', 'longitude', 'isActive'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  await location.update(updates);
  return { location };
};

const activate = async (locationId) => {
  const location = await Location.findByPk(locationId);
  if (!location) {
    const err = new Error('Location not found');
    err.statusCode = 404;
    throw err;
  }
  await location.update({ isActive: true });
  return { message: 'Location activated', location };
};

const deactivate = async (locationId) => {
  const location = await Location.findByPk(locationId);
  if (!location) {
    const err = new Error('Location not found');
    err.statusCode = 404;
    throw err;
  }
  await location.update({ isActive: false });
  return { message: 'Location deactivated', location };
};

module.exports = { getAll, getOne, create, update, activate, deactivate };
