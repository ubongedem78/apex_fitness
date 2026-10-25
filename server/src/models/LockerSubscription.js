const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LockerSubscription = sequelize.define('LockerSubscription', {
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
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'active',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  paystackSubscriptionCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paystackCustomerCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  authorizationCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  termsAcceptedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'locker_subscriptions',
  timestamps: true,
});

module.exports = LockerSubscription;
