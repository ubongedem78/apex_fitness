const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subscriptions', key: 'id' }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  joiningFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'NGN'
  },
  type: {
    type: DataTypes.ENUM('subscription', 'class_pack', 'one_time', 'locker', 'pt_session'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paystackReference: {
    type: DataTypes.STRING,
    unique: true
  },
  paystackTransactionId: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSON
  },
  description: {
    type: DataTypes.STRING
  },
  refundedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refundedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;
