"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Registro = db_1.sequelize.define('Registro', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    tipo: {
        type: sequelize_1.DataTypes.ENUM('ingreso', 'egreso'),
        allowNull: false,
        comment: 'Indica si es un ingreso o salida de la escuela'
    },
    fecha: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    dispositivo_fichaje_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Referencia al dispositivo que originó el registro'
    },
    origen_manual: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        comment: 'Para casos donde no hay dispositivo o es un registro manual'
    }
}, {
    tableName: 'registro',
    timestamps: false,
    indexes: [
        {
            fields: ['usuario_id']
        },
        {
            fields: ['fecha']
        },
        {
            fields: ['dispositivo_fichaje_id']
        }
    ]
});
exports.default = Registro;
