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
exports.removePermissionFromRole = exports.assignPermissionToRole = exports.getUsersWithRole = exports.getAvailablePermissions = exports.deleteRole = exports.updateRole = exports.getRoleById = exports.getRoles = exports.createRole = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
const AppError_1 = require("../utils/AppError");
const roleService = __importStar(require("../services/roleService"));
exports.createRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, descripcion, permisos } = req.body;
    if (!nombre) {
        throw new AppError_1.AppError('El nombre del rol es requerido', 400);
    }
    const rol = yield roleService.createRole({
        nombre,
        descripcion,
        permisos: permisos || [],
        activo: true
    });
    res.status(201).json(rol);
}));
exports.getRoles = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roles = yield roleService.getRoles();
    res.json({ data: roles });
}));
exports.getRoleById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const rol = yield roleService.getRoleById(Number(id));
    if (!rol) {
        throw new AppError_1.AppError('Rol no encontrado', 404);
    }
    res.json(rol);
}));
exports.updateRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, descripcion, permisos, activo } = req.body;
    const rol = yield roleService.updateRole(Number(id), {
        nombre,
        descripcion,
        permisos,
        activo
    });
    res.json(rol);
}));
exports.deleteRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield roleService.deleteRole(Number(id));
    res.json(result);
}));
exports.getAvailablePermissions = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const permissions = roleService.getPermissions();
    res.json(permissions);
}));
exports.getUsersWithRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const users = yield roleService.getUsersByRole('admin'); // Simplified for now
    res.json(users);
}));
exports.assignPermissionToRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { permission } = req.body;
    if (!permission) {
        throw new AppError_1.AppError('El permiso es requerido', 400);
    }
    // TODO: Implement permission assignment
    res.json({ message: 'Permiso asignado correctamente' });
}));
exports.removePermissionFromRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, permission } = req.params;
    // TODO: Implement permission removal
    res.json({ message: 'Permiso removido correctamente' });
}));
