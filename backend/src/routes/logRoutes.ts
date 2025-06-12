import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import * as logController from '../controllers/logController';

const router = Router();

// Wrapper para manejar errores async
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Todas las rutas requieren autenticación
router.use(authenticate);

// === GESTIÓN DE LOGS ===

// Obtener todos los logs (solo admin)
router.get('/', authorizeRoles('admin'), asyncHandler(logController.getLogs));

// Crear log manual (solo admin)
router.post('/', authorizeRoles('admin'), asyncHandler(logController.createLog));

// === CONSULTAS ESPECÍFICAS ===

// Obtener logs por usuario (solo admin)
router.get('/user/:usuario_id', authorizeRoles('admin'), asyncHandler(logController.getLogsByUser));

// Obtener logs del sistema (solo admin)
router.get('/system', authorizeRoles('admin'), asyncHandler(logController.getSystemLogs));

// Obtener logs de errores (solo admin)
router.get('/errors', authorizeRoles('admin'), asyncHandler(logController.getErrorLogs));

// Obtener logs de seguridad (solo admin)
router.get('/security', authorizeRoles('admin'), asyncHandler(logController.getSecurityLogs));

export default router;