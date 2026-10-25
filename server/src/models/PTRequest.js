const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PTRequest = sequelize.define('PTRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },

  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ptPlanId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'pt_plans', key: 'id' },
  },

  durationMonths: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sessions: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'assigned', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  confirmedById: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'pt_requests',
  timestamps: true,
});

module.exports = PTRequest;
