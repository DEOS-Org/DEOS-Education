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
exports.handleBiometricRecord = exports.createManualRecord = exports.getAllRecords = exports.getRecordsByUser = exports.determineRecordType = exports.createRecord = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const logService = __importStar(require("./logService"));
const sequelize_1 = require("sequelize");
const createRecord = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar que el usuario existe
        const usuario = yield models_1.Usuario.findByPk(data.usuario_id);
        if (!usuario) {
            throw new AppError_1.AppError('Usuario no encontrado');
        }
        // Verificar dispositivo si se proporciona
        if (data.dispositivo_fichaje_id) {
            const dispositivo = yield models_1.DispositivoFichaje.findByPk(data.dispositivo_fichaje_id);
            if (!dispositivo || !dispositivo.activo) {
                throw new AppError_1.AppError('Dispositivo no encontrado o inactivo');
            }
        }
        // Determinar el tipo de registro (ingreso/egreso)
        const tipo = yield (0, exports.determineRecordType)(data.usuario_id);
        // Crear el registro
        const registro = yield models_1.Registro.create({
            usuario_id: data.usuario_id,
            tipo,
            fecha: new Date(),
            dispositivo_fichaje_id: data.dispositivo_fichaje_id,
            origen_manual: data.origen_manual
        });
        // Log del evento
        yield logService.logUserAction(data.usuario_id, `Registro de ${tipo} creado`, data.dispositivo_fichaje_id ? 'DISPOSITIVO_BIOMETRICO' : 'REGISTRO_MANUAL');
        return registro;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error creating record:', error);
        throw new AppError_1.AppError('Error al crear el registro');
    }
});
exports.createRecord = createRecord;
const determineRecordType = (usuario_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Buscar el último registro del usuario en el día actual
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const lastRecord = yield models_1.Registro.findOne({
            where: {
                usuario_id,
                fecha: {
                    [sequelize_1.Op.gte]: startOfDay,
                    [sequelize_1.Op.lt]: endOfDay
                }
            },
            order: [['fecha', 'DESC']]
        });
        // Si no hay registro previo en el día o el último fue egreso, es un ingreso
        if (!lastRecord || lastRecord.tipo === models_1.TipoRegistro.EGRESO) {
            return models_1.TipoRegistro.INGRESO;
        }
        // Si el último fue ingreso, es un egreso
        return models_1.TipoRegistro.EGRESO;
    }
    catch (error) {
        console.error('Error determining record type:', error);
        // Por defecto, asumir ingreso
        return models_1.TipoRegistro.INGRESO;
    }
});
exports.determineRecordType = determineRecordType;
const getRecordsByUser = (usuario_id, filters) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = { usuario_id };
        if (filters === null || filters === void 0 ? void 0 : filters.tipo) {
            whereClause.tipo = filters.tipo;
        }
        if ((filters === null || filters === void 0 ? void 0 : filters.fecha_desde) || (filters === null || filters === void 0 ? void 0 : filters.fecha_hasta)) {
            whereClause.fecha = {};
            if (filters.fecha_desde) {
                whereClause.fecha[sequelize_1.Op.gte] = filters.fecha_desde;
            }
            if (filters.fecha_hasta) {
                whereClause.fecha[sequelize_1.Op.lte] = filters.fecha_hasta;
            }
        }
        return yield models_1.Registro.findAll({
            where: whereClause,
            order: [['fecha', 'DESC']],
            limit: (filters === null || filters === void 0 ? void 0 : filters.limit) || 100,
            offset: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
            include: [
                {
                    model: models_1.DispositivoFichaje,
                    attributes: ['id', 'identificador_unico', 'descripcion', 'ubicacion']
                }
            ]
        });
    }
    catch (error) {
        console.error('Error getting records by user:', error);
        throw new AppError_1.AppError('Error al obtener los registros del usuario');
    }
});
exports.getRecordsByUser = getRecordsByUser;
const getAllRecords = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = {};
        if (filters === null || filters === void 0 ? void 0 : filters.tipo) {
            whereClause.tipo = filters.tipo;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.dispositivo_id) {
            whereClause.dispositivo_fichaje_id = filters.dispositivo_id;
        }
        if ((filters === null || filters === void 0 ? void 0 : filters.fecha_desde) || (filters === null || filters === void 0 ? void 0 : filters.fecha_hasta)) {
            whereClause.fecha = {};
            if (filters.fecha_desde) {
                whereClause.fecha[sequelize_1.Op.gte] = filters.fecha_desde;
            }
            if (filters.fecha_hasta) {
                whereClause.fecha[sequelize_1.Op.lte] = filters.fecha_hasta;
            }
        }
        return yield models_1.Registro.findAll({
            where: whereClause,
            order: [['fecha', 'DESC']],
            limit: (filters === null || filters === void 0 ? void 0 : filters.limit) || 100,
            offset: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
            include: [
                {
                    model: models_1.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'dni']
                },
                {
                    model: models_1.DispositivoFichaje,
                    attributes: ['id', 'identificador_unico', 'descripcion', 'ubicacion']
                }
            ]
        });
    }
    catch (error) {
        console.error('Error getting all records:', error);
        throw new AppError_1.AppError('Error al obtener los registros');
    }
});
exports.getAllRecords = getAllRecords;
const createManualRecord = (usuario_id, tipo, fecha, origen) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar que el usuario existe
        const usuario = yield models_1.Usuario.findByPk(usuario_id);
        if (!usuario) {
            throw new AppError_1.AppError('Usuario no encontrado');
        }
        const registro = yield models_1.Registro.create({
            usuario_id,
            tipo,
            fecha,
            origen_manual: origen
        });
        // Log del evento
        yield logService.logUserAction(usuario_id, `Registro manual de ${tipo} creado para fecha ${fecha.toISOString()}`, 'REGISTRO_MANUAL');
        return registro;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error creating manual record:', error);
        throw new AppError_1.AppError('Error al crear el registro manual');
    }
});
exports.createManualRecord = createManualRecord;
// Función para manejar fichajes desde ESP32
const handleBiometricRecord = (template, dispositivo_identificador) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Importar el servicio de huellas
        const huellaService = require('./huellaService');
        // Identificar usuario por huella
        const huella = yield huellaService.identifyUserByTemplate(template);
        if (!huella) {
            yield logService.logSystemEvent(models_1.TipoLog.SEGURIDAD, `Intento de acceso con huella no registrada desde dispositivo ${dispositivo_identificador}`, 'SISTEMA_BIOMETRICO');
            return { success: false, message: 'Huella no registrada' };
        }
        // Buscar dispositivo
        const dispositivo = yield models_1.DispositivoFichaje.findOne({
            where: { identificador_unico: dispositivo_identificador }
        });
        if (!dispositivo || !dispositivo.activo) {
            yield logService.logSystemEvent(models_1.TipoLog.ERROR, `Intento de fichaje desde dispositivo desconocido o inactivo: ${dispositivo_identificador}`, 'SISTEMA_BIOMETRICO');
            return { success: false, message: 'Dispositivo no autorizado' };
        }
        // Crear registro
        const registro = yield (0, exports.createRecord)({
            usuario_id: huella.usuario_id,
            dispositivo_fichaje_id: dispositivo.id
        });
        return {
            success: true,
            message: `Registro de ${registro.tipo} exitoso`,
            usuario: {
                id: (_a = huella.Usuario) === null || _a === void 0 ? void 0 : _a.id,
                nombre: (_b = huella.Usuario) === null || _b === void 0 ? void 0 : _b.nombre,
                apellido: (_c = huella.Usuario) === null || _c === void 0 ? void 0 : _c.apellido,
                tipo_registro: registro.tipo
            }
        };
    }
    catch (error) {
        console.error('Error handling biometric record:', error);
        yield logService.logSystemEvent(models_1.TipoLog.ERROR, `Error procesando fichaje biométrico: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'SISTEMA_BIOMETRICO');
        return { success: false, message: 'Error interno del sistema' };
    }
});
exports.handleBiometricRecord = handleBiometricRecord;
