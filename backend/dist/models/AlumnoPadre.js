"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const AlumnoPadre = db_1.sequelize.define('AlumnoPadre', {
    alumno_usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        }
    },
    padre_usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'alumno_padre',
    timestamps: true,
    underscored: true
});
exports.default = AlumnoPadre;
