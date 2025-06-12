"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const UsuarioCurso = db_1.sequelize.define('UsuarioCurso', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Principalmente alumnos'
    },
    curso_division_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'usuario_curso',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['usuario_id', 'curso_division_id']
        }
    ]
});
exports.default = UsuarioCurso;
