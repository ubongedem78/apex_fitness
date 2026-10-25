const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'classes', key: 'id' }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('booked', 'cancelled', 'attended', 'no_show'),
    defaultValue: 'booked'
  },
  bookedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cancelledAt: {
    type: DataTypes.DATE
  },
  cancellationReason: {
    type: DataTypes.TEXT
  },
  attendedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  indexes: [

    { fields: ['classId', 'status'] },
    { fields: ['userId'] }
  ]
});

module.exports = Booking;
