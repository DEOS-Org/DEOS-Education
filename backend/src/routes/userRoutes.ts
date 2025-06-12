import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Rutas protegidas por autenticación (ya aplicada en app.ts)
// router.use(authenticate);

// Rutas de usuarios
router.get('/', userController.getUsers);
router.post('/', authorizeRoles('admin'), userController.createUser);
router.get('/:id', userController.getUserById);
router.get('/:id/student-detail', userController.getStudentDetail);
router.get('/:id/professor-detail', userController.getProfessorDetail);
router.put('/:id', authorizeRoles('admin'), userController.updateUser);
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

// Rutas de roles
router.post('/:id/roles', authorizeRoles('admin'), userController.assignRole);
router.delete('/:id/roles', authorizeRoles('admin'), userController.removeRole);
router.get('/:id/roles', userController.getUserRoles);

// Rutas de relación alumno-padre
router.post('/alumnos/:alumnoId/padres', authorizeRoles('admin'), userController.assignParent);
router.delete('/alumnos/:alumnoId/padres/:padreId', authorizeRoles('admin'), userController.removeParent);
router.get('/alumnos/:alumnoId/padres', userController.getStudentParents);
router.get('/padres/:padreId/alumnos', userController.getParentStudents);

export default router;
