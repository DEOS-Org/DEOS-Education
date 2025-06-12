"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Log = db_1.sequelize.define('Log', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Usuario que originó la acción o fue afectado. Puede ser NULL para eventos del sistema'
    },
    tipo: {
        type: sequelize_1.DataTypes.ENUM('error', 'configuracion', 'seguridad', 'conexion', 'autenticacion', 'auditoria', 'otro'),
        allowNull: false
    },
    descripcion: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        comment: 'Descripción detallada del evento'
    },
    origen: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ej: API_USUARIOS, ESP32_AULA4, PANEL_ADMIN, SISTEMA'
    },
    fecha: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    ip_origen: {
        type: sequelize_1.DataTypes.STRING(45),
        allowNull: true
    }
}, {
    tableName: 'log',
    timestamps: false,
    indexes: [
        {
            fields: ['usuario_id']
        },
        {
            fields: ['tipo']
        },
        {
            fields: ['fecha']
        }
    ]
});
exports.default = Log;
