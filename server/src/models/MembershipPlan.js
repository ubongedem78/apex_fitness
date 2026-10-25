const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MembershipPlan = sequelize.define('MembershipPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  billingCycle: {
    type: DataTypes.ENUM('daily', 'monthly', 'quarterly', 'annual'),
    allowNull: false
  },
  joiningFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  isDailyPass: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  features: {
    type: DataTypes.JSON
  },
  classLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  locationAccess: {
    type: DataTypes.ENUM('single', 'all'),
    defaultValue: 'single'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  paystackPlanCode: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'membership_plans',
  timestamps: true
});

module.exports = MembershipPlan;
