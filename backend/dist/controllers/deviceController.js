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
exports.syncDevice = exports.getDeviceStatus = exports.deactivateDevice = exports.activateDevice = exports.testConnection = exports.deleteDevice = exports.updateDevice = exports.getDeviceById = exports.getDevices = exports.createDevice = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
const AppError_1 = require("../utils/AppError");
const deviceService = __importStar(require("../services/deviceService"));
exports.createDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, ip, puerto, tipo, ubicacion, descripcion } = req.body;
    if (!nombre || !ip || !puerto || !tipo || !ubicacion) {
        throw new AppError_1.AppError('Faltan campos requeridos', 400);
    }
    const dispositivo = yield deviceService.createDevice({
        nombre,
        ip,
        puerto,
        tipo,
        ubicacion,
        descripcion,
        activo: true
    });
    res.status(201).json(dispositivo);
}));
exports.getDevices = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dispositivos = yield deviceService.getDevices();
    res.json({ data: dispositivos });
}));
exports.getDeviceById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dispositivo = yield deviceService.getDeviceById(Number(id));
    if (!dispositivo) {
        throw new AppError_1.AppError('Dispositivo no encontrado', 404);
    }
    res.json(dispositivo);
}));
exports.updateDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, ip, puerto, tipo, ubicacion, descripcion, activo } = req.body;
    const dispositivo = yield deviceService.updateDevice(Number(id), {
        nombre,
        ip,
        puerto,
        tipo,
        ubicacion,
        descripcion,
        activo
    });
    res.json(dispositivo);
}));
exports.deleteDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield deviceService.deleteDevice(Number(id));
    res.json(result);
}));
exports.testConnection = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield deviceService.testConnection(Number(id));
    res.json(result);
}));
exports.activateDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dispositivo = yield deviceService.updateDeviceStatus(Number(id), true);
    res.json({ message: 'Dispositivo activado correctamente', dispositivo });
}));
exports.deactivateDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dispositivo = yield deviceService.updateDeviceStatus(Number(id), false);
    res.json({ message: 'Dispositivo desactivado correctamente', dispositivo });
}));
exports.getDeviceStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const status = yield deviceService.getDeviceStatus(Number(id));
    res.json(status);
}));
exports.syncDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield deviceService.syncDevice(Number(id));
    res.json(result);
}));
