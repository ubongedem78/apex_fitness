const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
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
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  notifiedAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('waiting', 'notified', 'converted', 'expired'),
    defaultValue: 'waiting'
  }
}, {
  tableName: 'waitlists',
  timestamps: true
});

module.exports = Waitlist;
