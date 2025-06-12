"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
const Division = db_1.sequelize.define('Division', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    division: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        comment: 'Ej: A, B, Informática, Electrónica'
    }
}, {
    tableName: 'division',
    timestamps: false
});
exports.default = Division;
