"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Huella = db_1.sequelize.define('Huella', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        comment: 'Un usuario solo puede tener una huella registrada'
    },
    sensor_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID (0-127) asignado por el sensor AS608. NO es único globalmente'
    },
    template: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        comment: 'Huella codificada (base64 o string binario)'
    },
    fecha_registro: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    tableName: 'huella',
    timestamps: false
});
exports.default = Huella;
