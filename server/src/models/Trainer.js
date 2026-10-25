const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trainer = sequelize.define('Trainer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  bio: {
    type: DataTypes.TEXT
  },
  specialties: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  certifications: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  photoUrl: {
    type: DataTypes.STRING
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  yearsExperience: {
    type: DataTypes.INTEGER
  },
  locationId: {
    type: DataTypes.UUID,
    references: { model: 'locations', key: 'id' }
  }
}, {
  tableName: 'trainers',
  timestamps: true
});

module.exports = Trainer;
