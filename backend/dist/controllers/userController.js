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
exports.getParentStudents = exports.getStudentParents = exports.removeParent = exports.assignParent = exports.getUserRoles = exports.removeRole = exports.assignRole = exports.deleteUser = exports.assignRoles = exports.deactivateUser = exports.activateUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const userService = __importStar(require("../services/userService"));
const asyncHandler_1 = require("../middleware/asyncHandler");
const AppError_1 = require("../utils/AppError");
// Crear usuario
exports.createUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dni, nombre, apellido, email, contraseña, roles } = req.body;
    if (!dni || !nombre || !apellido || !email || !contraseña) {
        throw new AppError_1.AppError('Faltan campos requeridos', 400);
    }
    const usuario = yield userService.createUser({
        dni,
        nombre,
        apellido,
        email,
        contraseña,
        roles
    });
    res.status(201).json(usuario);
}));
// Listar usuarios
exports.getUsers = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield userService.findAll();
    res.json({ data: users });
}));
// Ver detalle de usuario
exports.getUserById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const usuario = yield userService.findById(Number(id));
    if (!usuario) {
        throw new AppError_1.AppError('Usuario no encontrado', 404);
    }
    res.json(usuario);
}));
// Editar usuario
exports.updateUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, apellido, email, contraseña, activo } = req.body;
    const usuario = yield userService.updateUser(Number(id), {
        nombre,
        apellido,
        email,
        contraseña,
        activo
    });
    res.json(usuario);
}));
// Activar/Desactivar usuario
exports.activateUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const usuario = yield userService.updateUser(Number(id), { activo: true });
    res.json({ message: 'Usuario activado correctamente', usuario });
}));
exports.deactivateUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const usuario = yield userService.updateUser(Number(id), { activo: false });
    res.json({ message: 'Usuario desactivado correctamente', usuario });
}));
// Asignar roles a usuario
exports.assignRoles = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { roles } = req.body;
    if (!Array.isArray(roles)) {
        throw new AppError_1.AppError('Roles inválidos', 400);
    }
    for (const rol of roles) {
        yield userService.assignRole(Number(id), rol);
    }
    const usuario = yield userService.findById(Number(id));
    res.json(usuario);
}));
exports.deleteUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield userService.deleteUser(Number(id));
    res.json(result);
}));
// Roles
exports.assignRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { rol } = req.body;
    if (!rol) {
        throw new AppError_1.AppError('El rol es requerido', 400);
    }
    const result = yield userService.assignRole(Number(id), rol);
    res.json(result);
}));
exports.removeRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { rol } = req.body;
    if (!rol) {
        throw new AppError_1.AppError('El rol es requerido', 400);
    }
    const result = yield userService.removeRole(Number(id), rol);
    res.json(result);
}));
exports.getUserRoles = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const roles = yield userService.getUserRoles(Number(id));
    res.json(roles);
}));
// Relación Alumno-Padre
exports.assignParent = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { alumnoId } = req.params;
    const { padreId } = req.body;
    if (!padreId) {
        throw new AppError_1.AppError('El ID del padre es requerido', 400);
    }
    const result = yield userService.assignParent(Number(alumnoId), Number(padreId));
    res.json(result);
}));
exports.removeParent = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { alumnoId, padreId } = req.params;
    const result = yield userService.removeParent(Number(alumnoId), Number(padreId));
    res.json(result);
}));
exports.getStudentParents = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { alumnoId } = req.params;
    const padres = yield userService.getStudentParents(Number(alumnoId));
    res.json(padres);
}));
exports.getParentStudents = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { padreId } = req.params;
    const alumnos = yield userService.getParentStudents(Number(padreId));
    res.json(alumnos);
}));
