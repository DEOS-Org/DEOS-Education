import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Estadísticas generales del dashboard (solo para admins)
router.get('/stats', authorizeRoles('admin'), dashboardController.getDashboardStats);

// Conteo de usuarios por rol
router.get('/users/count/:role', authorizeRoles('admin'), dashboardController.getUserCountByRole);

// Conteo de estudiantes por curso/división
router.get('/students/count', authorizeRoles('admin'), dashboardController.getStudentCountByCourse);

// Estadísticas de asistencia
router.get('/attendance/stats', authorizeRoles('admin'), dashboardController.getAttendanceStats);

export default router;