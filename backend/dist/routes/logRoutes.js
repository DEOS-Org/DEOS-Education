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
const authMiddleware_1 = require("../middlewares/authMiddleware");
const logController = __importStar(require("../controllers/logController"));
const router = (0, express_1.Router)();
// Wrapper para manejar errores async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticate);
// === GESTIÓN DE LOGS ===
// Obtener todos los logs (solo admin)
router.get('/', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(logController.getLogs));
// Crear log manual (solo admin)
router.post('/', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(logController.createLog));
// === CONSULTAS ESPECÍFICAS ===
// Obtener logs por usuario (solo admin)
router.get('/user/:usuario_id', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(logController.getLogsByUser));
// Obtener logs del sistema (solo admin)
router.get('/system', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(logController.getSystemLogs));
// Obtener logs de errores (solo admin)
router.get('/errors', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(logController.getErrorLogs));
// Obtener logs de seguridad (solo admin)
router.get('/security', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(logController.getSecurityLogs));
exports.default = router;
