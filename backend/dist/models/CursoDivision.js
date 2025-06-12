"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const CursoDivision = db_1.sequelize.define('CursoDivision', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    curso_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    division_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    nombre_legible: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ej: 5to Informática. Generado/gestionado por el backend.'
    }
}, {
    tableName: 'curso_division',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['curso_id', 'division_id']
        }
    ]
});
exports.default = CursoDivision;
