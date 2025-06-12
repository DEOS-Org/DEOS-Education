"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const CursoDivisionMateria = db_1.sequelize.define('CursoDivisionMateria', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    curso_division_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    materia_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'curso_division_materia',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['curso_division_id', 'materia_id']
        }
    ]
});
exports.default = CursoDivisionMateria;
