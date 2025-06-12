"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const DispositivoFichaje = db_1.sequelize.define('DispositivoFichaje', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    identificador_unico: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Ej: ESP32_PUERTA_PRINCIPAL'
    },
    descripcion: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    ubicacion: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true
    },
    activo: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'dispositivo_fichaje',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
exports.default = DispositivoFichaje;
