const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrainerAssignment = sequelize.define('TrainerAssignment', {
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

  trainerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'trainers', key: 'id' }
  },

  assignedByUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'trainer_assignments',
  timestamps: true
});

module.exports = TrainerAssignment;
