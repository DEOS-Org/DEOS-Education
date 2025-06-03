import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Crear usuario (solo admin)
router.post(
  '/',
  authenticate as any,
  authorizeRoles('admin') as any,
  asyncHandler(userController.createUser)
);

// Listar usuarios (solo admin)
router.get(
  '/',
  authenticate as any,
  authorizeRoles('admin') as any,
  asyncHandler(userController.getUsers)
);

// Ver detalle de usuario (admin o self)
router.get(
  '/:id',
  authenticate as any,
  asyncHandler(userController.getUserById)
);

// Editar usuario (admin o self)
router.put(
  '/:id',
  authenticate as any,
  asyncHandler(userController.updateUser)
);

// Asignar roles a usuario (solo admin)
router.post(
  '/:id/roles',
  authenticate as any,
  authorizeRoles('admin') as any,
  asyncHandler(userController.assignRoles)
);

// Activar usuario (solo admin)
router.patch(
  '/:id/activate',
  authenticate as any,
  authorizeRoles('admin') as any,
  asyncHandler(userController.activateUser)
);

// Desactivar usuario (solo admin)
router.patch(
  '/:id/deactivate',
  authenticate as any,
  authorizeRoles('admin') as any,
  asyncHandler(userController.deactivateUser)
);

export default router;
