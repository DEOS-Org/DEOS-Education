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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanExpiredTokens = exports.changePassword = exports.resetPassword = exports.validateResetToken = exports.generateResetToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const userService = __importStar(require("./userService"));
const logService = __importStar(require("./logService"));
const AppError_1 = require("../utils/AppError");
// En un entorno real, estos tokens se guardarían en Redis o en una tabla de base de datos
// Por simplicidad, los mantenemos en memoria (se perderán al reiniciar el servidor)
const resetTokens = new Map();
const generateResetToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar que el usuario existe
        const usuario = yield userService.findByEmail(email);
        if (!usuario) {
            throw new AppError_1.AppError('Usuario no encontrado');
        }
        // Generar token único
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        // Guardar token
        resetTokens.set(token, { email, expires });
        // Log del evento
        yield logService.logUserAction(usuario.id, 'Token de recuperación de contraseña generado', 'PASSWORD_RESET');
        return token;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error generating reset token:', error);
        throw new AppError_1.AppError('Error al generar el token de recuperación');
    }
});
exports.generateResetToken = generateResetToken;
const validateResetToken = (token) => {
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
        return false;
    }
    if (new Date() > tokenData.expires) {
        resetTokens.delete(token);
        return false;
    }
    return true;
};
exports.validateResetToken = validateResetToken;
const resetPassword = (token, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = resetTokens.get(token);
        if (!tokenData) {
            throw new AppError_1.AppError('Token de recuperación inválido o expirado');
        }
        if (new Date() > tokenData.expires) {
            resetTokens.delete(token);
            throw new AppError_1.AppError('Token de recuperación expirado');
        }
        // Buscar usuario
        const usuario = yield userService.findByEmail(tokenData.email);
        if (!usuario) {
            throw new AppError_1.AppError('Usuario no encontrado');
        }
        // Actualizar contraseña
        yield userService.updateUser(usuario.id, { contraseña: newPassword });
        // Eliminar token usado
        resetTokens.delete(token);
        // Log del evento
        yield logService.logUserAction(usuario.id, 'Contraseña actualizada mediante token de recuperación', 'PASSWORD_RESET');
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error resetting password:', error);
        throw new AppError_1.AppError('Error al restablecer la contraseña');
    }
});
exports.resetPassword = resetPassword;
const changePassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar usuario
        const usuario = yield userService.findByEmail('temp'); // Necesitamos una función para buscar por ID
        // Como no tenemos findById que incluya la contraseña, usamos findByEmail
        const usuarioCompleto = yield require('../models').Usuario.findByPk(userId, {
            attributes: { include: ['contraseña'] }
        });
        if (!usuarioCompleto) {
            throw new AppError_1.AppError('Usuario no encontrado');
        }
        // Verificar contraseña actual
        const isCurrentPasswordValid = yield userService.verifyPassword(currentPassword, usuarioCompleto.contraseña);
        if (!isCurrentPasswordValid) {
            throw new AppError_1.AppError('La contraseña actual es incorrecta');
        }
        // Actualizar contraseña
        yield userService.updateUser(userId, { contraseña: newPassword });
        // Log del evento
        yield logService.logUserAction(userId, 'Contraseña cambiada por el usuario', 'PASSWORD_CHANGE');
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error changing password:', error);
        throw new AppError_1.AppError('Error al cambiar la contraseña');
    }
});
exports.changePassword = changePassword;
// Función para limpiar tokens expirados (ejecutar periódicamente)
const cleanExpiredTokens = () => {
    const now = new Date();
    for (const [token, data] of resetTokens.entries()) {
        if (now > data.expires) {
            resetTokens.delete(token);
        }
    }
};
exports.cleanExpiredTokens = cleanExpiredTokens;
// Ejecutar limpieza cada hora
setInterval(exports.cleanExpiredTokens, 60 * 60 * 1000);
