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
exports.syncDevice = exports.testConnection = exports.getDeviceStatus = exports.testDeviceConnection = exports.deleteDevice = exports.updateDeviceStatus = exports.updateDevice = exports.createDevice = exports.getDeviceById = exports.getDevices = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const sequelize_1 = require("sequelize");
const getDevices = () => __awaiter(void 0, void 0, void 0, function* () {
    const devices = yield models_1.DispositivoFichaje.findAll({
        order: [['id', 'ASC']]
    });
    return devices.map(device => ({
        id: device.id,
        nombre: device.identificador_unico,
        descripcion: device.descripcion || '',
        ip: '192.168.1.100', // Default IP for frontend compatibility
        puerto: 8080, // Default port
        tipo: 'ESP32', // Default type
        ubicacion: device.ubicacion || '',
        activo: device.activo !== false,
        estado: device.activo ? 'online' : 'offline',
        ultima_conexion: new Date(),
        createdAt: device.created_at || new Date(),
        updatedAt: device.updated_at || new Date()
    }));
});
exports.getDevices = getDevices;
const getDeviceById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    return {
        id: device.id,
        nombre: device.identificador_unico,
        descripcion: device.descripcion || '',
        ip: '192.168.1.100',
        puerto: 8080,
        tipo: 'ESP32',
        ubicacion: device.ubicacion || '',
        activo: device.activo !== false,
        estado: device.activo ? 'online' : 'offline',
        ultima_conexion: new Date(),
        createdAt: device.created_at || new Date(),
        updatedAt: device.updated_at || new Date()
    };
});
exports.getDeviceById = getDeviceById;
const createDevice = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if device with this identifier exists
    const existingDevice = yield models_1.DispositivoFichaje.findOne({
        where: { identificador_unico: data.nombre }
    });
    if (existingDevice) {
        throw new AppError_1.AppError('Ya existe un dispositivo con ese identificador', 400);
    }
    const device = yield models_1.DispositivoFichaje.create({
        identificador_unico: data.nombre,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        activo: data.activo
    });
    return {
        id: device.id,
        nombre: device.identificador_unico,
        descripcion: device.descripcion || '',
        ip: data.ip,
        puerto: data.puerto,
        tipo: data.tipo,
        ubicacion: device.ubicacion || '',
        activo: device.activo !== false,
        estado: device.activo ? 'online' : 'offline',
        ultima_conexion: new Date(),
        createdAt: device.created_at || new Date(),
        updatedAt: device.updated_at || new Date()
    };
});
exports.createDevice = createDevice;
const updateDevice = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    // Check if another device with this identifier exists
    const existingDevice = yield models_1.DispositivoFichaje.findOne({
        where: {
            identificador_unico: data.nombre,
            id: { [sequelize_1.Op.ne]: id }
        }
    });
    if (existingDevice) {
        throw new AppError_1.AppError('Ya existe un dispositivo con ese identificador', 400);
    }
    yield device.update({
        identificador_unico: data.nombre,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        activo: data.activo
    });
    return {
        id: device.id,
        nombre: device.identificador_unico,
        descripcion: device.descripcion || '',
        ip: data.ip,
        puerto: data.puerto,
        tipo: data.tipo,
        ubicacion: device.ubicacion || '',
        activo: device.activo !== false,
        estado: device.activo ? 'online' : 'offline',
        ultima_conexion: new Date(),
        createdAt: device.created_at || new Date(),
        updatedAt: device.updated_at || new Date()
    };
});
exports.updateDevice = updateDevice;
const updateDeviceStatus = (id, activo) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    yield device.update({ activo });
    return {
        id: device.id,
        nombre: device.identificador_unico,
        descripcion: device.descripcion || '',
        ip: '192.168.1.100',
        puerto: 8080,
        tipo: 'ESP32',
        ubicacion: device.ubicacion || '',
        activo: device.activo !== false,
        estado: device.activo ? 'online' : 'offline',
        ultima_conexion: new Date(),
        createdAt: device.created_at || new Date(),
        updatedAt: device.updated_at || new Date()
    };
});
exports.updateDeviceStatus = updateDeviceStatus;
const deleteDevice = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    yield device.destroy();
    return { message: 'Dispositivo eliminado correctamente' };
});
exports.deleteDevice = deleteDevice;
const testDeviceConnection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    if (!device.activo) {
        throw new AppError_1.AppError('El dispositivo está desactivado', 400);
    }
    // Simulate connection test
    const isOnline = Math.random() > 0.3; // 70% success rate
    return {
        id: device.id,
        nombre: device.identificador_unico,
        conectado: isOnline,
        latencia: isOnline ? Math.floor(Math.random() * 100) + 10 : null,
        mensaje: isOnline ? 'Conexión exitosa' : 'Error de conexión'
    };
});
exports.testDeviceConnection = testDeviceConnection;
const getDeviceStatus = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    return {
        id: device.id,
        nombre: device.identificador_unico,
        estado: device.activo ? 'online' : 'offline',
        activo: device.activo !== false,
        ultima_actividad: new Date(),
        registros_hoy: Math.floor(Math.random() * 50) + 10,
        uptime: device.activo ? '12:34:56' : '00:00:00'
    };
});
exports.getDeviceStatus = getDeviceStatus;
// Add missing methods referenced by controller
const testConnection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.testDeviceConnection)(id);
});
exports.testConnection = testConnection;
const syncDevice = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const device = yield models_1.DispositivoFichaje.findByPk(id);
    if (!device) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    if (!device.activo) {
        throw new AppError_1.AppError('El dispositivo está desactivado', 400);
    }
    // Simulate synchronization
    const success = Math.random() > 0.2; // 80% success rate
    return {
        id: device.id,
        nombre: device.identificador_unico,
        sincronizado: success,
        mensaje: success ? 'Sincronización exitosa' : 'Error en la sincronización',
        timestamp: new Date(),
        registros_sincronizados: success ? Math.floor(Math.random() * 100) + 10 : 0
    };
});
exports.syncDevice = syncDevice;
