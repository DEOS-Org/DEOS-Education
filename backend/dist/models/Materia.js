"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Materia = db_1.sequelize.define('Materia', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    carga_horaria: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Horas semanales estimadas. Para referencia o validación.'
    },
    carga_horaria_minutos: {
        type: sequelize_1.DataTypes.VIRTUAL,
        get() {
            const cargaHoraria = this.getDataValue('carga_horaria');
            return cargaHoraria ? cargaHoraria * 40 : null;
        }
    }
}, {
    tableName: 'materia',
    timestamps: false
});
exports.default = Materia;
