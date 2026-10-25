const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'locations', key: 'id' }
  },
  trainerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'trainers', key: 'id' }
  },
  classType: {
    type: DataTypes.ENUM('hiit', 'yoga', 'spinning', 'boxing', 'pilates', 'strength', 'cardio', 'other'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bookedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  waitlistCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'cancelled', 'completed'),
    defaultValue: 'scheduled'
  },
  cancellationReason: {
    type: DataTypes.TEXT
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'classes',
  timestamps: true
});

module.exports = Class;
