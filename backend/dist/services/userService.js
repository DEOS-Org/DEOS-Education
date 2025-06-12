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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentStudents = exports.getStudentParents = exports.removeParent = exports.assignParent = exports.removeRole = exports.assignRole = exports.getUserRoles = exports.deleteUser = exports.updateUser = exports.createUser = exports.findById = exports.findByEmail = exports.findAll = exports.verifyPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const SALT_ROUNDS = 12;
// Funciones auxiliares
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
});
const verifyPassword = (plainPassword, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Plain password:', plainPassword);
    console.log('Hashed password:', hashedPassword);
    return bcryptjs_1.default.compare(plainPassword, hashedPassword);
});
exports.verifyPassword = verifyPassword;
// Funciones principales
const findAll = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.Usuario.findAll({
        where: { activo: true },
        attributes: { exclude: ['contraseña'] },
        include: [{ model: models_1.Rol }]
    });
});
exports.findAll = findAll;
const findByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.Usuario.findOne({
        where: { email, activo: true },
        attributes: { include: ['contraseña'] }
    });
});
exports.findByEmail = findByEmail;
const findById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.Usuario.findOne({
        where: { id, activo: true },
        attributes: { exclude: ['contraseña'] },
        include: [{ model: models_1.Rol }]
    });
});
exports.findById = findById;
const createUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ dni, nombre, apellido, email, contraseña, roles }) {
    // Validar unicidad de email y dni
    const [existeEmail, existeDni] = yield Promise.all([
        models_1.Usuario.findOne({ where: { email, activo: true } }),
        models_1.Usuario.findOne({ where: { dni, activo: true } })
    ]);
    if (existeEmail)
        throw new AppError_1.AppError('El email ya está registrado');
    if (existeDni)
        throw new AppError_1.AppError('El DNI ya está registrado');
    // Hashear contraseña
    const hash = yield hashPassword(contraseña);
    // Crear usuario
    const usuario = yield models_1.Usuario.create({
        dni,
        nombre,
        apellido,
        email,
        contraseña: hash,
        activo: true
    });
    // Asignar roles
    if (roles && Array.isArray(roles)) {
        const rolesEncontrados = yield models_1.Rol.findAll({
            where: { nombre: { [sequelize_1.Op.in]: roles } }
        });
        // Validar que no se asigne rol de alumno junto con otros roles
        if (roles.includes('alumno') && roles.length > 1) {
            throw new AppError_1.AppError('Un alumno no puede tener roles adicionales');
        }
        yield Promise.all(rolesEncontrados.map(rol => models_1.UsuarioRol.create({ usuario_id: usuario.id, rol_id: rol.id })));
    }
    // Retornar usuario sin contraseña
    const _b = usuario.get(), { contraseña: _ } = _b, usuarioSinContraseña = __rest(_b, ["contrase\u00F1a"]);
    return usuarioSinContraseña;
});
exports.createUser = createUser;
const updateUser = (id_1, _a) => __awaiter(void 0, [id_1, _a], void 0, function* (id, { nombre, apellido, email, contraseña, activo }) {
    const usuario = yield models_1.Usuario.findByPk(id);
    if (!usuario)
        throw new AppError_1.AppError('Usuario no encontrado');
    // Si se actualiza el email, verificar que no exista
    if (email && email !== usuario.email) {
        const existeEmail = yield models_1.Usuario.findOne({
            where: { email, activo: true, id: { [sequelize_1.Op.ne]: id } }
        });
        if (existeEmail)
            throw new AppError_1.AppError('El email ya está registrado');
    }
    // Actualizar campos
    if (nombre)
        usuario.nombre = nombre;
    if (apellido)
        usuario.apellido = apellido;
    if (email)
        usuario.email = email;
    if (contraseña)
        usuario.contraseña = yield hashPassword(contraseña);
    if (typeof activo === 'boolean')
        usuario.activo = activo;
    yield usuario.save();
    // Retornar usuario sin contraseña
    const _b = usuario.get(), { contraseña: _ } = _b, usuarioSinContraseña = __rest(_b, ["contrase\u00F1a"]);
    return usuarioSinContraseña;
});
exports.updateUser = updateUser;
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = yield models_1.Usuario.findByPk(id);
    if (!usuario)
        throw new AppError_1.AppError('Usuario no encontrado');
    // Borrado lógico
    usuario.activo = false;
    yield usuario.save();
    return { message: 'Usuario eliminado correctamente' };
});
exports.deleteUser = deleteUser;
const getUserRoles = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = yield models_1.Usuario.findOne({
        where: { id: userId, activo: true },
        include: [{
                model: models_1.Rol,
                through: { attributes: [] }
            }]
    });
    if (!usuario)
        return [];
    const roles = usuario.Rols || [];
    return roles.map((rol) => rol.nombre);
});
exports.getUserRoles = getUserRoles;
const assignRole = (userId, rolNombre) => __awaiter(void 0, void 0, void 0, function* () {
    const [usuario, rol] = yield Promise.all([
        models_1.Usuario.findOne({ where: { id: userId, activo: true } }),
        models_1.Rol.findOne({ where: { nombre: rolNombre } })
    ]);
    if (!usuario)
        throw new AppError_1.AppError('Usuario no encontrado');
    if (!rol)
        throw new AppError_1.AppError('Rol no encontrado');
    // Verificar regla de alumno
    const rolesActuales = yield (0, exports.getUserRoles)(userId);
    if (rolNombre === 'alumno' && rolesActuales.length > 0) {
        throw new AppError_1.AppError('Un alumno no puede tener roles adicionales');
    }
    if (rolesActuales.includes('alumno') && rolNombre !== 'alumno') {
        throw new AppError_1.AppError('Un alumno no puede tener roles adicionales');
    }
    // Verificar que no exista la relación
    const existeRelacion = yield models_1.UsuarioRol.findOne({
        where: { usuario_id: userId, rol_id: rol.id }
    });
    if (existeRelacion)
        throw new AppError_1.AppError('El usuario ya tiene asignado este rol');
    yield models_1.UsuarioRol.create({ usuario_id: userId, rol_id: rol.id });
    return { message: 'Rol asignado correctamente' };
});
exports.assignRole = assignRole;
const removeRole = (userId, rolNombre) => __awaiter(void 0, void 0, void 0, function* () {
    const [usuario, rol] = yield Promise.all([
        models_1.Usuario.findOne({ where: { id: userId, activo: true } }),
        models_1.Rol.findOne({ where: { nombre: rolNombre } })
    ]);
    if (!usuario)
        throw new AppError_1.AppError('Usuario no encontrado');
    if (!rol)
        throw new AppError_1.AppError('Rol no encontrado');
    const relacion = yield models_1.UsuarioRol.findOne({
        where: { usuario_id: userId, rol_id: rol.id }
    });
    if (!relacion)
        throw new AppError_1.AppError('El usuario no tiene asignado este rol');
    yield relacion.destroy();
    return { message: 'Rol removido correctamente' };
});
exports.removeRole = removeRole;
// Funciones para la relación alumno-padre
const assignParent = (alumnoId, padreId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar que existan los usuarios y sus roles
    const [alumno, padre] = yield Promise.all([
        models_1.Usuario.findOne({
            where: { id: alumnoId, activo: true },
            include: [{ model: models_1.Rol }]
        }),
        models_1.Usuario.findOne({
            where: { id: padreId, activo: true },
            include: [{ model: models_1.Rol }]
        })
    ]);
    if (!alumno)
        throw new AppError_1.AppError('Alumno no encontrado');
    if (!padre)
        throw new AppError_1.AppError('Padre no encontrado');
    // Verificar roles
    const alumnoRoles = yield (0, exports.getUserRoles)(alumnoId);
    const padreRoles = yield (0, exports.getUserRoles)(padreId);
    if (!alumnoRoles.includes('alumno')) {
        throw new AppError_1.AppError('El usuario especificado no es un alumno');
    }
    if (!padreRoles.includes('padre')) {
        throw new AppError_1.AppError('El usuario especificado no es un padre');
    }
    // Verificar que no exista la relación
    const existeRelacion = yield models_1.AlumnoPadre.findOne({
        where: { alumno_usuario_id: alumnoId, padre_usuario_id: padreId }
    });
    if (existeRelacion) {
        throw new AppError_1.AppError('La relación alumno-padre ya existe');
    }
    yield models_1.AlumnoPadre.create({
        alumno_usuario_id: alumnoId,
        padre_usuario_id: padreId
    });
    return { message: 'Relación alumno-padre creada correctamente' };
});
exports.assignParent = assignParent;
const removeParent = (alumnoId, padreId) => __awaiter(void 0, void 0, void 0, function* () {
    const relacion = yield models_1.AlumnoPadre.findOne({
        where: { alumno_usuario_id: alumnoId, padre_usuario_id: padreId }
    });
    if (!relacion) {
        throw new AppError_1.AppError('La relación alumno-padre no existe');
    }
    yield relacion.destroy();
    return { message: 'Relación alumno-padre eliminada correctamente' };
});
exports.removeParent = removeParent;
const getStudentParents = (alumnoId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const alumno = yield models_1.Usuario.findOne({
        where: { id: alumnoId, activo: true },
        include: [{
                model: models_1.AlumnoPadre,
                as: 'AlumnoRelaciones',
                include: [{
                        model: models_1.Usuario,
                        as: 'Padre',
                        attributes: { exclude: ['contraseña'] }
                    }]
            }]
    });
    if (!alumno)
        throw new AppError_1.AppError('Alumno no encontrado');
    const alumnoJSON = alumno.toJSON();
    return ((_a = alumnoJSON.AlumnoRelaciones) === null || _a === void 0 ? void 0 : _a.map(rel => rel.Padre)) || [];
});
exports.getStudentParents = getStudentParents;
const getParentStudents = (padreId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const padre = yield models_1.Usuario.findOne({
        where: { id: padreId, activo: true },
        include: [{
                model: models_1.AlumnoPadre,
                as: 'PadreRelaciones',
                include: [{
                        model: models_1.Usuario,
                        as: 'Alumno',
                        attributes: { exclude: ['contraseña'] }
                    }]
            }]
    });
    if (!padre)
        throw new AppError_1.AppError('Padre no encontrado');
    const padreJSON = padre.toJSON();
    return ((_a = padreJSON.PadreRelaciones) === null || _a === void 0 ? void 0 : _a.map(rel => rel.Alumno)) || [];
});
exports.getParentStudents = getParentStudents;
