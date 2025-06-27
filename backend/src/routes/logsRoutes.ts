import { Router } from 'express';
import * as logsController from '../controllers/logsController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorizeRoles('admin'));

// Rutas principales de logs
router.get('/', logsController.getLogs);
router.get('/stats', logsController.getLogStats);
router.get('/export', logsController.exportLogs);
router.get('/categories', logsController.getLogCategories);
router.get('/actions', logsController.getLogActions);
router.get('/users', logsController.getLogUsers);
router.get('/:id', logsController.getLogById);

// Rutas de mantenimiento
router.delete('/clear', logsController.clearOldLogs);

export default router;