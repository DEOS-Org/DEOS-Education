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
exports.esp32Router = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const biometricController = __importStar(require("../controllers/biometricController"));
const router = (0, express_1.Router)();
// Wrapper para manejar errores async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticate);
// === RUTAS DE HUELLAS ===
// Registrar huella (solo admin y el propio usuario)
router.post('/fingerprints', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(biometricController.enrollFingerprint));
// Actualizar huella (solo admin y el propio usuario)
router.put('/fingerprints/:usuario_id', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(biometricController.updateFingerprint));
// Eliminar huella (solo admin)
router.delete('/fingerprints/:usuario_id', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(biometricController.deleteFingerprint));
// Obtener huella por usuario (solo admin y el propio usuario)
router.get('/fingerprints/:usuario_id', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(biometricController.getFingerprintByUser));
// Obtener todas las huellas (solo admin)
router.get('/fingerprints', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(biometricController.getAllFingerprints));
// === RUTAS DE REGISTROS ===
// Crear registro manual (solo admin y preceptor)
router.post('/records', (0, authMiddleware_1.authorizeRoles)('admin', 'preceptor'), asyncHandler(biometricController.createRecord));
// Crear registro manual específico (solo admin)
router.post('/records/manual', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(biometricController.createManualRecord));
// Obtener registros por usuario
router.get('/records/user/:usuario_id', (0, authMiddleware_1.authorizeRoles)('admin', 'preceptor', 'profesor'), asyncHandler(biometricController.getRecordsByUser));
// Obtener todos los registros (solo admin y preceptor)
router.get('/records', (0, authMiddleware_1.authorizeRoles)('admin', 'preceptor'), asyncHandler(biometricController.getAllRecords));
// === RUTA ESPECIAL PARA ESP32 ===
// Ruta pública para ESP32 (sin autenticación JWT)
// En un entorno real, esto tendría su propia autenticación (API key, certificados, etc.)
exports.default = router;
// Crear un router separado para rutas ESP32 (sin autenticación)
exports.esp32Router = (0, express_1.Router)();
exports.esp32Router.post('/biometric-record', asyncHandler(biometricController.handleBiometricRecord));
