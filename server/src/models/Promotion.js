const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  minimumAmount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  validFrom: {
    type: DataTypes.DATE
  },
  validTo: {
    type: DataTypes.DATE
  },
  usageLimit: {
    type: DataTypes.INTEGER
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  applicablePlans: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'promotions',
  timestamps: true
});

module.exports = Promotion;
