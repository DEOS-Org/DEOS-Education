"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.sequelize = new sequelize_1.Sequelize({
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
