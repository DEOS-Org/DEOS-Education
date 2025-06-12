"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logSystemEvent = exports.logUserAction = exports.getLogs = exports.createLog = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const createLog = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const log = yield models_1.Log.create(Object.assign(Object.assign({}, data), { fecha: new Date() }));
        return log;
    }
    catch (error) {
        console.error('Error creating log:', error);
        throw new AppError_1.AppError('Error al crear el registro de log');
    }
});
exports.createLog = createLog;
const getLogs = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = {};
        if (filters === null || filters === void 0 ? void 0 : filters.usuario_id) {
            whereClause.usuario_id = filters.usuario_id;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.tipo) {
            whereClause.tipo = filters.tipo;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.origen) {
            whereClause.origen = filters.origen;
        }
        if ((filters === null || filters === void 0 ? void 0 : filters.fecha_desde) || (filters === null || filters === void 0 ? void 0 : filters.fecha_hasta)) {
            whereClause.fecha = {};
            if (filters.fecha_desde) {
                whereClause.fecha.gte = filters.fecha_desde;
            }
            if (filters.fecha_hasta) {
                whereClause.fecha.lte = filters.fecha_hasta;
            }
        }
        return yield models_1.Log.findAll({
            where: whereClause,
            order: [['fecha', 'DESC']],
            limit: (filters === null || filters === void 0 ? void 0 : filters.limit) || 100,
            offset: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
            include: [
                {
                    model: require('../models').Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'email']
                }
            ]
        });
    }
    catch (error) {
        console.error('Error getting logs:', error);
        throw new AppError_1.AppError('Error al obtener los logs');
    }
});
exports.getLogs = getLogs;
const logUserAction = (usuario_id_1, descripcion_1, ...args_1) => __awaiter(void 0, [usuario_id_1, descripcion_1, ...args_1], void 0, function* (usuario_id, descripcion, origen = 'API', ip_origen) {
    try {
        yield (0, exports.createLog)({
            usuario_id,
            tipo: models_1.TipoLog.AUDITORIA,
            descripcion,
            origen,
            ip_origen
        });
    }
    catch (error) {
        // No re-lanzar error para evitar interrumpir la operación principal
        console.error('Error logging user action:', error);
    }
});
exports.logUserAction = logUserAction;
const logSystemEvent = (tipo_1, descripcion_1, ...args_1) => __awaiter(void 0, [tipo_1, descripcion_1, ...args_1], void 0, function* (tipo, descripcion, origen = 'SISTEMA') {
    try {
        yield (0, exports.createLog)({
            tipo,
            descripcion,
            origen
        });
    }
    catch (error) {
        console.error('Error logging system event:', error);
    }
});
exports.logSystemEvent = logSystemEvent;
const logError = (error_1, ...args_1) => __awaiter(void 0, [error_1, ...args_1], void 0, function* (error, origen = 'API', usuario_id, ip_origen) {
    try {
        yield (0, exports.createLog)({
            usuario_id,
            tipo: models_1.TipoLog.ERROR,
            descripcion: `${error.name}: ${error.message}${error.stack ? '\n' + error.stack : ''}`,
            origen,
            ip_origen
        });
    }
    catch (logError) {
        console.error('Error logging error:', logError);
    }
});
exports.logError = logError;
