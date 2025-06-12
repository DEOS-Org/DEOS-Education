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
exports.changePassword = exports.resetPassword = exports.requestPasswordReset = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userService = __importStar(require("../services/userService"));
const passwordResetService = __importStar(require("../services/passwordResetService"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { dni, nombre, apellido, email, contraseña, roles } = req.body;
        // Verificar si el usuario ya existe
        const existingUser = yield userService.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        // Crear el usuario
        const usuario = yield userService.createUser({
            dni,
            nombre,
            apellido,
            email,
            contraseña,
            roles
        });
        // Obtener roles del usuario
        const userRoles = roles || [];
        // Generar token
        const token = jsonwebtoken_1.default.sign({
            id: usuario.id,
            email: usuario.email,
            roles: userRoles,
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(201).json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                roles: userRoles,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, contraseña } = req.body;
    try {
        console.log('Login attempt for email:', email);
        const usuario = (yield userService.findByEmail(email));
        if (!usuario) {
            console.log('User not found');
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
        console.log('User found:', usuario.get());
        const passwordMatch = yield userService.verifyPassword(contraseña, usuario.contraseña);
        console.log('Password match:', passwordMatch);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
        const roles = yield userService.getUserRoles(usuario.id);
        const token = jsonwebtoken_1.default.sign({
            id: usuario.id,
            email: usuario.email,
            roles,
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                roles,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al procesar el login' });
    }
});
exports.login = login;
const requestPasswordReset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email es requerido' });
        }
        const token = yield passwordResetService.generateResetToken(email);
        // En un entorno real, aquí enviarías un email con el token
        // Por ahora, devolvemos el token en la respuesta (solo para testing)
        res.json({
            message: 'Token de recuperación generado',
            token, // Solo para desarrollo - en producción esto se enviaría por email
            instructions: 'Use este token en el endpoint /auth/reset-password'
        });
    }
    catch (error) {
        console.error('Password reset request error:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error al procesar la solicitud'
        });
    }
});
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({
                message: 'Token y nueva contraseña son requeridos'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        yield passwordResetService.resetPassword(token, newPassword);
        res.json({ message: 'Contraseña restablecida exitosamente' });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error al restablecer la contraseña'
        });
    }
});
exports.resetPassword = resetPassword;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        yield passwordResetService.changePassword(userId, currentPassword, newPassword);
        res.json({ message: 'Contraseña cambiada exitosamente' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error al cambiar la contraseña'
        });
    }
});
exports.changePassword = changePassword;
