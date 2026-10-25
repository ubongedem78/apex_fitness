const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const { signAvatarUrl } = require('../utils/r2');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    set(value) {
      this.setDataValue('email', typeof value === 'string' ? value.trim().toLowerCase() : value);
    }
  },
  phone: {
    type: DataTypes.STRING,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('member', 'trainer', 'staff', 'manager', 'admin', 'receptionist'),
    defaultValue: 'member'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING
  },
  passwordResetToken: {
    type: DataTypes.STRING
  },
  passwordResetExpiry: {
    type: DataTypes.DATE
  },

  tokenVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFactorSecret: {
    type: DataTypes.STRING
  },
  avatarUrl: {
    type: DataTypes.STRING
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say')
  },
  emergencyContactName: {
    type: DataTypes.STRING
  },
  emergencyContactPhone: {
    type: DataTypes.STRING
  },

  memberNumber: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: true
  },

  ptRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  termsAcceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  paystackAuthorizationCode: {
    type: DataTypes.STRING
  },
  cardLast4: {
    type: DataTypes.STRING(4)
  },
  cardType: {
    type: DataTypes.STRING
  },
  cardBank: {
    type: DataTypes.STRING
  },
  cardExpMonth: {
    type: DataTypes.STRING(2)
  },
  cardExpYear: {
    type: DataTypes.STRING(4)
  },
  paystackCustomerCode: {
    type: DataTypes.STRING
  },

  locationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.passwordHash) {
        const salt = await bcrypt.genSalt(12);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('passwordHash')) {
        const salt = await bcrypt.genSalt(12);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
      }
    },
  }
});

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.passwordHash;
  delete values.twoFactorSecret;
  delete values.emailVerificationToken;
  delete values.passwordResetToken;
  delete values.paystackAuthorizationCode;
  delete values.tokenVersion;

  if (values.memberNumber != null) {
    values.displayMemberNumber = String(100000 + values.memberNumber);
  }

  if (values.avatarUrl) {
    values.avatarUrl = signAvatarUrl(values.avatarUrl);
  }
  return values;
};

module.exports = User;
