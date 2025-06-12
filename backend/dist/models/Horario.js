"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Horario = db_1.sequelize.define('Horario', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    curso_division_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'A qué curso/división pertenece este bloque horario'
    },
    dia: {
        type: sequelize_1.DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
        allowNull: false
    },
    hora_inicio: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false
    },
    hora_fin: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false
    },
    curso_division_materia_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Qué materia específica de ese curso/división se dicta'
    },
    profesor_usuario_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Qué profesor (usuario con rol profesor) está a cargo'
    },
    aula: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        comment: 'Aula donde se dicta la clase'
    }
}, {
    tableName: 'horario',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['curso_division_id', 'dia', 'hora_inicio', 'curso_division_materia_id'],
            name: 'idx_horario_curso_dia_inicio_materia'
        },
        {
            unique: true,
            fields: ['profesor_usuario_id', 'dia', 'hora_inicio'],
            name: 'idx_horario_profesor_dia_inicio'
        }
    ]
});
exports.default = Horario;
