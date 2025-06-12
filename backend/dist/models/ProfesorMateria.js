"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const ProfesorMateria = db_1.sequelize.define('ProfesorMateria', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Usuario con rol profesor'
    },
    materia_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'profesor_materia',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['usuario_id', 'materia_id']
        }
    ]
});
exports.default = ProfesorMateria;
