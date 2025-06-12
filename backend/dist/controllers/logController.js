"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getSecurityLogs = exports.getErrorLogs = exports.getSystemLogs = exports.getLogsByUser = exports.createLog = exports.getLogs = void 0;
const logService = __importStar(require("../services/logService"));
const getLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id, tipo, origen, fecha_desde, fecha_hasta, limit, offset } = req.query;
        const filters = {};
        if (usuario_id) {
            filters.usuario_id = parseInt(usuario_id);
        }
        if (tipo) {
            filters.tipo = tipo;
        }
        if (origen) {
            filters.origen = origen;
        }
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const logs = yield logService.getLogs(filters);
        res.json(logs);
    }
    catch (error) {
        console.error('Error in getLogs:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getLogs = getLogs;
const createLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id, tipo, descripcion, origen } = req.body;
        if (!tipo || !descripcion) {
            return res.status(400).json({
                message: 'tipo y descripcion son requeridos'
            });
        }
        const log = yield logService.createLog({
            usuario_id,
            tipo,
            descripcion,
            origen,
            ip_origen: req.ip
        });
        res.status(201).json({
            message: 'Log creado exitosamente',
            log: {
                id: log.id,
                usuario_id: log.usuario_id,
                tipo: log.tipo,
                descripcion: log.descripcion,
                origen: log.origen,
                fecha: log.fecha,
                ip_origen: log.ip_origen
            }
        });
    }
    catch (error) {
        console.error('Error in createLog:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.createLog = createLog;
const getLogsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id } = req.params;
        const { tipo, fecha_desde, fecha_hasta, limit, offset } = req.query;
        const filters = {
            usuario_id: parseInt(usuario_id)
        };
        if (tipo) {
            filters.tipo = tipo;
        }
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const logs = yield logService.getLogs(filters);
        res.json(logs);
    }
    catch (error) {
        console.error('Error in getLogsByUser:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getLogsByUser = getLogsByUser;
const getSystemLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tipo, origen, fecha_desde, fecha_hasta, limit, offset } = req.query;
        const filters = {
            usuario_id: null // Solo logs del sistema
        };
        if (tipo) {
            filters.tipo = tipo;
        }
        if (origen) {
            filters.origen = origen;
        }
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const logs = yield logService.getLogs(filters);
        res.json(logs);
    }
    catch (error) {
        console.error('Error in getSystemLogs:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getSystemLogs = getSystemLogs;
const getErrorLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_desde, fecha_hasta, limit, offset } = req.query;
        const filters = {
            tipo: 'error'
        };
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const logs = yield logService.getLogs(filters);
        res.json(logs);
    }
    catch (error) {
        console.error('Error in getErrorLogs:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getErrorLogs = getErrorLogs;
const getSecurityLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_desde, fecha_hasta, limit, offset } = req.query;
        const filters = {
            tipo: 'seguridad'
        };
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const logs = yield logService.getLogs(filters);
        res.json(logs);
    }
    catch (error) {
        console.error('Error in getSecurityLogs:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getSecurityLogs = getSecurityLogs;
