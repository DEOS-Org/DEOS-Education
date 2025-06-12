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
exports.authorizeRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../utils/AppError");
const userService = __importStar(require("../services/userService"));
const authenticate = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener el token del header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.AppError('No autorizado - Token no proporcionado', 401);
        }
        const token = authHeader.split(' ')[1];
        // Verificar el token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Obtener el usuario y sus roles
        const user = yield userService.findById(decoded.id);
        if (!user) {
            throw new AppError_1.AppError('No autorizado - Usuario no encontrado', 401);
        }
        const roles = yield userService.getUserRoles(user.id);
        // Agregar el usuario y sus roles al request
        req.user = {
            id: user.id,
            email: user.email,
            roles
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new AppError_1.AppError('No autorizado - Token inválido', 401));
        }
        else {
            next(error);
        }
    }
});
exports.authenticate = authenticate;
const authorizeRoles = (allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new AppError_1.AppError('No autorizado - Usuario no autenticado', 401);
        }
        const hasAllowedRole = req.user.roles.some(role => allowedRoles.includes(role));
        if (!hasAllowedRole) {
            throw new AppError_1.AppError('No autorizado - Rol no permitido', 403);
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
