const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {

        ssl: { require: true, rejectUnauthorized: false },
      },
      logging: false,

      pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      process.env.DB_NAME || 'apexfitness',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV !== 'production',
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      }
    );

module.exports = sequelize;
