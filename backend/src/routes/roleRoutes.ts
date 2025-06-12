import { Router } from 'express';
import * as roleController from '../controllers/roleController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD básico de roles (solo admin)
router.get('/', authorizeRoles('admin'), roleController.getRoles);
router.post('/', authorizeRoles('admin'), roleController.createRole);
router.get('/:id', authorizeRoles('admin'), roleController.getRoleById);
router.put('/:id', authorizeRoles('admin'), roleController.updateRole);
router.delete('/:id', authorizeRoles('admin'), roleController.deleteRole);

// Gestión de permisos
router.get('/permissions', authorizeRoles('admin'), roleController.getAvailablePermissions);
router.post('/:id/permissions', authorizeRoles('admin'), roleController.assignPermissionToRole);
router.delete('/:id/permissions/:permission', authorizeRoles('admin'), roleController.removePermissionFromRole);

// Consultas adicionales
router.get('/:id/users', authorizeRoles('admin'), roleController.getUsersWithRole);

export default router;