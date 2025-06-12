"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Curso = db_1.sequelize.define('Curso', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    año: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Ej: 5 (1 a 6)'
    }
}, {
    tableName: 'curso',
    timestamps: false
});
exports.default = Curso;
