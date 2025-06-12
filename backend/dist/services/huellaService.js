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
exports.identifyUserByTemplate = exports.getAllFingerprints = exports.getFingerprintByUser = exports.deleteFingerprint = exports.updateFingerprint = exports.enrollFingerprint = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const logService = __importStar(require("./logService"));
const enrollFingerprint = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar que el usuario existe
        const usuario = yield models_1.Usuario.findByPk(data.usuario_id);
        if (!usuario) {
            throw new AppError_1.AppError('Usuario no encontrado');
        }
        // Verificar si ya existe una huella para este usuario
        const existingHuella = yield models_1.Huella.findOne({
            where: { usuario_id: data.usuario_id }
        });
        if (existingHuella) {
            throw new AppError_1.AppError('El usuario ya tiene una huella registrada');
        }
        // Crear la huella
        const huella = yield models_1.Huella.create({
            usuario_id: data.usuario_id,
            sensor_id: data.sensor_id,
            template: data.template,
            fecha_registro: new Date()
        });
        // Log del evento
        yield logService.logUserAction(data.usuario_id, 'Huella dactilar registrada exitosamente', 'SISTEMA_BIOMETRICO');
        return huella;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error enrolling fingerprint:', error);
        throw new AppError_1.AppError('Error al registrar la huella dactilar');
    }
});
exports.enrollFingerprint = enrollFingerprint;
const updateFingerprint = (usuario_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const huella = yield models_1.Huella.findOne({
            where: { usuario_id }
        });
        if (!huella) {
            throw new AppError_1.AppError('No se encontró huella registrada para este usuario');
        }
        // Actualizar la huella
        yield huella.update({
            sensor_id: data.sensor_id,
            template: data.template,
            fecha_registro: new Date()
        });
        // Log del evento
        yield logService.logUserAction(usuario_id, 'Huella dactilar actualizada', 'SISTEMA_BIOMETRICO');
        return huella;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error updating fingerprint:', error);
        throw new AppError_1.AppError('Error al actualizar la huella dactilar');
    }
});
exports.updateFingerprint = updateFingerprint;
const deleteFingerprint = (usuario_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const huella = yield models_1.Huella.findOne({
            where: { usuario_id }
        });
        if (!huella) {
            throw new AppError_1.AppError('No se encontró huella registrada para este usuario');
        }
        yield huella.destroy();
        // Log del evento
        yield logService.logUserAction(usuario_id, 'Huella dactilar eliminada', 'SISTEMA_BIOMETRICO');
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error deleting fingerprint:', error);
        throw new AppError_1.AppError('Error al eliminar la huella dactilar');
    }
});
exports.deleteFingerprint = deleteFingerprint;
const getFingerprintByUser = (usuario_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield models_1.Huella.findOne({
            where: { usuario_id },
            include: [
                {
                    model: models_1.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'dni']
                }
            ]
        });
    }
    catch (error) {
        console.error('Error getting fingerprint:', error);
        throw new AppError_1.AppError('Error al obtener la huella dactilar');
    }
});
exports.getFingerprintByUser = getFingerprintByUser;
const getAllFingerprints = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield models_1.Huella.findAll({
            include: [
                {
                    model: models_1.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'dni', 'email']
                }
            ],
            order: [['fecha_registro', 'DESC']]
        });
    }
    catch (error) {
        console.error('Error getting all fingerprints:', error);
        throw new AppError_1.AppError('Error al obtener las huellas dactilares');
    }
});
exports.getAllFingerprints = getAllFingerprints;
// Función auxiliar para identificar usuario por template (usado por ESP32)
const identifyUserByTemplate = (template) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // En un sistema real, esto requeriría un algoritmo de comparación biométrica
        // Por ahora, hacemos una comparación directa del template
        return yield models_1.Huella.findOne({
            where: { template },
            include: [
                {
                    model: models_1.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'dni']
                }
            ]
        });
    }
    catch (error) {
        console.error('Error identifying user by template:', error);
        return null;
    }
});
exports.identifyUserByTemplate = identifyUserByTemplate;
