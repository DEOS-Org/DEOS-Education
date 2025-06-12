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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deviceController = __importStar(require("../controllers/deviceController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticate);
// CRUD básico de dispositivos
router.get('/', deviceController.getDevices);
router.post('/', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.createDevice);
router.get('/:id', deviceController.getDeviceById);
router.put('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.updateDevice);
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.deleteDevice);
// Operaciones adicionales de dispositivos
router.post('/:id/test', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.testConnection);
router.post('/:id/activate', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.activateDevice);
router.post('/:id/deactivate', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.deactivateDevice);
router.get('/:id/status', deviceController.getDeviceStatus);
router.post('/:id/sync', (0, authMiddleware_1.authorizeRoles)('admin'), deviceController.syncDevice);
exports.default = router;
