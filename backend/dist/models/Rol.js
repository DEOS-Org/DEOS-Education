"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Rol = db_1.sequelize.define('Rol', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'rol',
    timestamps: false
});
exports.default = Rol;
