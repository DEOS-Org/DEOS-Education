import { Router } from 'express';
import * as deviceController from '../controllers/deviceController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD básico de dispositivos
router.get('/', deviceController.getDevices);
router.post('/', authorizeRoles('admin'), deviceController.createDevice);
router.get('/:id', deviceController.getDeviceById);
router.put('/:id', authorizeRoles('admin'), deviceController.updateDevice);
router.delete('/:id', authorizeRoles('admin'), deviceController.deleteDevice);

// Operaciones adicionales de dispositivos
router.post('/:id/test', authorizeRoles('admin'), deviceController.testConnection);
router.post('/:id/activate', authorizeRoles('admin'), deviceController.activateDevice);
router.post('/:id/deactivate', authorizeRoles('admin'), deviceController.deactivateDevice);
router.get('/:id/status', deviceController.getDeviceStatus);
router.post('/:id/sync', authorizeRoles('admin'), deviceController.syncDevice);

export default router;