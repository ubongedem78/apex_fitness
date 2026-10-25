const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
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
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'membership_plans', key: 'id' }
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'locations', key: 'id' }
  },
  paystackSubscriptionCode: {
    type: DataTypes.STRING
  },
  paystackAuthorizationCode: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'cancelled', 'expired', 'attention'),
    defaultValue: 'active'
  },
  startDate: {
    type: DataTypes.DATEONLY
  },
  endDate: {
    type: DataTypes.DATEONLY
  },
  nextBillingDate: {
    type: DataTypes.DATEONLY
  },
  freezeStartDate: {
    type: DataTypes.DATEONLY
  },
  freezeEndDate: {
    type: DataTypes.DATEONLY
  },
  freezeReason: {
    type: DataTypes.STRING
  },
  cancelledAt: {
    type: DataTypes.DATE
  },
  cancelReason: {
    type: DataTypes.STRING
  },

  attentionAt: {
    type: DataTypes.DATE
  },

  gracePeriodEnds: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  indexes: [

    { fields: ['userId', 'status'] }
  ]
});

module.exports = Subscription;
