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
exports.handleBiometricRecord = exports.createManualRecord = exports.getAllRecords = exports.getRecordsByUser = exports.createRecord = exports.getAllFingerprints = exports.getFingerprintByUser = exports.deleteFingerprint = exports.updateFingerprint = exports.enrollFingerprint = void 0;
const huellaService = __importStar(require("../services/huellaService"));
const registroService = __importStar(require("../services/registroService"));
// Controladores para gestión de huellas
const enrollFingerprint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id, sensor_id, template } = req.body;
        if (!usuario_id || !template) {
            return res.status(400).json({
                message: 'usuario_id y template son requeridos'
            });
        }
        const huella = yield huellaService.enrollFingerprint({
            usuario_id,
            sensor_id,
            template
        });
        res.status(201).json({
            message: 'Huella registrada exitosamente',
            huella: {
                id: huella.id,
                usuario_id: huella.usuario_id,
                sensor_id: huella.sensor_id,
                fecha_registro: huella.fecha_registro
            }
        });
    }
    catch (error) {
        console.error('Error in enrollFingerprint:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.enrollFingerprint = enrollFingerprint;
const updateFingerprint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id } = req.params;
        const { sensor_id, template } = req.body;
        if (!template) {
            return res.status(400).json({
                message: 'template es requerido'
            });
        }
        const huella = yield huellaService.updateFingerprint(parseInt(usuario_id), { sensor_id, template });
        res.json({
            message: 'Huella actualizada exitosamente',
            huella: {
                id: huella.id,
                usuario_id: huella.usuario_id,
                sensor_id: huella.sensor_id,
                fecha_registro: huella.fecha_registro
            }
        });
    }
    catch (error) {
        console.error('Error in updateFingerprint:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.updateFingerprint = updateFingerprint;
const deleteFingerprint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id } = req.params;
        yield huellaService.deleteFingerprint(parseInt(usuario_id));
        res.json({ message: 'Huella eliminada exitosamente' });
    }
    catch (error) {
        console.error('Error in deleteFingerprint:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.deleteFingerprint = deleteFingerprint;
const getFingerprintByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id } = req.params;
        const huella = yield huellaService.getFingerprintByUser(parseInt(usuario_id));
        if (!huella) {
            return res.status(404).json({
                message: 'No se encontró huella registrada para este usuario'
            });
        }
        res.json({
            id: huella.id,
            usuario_id: huella.usuario_id,
            sensor_id: huella.sensor_id,
            fecha_registro: huella.fecha_registro,
            usuario: huella.Usuario
        });
    }
    catch (error) {
        console.error('Error in getFingerprintByUser:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getFingerprintByUser = getFingerprintByUser;
const getAllFingerprints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const huellas = yield huellaService.getAllFingerprints();
        res.json(huellas.map(huella => ({
            id: huella.id,
            usuario_id: huella.usuario_id,
            sensor_id: huella.sensor_id,
            fecha_registro: huella.fecha_registro,
            usuario: huella.Usuario
        })));
    }
    catch (error) {
        console.error('Error in getAllFingerprints:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getAllFingerprints = getAllFingerprints;
// Controladores para registros de fichaje
const createRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id, dispositivo_fichaje_id, origen_manual } = req.body;
        if (!usuario_id) {
            return res.status(400).json({
                message: 'usuario_id es requerido'
            });
        }
        const registro = yield registroService.createRecord({
            usuario_id,
            dispositivo_fichaje_id,
            origen_manual
        });
        res.status(201).json({
            message: 'Registro creado exitosamente',
            registro: {
                id: registro.id,
                usuario_id: registro.usuario_id,
                tipo: registro.tipo,
                fecha: registro.fecha,
                dispositivo_fichaje_id: registro.dispositivo_fichaje_id,
                origen_manual: registro.origen_manual
            }
        });
    }
    catch (error) {
        console.error('Error in createRecord:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.createRecord = createRecord;
const getRecordsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id } = req.params;
        const { fecha_desde, fecha_hasta, tipo, limit, offset } = req.query;
        const filters = {};
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (tipo) {
            filters.tipo = tipo;
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const registros = yield registroService.getRecordsByUser(parseInt(usuario_id), filters);
        res.json(registros);
    }
    catch (error) {
        console.error('Error in getRecordsByUser:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getRecordsByUser = getRecordsByUser;
const getAllRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_desde, fecha_hasta, tipo, dispositivo_id, limit, offset } = req.query;
        const filters = {};
        if (fecha_desde) {
            filters.fecha_desde = new Date(fecha_desde);
        }
        if (fecha_hasta) {
            filters.fecha_hasta = new Date(fecha_hasta);
        }
        if (tipo) {
            filters.tipo = tipo;
        }
        if (dispositivo_id) {
            filters.dispositivo_id = parseInt(dispositivo_id);
        }
        if (limit) {
            filters.limit = parseInt(limit);
        }
        if (offset) {
            filters.offset = parseInt(offset);
        }
        const registros = yield registroService.getAllRecords(filters);
        res.json(registros);
    }
    catch (error) {
        console.error('Error in getAllRecords:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getAllRecords = getAllRecords;
const createManualRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario_id, tipo, fecha, origen } = req.body;
        if (!usuario_id || !tipo || !fecha || !origen) {
            return res.status(400).json({
                message: 'usuario_id, tipo, fecha y origen son requeridos'
            });
        }
        const registro = yield registroService.createManualRecord(usuario_id, tipo, new Date(fecha), origen);
        res.status(201).json({
            message: 'Registro manual creado exitosamente',
            registro
        });
    }
    catch (error) {
        console.error('Error in createManualRecord:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.createManualRecord = createManualRecord;
// Endpoint para ESP32
const handleBiometricRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { template, dispositivo_id } = req.body;
        if (!template || !dispositivo_id) {
            return res.status(400).json({
                success: false,
                message: 'template y dispositivo_id son requeridos'
            });
        }
        const result = yield registroService.handleBiometricRecord(template, dispositivo_id);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(401).json(result);
        }
    }
    catch (error) {
        console.error('Error in handleBiometricRecord:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
exports.handleBiometricRecord = handleBiometricRecord;
