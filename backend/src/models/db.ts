import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'db',
  port: 3306,
  username: 'biofirma',
  password: 'biofirma',
  database: 'biometrico',
  logging: false,
  retry: {
    max: 10,
    match: [/Deadlock/i, /SequelizeConnectionError/],
    backoffBase: 1000,
    backoffExponent: 1.5,
  }
}); 