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
exports.removeRoleFromUser = exports.assignRoleToUser = exports.getUsersByRole = exports.getPermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const sequelize_1 = require("sequelize");
const getRoles = () => __awaiter(void 0, void 0, void 0, function* () {
    const roles = yield models_1.Rol.findAll({
        order: [['nombre', 'ASC']]
    });
    return roles.map(rol => ({
        id: rol.id,
        nombre: rol.nombre,
        descripcion: `Rol de ${rol.nombre}`,
        permisos: getDefaultPermissions(rol.nombre),
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
});
exports.getRoles = getRoles;
const getRoleById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const rol = yield models_1.Rol.findByPk(id);
    if (!rol) {
        throw new AppError_1.AppError('Rol no encontrado', 404);
    }
    return {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: `Rol de ${rol.nombre}`,
        permisos: getDefaultPermissions(rol.nombre),
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.getRoleById = getRoleById;
const createRole = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if role exists
    const existingRole = yield models_1.Rol.findOne({
        where: { nombre: data.nombre }
    });
    if (existingRole) {
        throw new AppError_1.AppError('Ya existe un rol con ese nombre', 400);
    }
    const rol = yield models_1.Rol.create({
        nombre: data.nombre
    });
    return {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: data.descripcion || `Rol de ${rol.nombre}`,
        permisos: data.permisos,
        activo: data.activo,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.createRole = createRole;
const updateRole = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const rol = yield models_1.Rol.findByPk(id);
    if (!rol) {
        throw new AppError_1.AppError('Rol no encontrado', 404);
    }
    // Check if another role with this name exists
    const existingRole = yield models_1.Rol.findOne({
        where: {
            nombre: data.nombre,
            id: { [sequelize_1.Op.ne]: id }
        }
    });
    if (existingRole) {
        throw new AppError_1.AppError('Ya existe un rol con ese nombre', 400);
    }
    yield rol.update({
        nombre: data.nombre
    });
    return {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: data.descripcion || `Rol de ${rol.nombre}`,
        permisos: data.permisos,
        activo: data.activo,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.updateRole = updateRole;
const deleteRole = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const rol = yield models_1.Rol.findByPk(id);
    if (!rol) {
        throw new AppError_1.AppError('Rol no encontrado', 404);
    }
    // Check if users are assigned to this role
    const usuariosConRol = yield models_1.Usuario.findAll({
        include: [
            {
                model: models_1.Rol,
                where: { id },
                through: { attributes: [] }
            }
        ]
    });
    if (usuariosConRol.length > 0) {
        throw new AppError_1.AppError('No se puede eliminar un rol que tiene usuarios asignados', 400);
    }
    yield rol.destroy();
    return { message: 'Rol eliminado correctamente' };
});
exports.deleteRole = deleteRole;
const getPermissions = () => {
    return [
        { id: 'users_read', name: 'Ver usuarios', category: 'Usuarios' },
        { id: 'users_write', name: 'Crear/editar usuarios', category: 'Usuarios' },
        { id: 'users_delete', name: 'Eliminar usuarios', category: 'Usuarios' },
        { id: 'roles_read', name: 'Ver roles', category: 'Roles' },
        { id: 'roles_write', name: 'Crear/editar roles', category: 'Roles' },
        { id: 'roles_delete', name: 'Eliminar roles', category: 'Roles' },
        { id: 'devices_read', name: 'Ver dispositivos', category: 'Dispositivos' },
        { id: 'devices_write', name: 'Crear/editar dispositivos', category: 'Dispositivos' },
        { id: 'devices_delete', name: 'Eliminar dispositivos', category: 'Dispositivos' },
        { id: 'academic_read', name: 'Ver gestión académica', category: 'Académico' },
        { id: 'academic_write', name: 'Crear/editar académico', category: 'Académico' },
        { id: 'academic_delete', name: 'Eliminar académico', category: 'Académico' },
        { id: 'biometric_read', name: 'Ver biométrico', category: 'Biométrico' },
        { id: 'biometric_write', name: 'Crear/editar biométrico', category: 'Biométrico' },
        { id: 'biometric_delete', name: 'Eliminar biométrico', category: 'Biométrico' },
        { id: 'reports_read', name: 'Ver reportes', category: 'Reportes' },
        { id: 'reports_generate', name: 'Generar reportes', category: 'Reportes' },
        { id: 'settings_read', name: 'Ver configuración', category: 'Configuración' },
        { id: 'settings_write', name: 'Modificar configuración', category: 'Configuración' }
    ];
};
exports.getPermissions = getPermissions;
const getUsersByRole = (roleName) => __awaiter(void 0, void 0, void 0, function* () {
    const usuarios = yield models_1.Usuario.findAll({
        include: [
            {
                model: models_1.Rol,
                where: { nombre: roleName },
                through: { attributes: [] }
            }
        ],
        order: [['nombre', 'ASC']]
    });
    return usuarios.map(usuario => ({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        dni: usuario.dni,
        activo: usuario.activo,
        createdAt: usuario.created_at || new Date(),
        updatedAt: usuario.updated_at || new Date()
    }));
});
exports.getUsersByRole = getUsersByRole;
const assignRoleToUser = (userId, roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = yield models_1.Usuario.findByPk(userId);
    const rol = yield models_1.Rol.findByPk(roleId);
    if (!usuario) {
        throw new AppError_1.AppError('Usuario no encontrado', 404);
    }
    if (!rol) {
        throw new AppError_1.AppError('Rol no encontrado', 404);
    }
    // TODO: Implement role assignment via UsuarioRol table
    return { message: 'Rol asignado correctamente' };
});
exports.assignRoleToUser = assignRoleToUser;
const removeRoleFromUser = (userId, roleId) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = yield models_1.Usuario.findByPk(userId);
    const rol = yield models_1.Rol.findByPk(roleId);
    if (!usuario) {
        throw new AppError_1.AppError('Usuario no encontrado', 404);
    }
    if (!rol) {
        throw new AppError_1.AppError('Rol no encontrado', 404);
    }
    // TODO: Implement role removal via UsuarioRol table
    return { message: 'Rol removido correctamente' };
});
exports.removeRoleFromUser = removeRoleFromUser;
// Helper function to get default permissions for a role
function getDefaultPermissions(roleName) {
    switch (roleName.toLowerCase()) {
        case 'admin':
            return [
                'users_read', 'users_write', 'users_delete',
                'roles_read', 'roles_write', 'roles_delete',
                'devices_read', 'devices_write', 'devices_delete',
                'academic_read', 'academic_write', 'academic_delete',
                'biometric_read', 'biometric_write', 'biometric_delete',
                'reports_read', 'reports_generate',
                'settings_read', 'settings_write'
            ];
        case 'profesor':
            return [
                'academic_read',
                'biometric_read',
                'reports_read'
            ];
        case 'preceptor':
            return [
                'users_read',
                'academic_read',
                'biometric_read', 'biometric_write',
                'reports_read', 'reports_generate'
            ];
        case 'alumno':
            return [
                'biometric_read'
            ];
        case 'padre':
            return [
                'reports_read'
            ];
        default:
            return [];
    }
}
