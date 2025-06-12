import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import * as biometricController from '../controllers/biometricController';

const router = Router();

// Wrapper para manejar errores async
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Todas las rutas requieren autenticación
router.use(authenticate);

// === RUTAS DE HUELLAS ===

// Registrar huella (solo admin y el propio usuario)
router.post('/fingerprints', authorizeRoles('admin'), asyncHandler(biometricController.enrollFingerprint));

// Actualizar huella (solo admin y el propio usuario)
router.put('/fingerprints/:usuario_id', authorizeRoles('admin'), asyncHandler(biometricController.updateFingerprint));

// Eliminar huella (solo admin)
router.delete('/fingerprints/:usuario_id', authorizeRoles('admin'), asyncHandler(biometricController.deleteFingerprint));

// Obtener huella por usuario (solo admin y el propio usuario)
router.get('/fingerprints/:usuario_id', authorizeRoles('admin'), asyncHandler(biometricController.getFingerprintByUser));

// Obtener todas las huellas (solo admin)
router.get('/fingerprints', authorizeRoles('admin'), asyncHandler(biometricController.getAllFingerprints));

// === RUTAS DE REGISTROS ===

// Crear registro manual (solo admin y preceptor)
router.post('/records', authorizeRoles('admin', 'preceptor'), asyncHandler(biometricController.createRecord));

// Crear registro manual específico (solo admin)
router.post('/records/manual', authorizeRoles('admin'), asyncHandler(biometricController.createManualRecord));

// Obtener registros por usuario
router.get('/records/user/:usuario_id', authorizeRoles('admin', 'preceptor', 'profesor'), asyncHandler(biometricController.getRecordsByUser));

// Obtener todos los registros (solo admin y preceptor)
router.get('/records', authorizeRoles('admin', 'preceptor'), asyncHandler(biometricController.getAllRecords));

// === RUTA ESPECIAL PARA ESP32 ===

// Ruta pública para ESP32 (sin autenticación JWT)
// En un entorno real, esto tendría su propia autenticación (API key, certificados, etc.)

export default router;

// Crear un router separado para rutas ESP32 (sin autenticación)
export const esp32Router = Router();

esp32Router.post('/biometric-record', asyncHandler(biometricController.handleBiometricRecord));