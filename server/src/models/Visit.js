const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Visit = sequelize.define('Visit', {
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
  locationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'locations', key: 'id' }
  },

  checkedInByUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  visitTime: {
    type: DataTypes.TIME,
    allowNull: false
  }
}, {
  tableName: 'visits',
  timestamps: true,
  indexes: [

    { fields: ['userId', 'visitDate'] },

    { fields: ['visitDate', 'locationId'] }
  ]
});

module.exports = Visit;
