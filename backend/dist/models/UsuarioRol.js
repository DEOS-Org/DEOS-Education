"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const UsuarioRol = db_1.sequelize.define('UsuarioRol', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuario',
            key: 'id'
        }
    },
    rol_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rol',
            key: 'id'
        }
    }
}, {
    tableName: 'usuario_rol',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['usuario_id', 'rol_id'],
            name: 'idx_usuario_rol_unique'
        }
    ]
});
exports.default = UsuarioRol;
