import { Router } from 'express';
import * as preceptorController from '../controllers/preceptorController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación como preceptor
router.use(authenticate);
router.use(authorizeRoles('preceptor'));

// ===== DASHBOARD =====
router.get('/dashboard', preceptorController.getDashboard);

// ===== CURSOS ASIGNADOS =====
router.get('/courses', preceptorController.getAssignedCourses);
router.get('/courses/:courseId', preceptorController.getCourseDetail);

// ===== ESTUDIANTES =====
router.get('/students', preceptorController.getAllStudents);
router.get('/courses/:courseId/students', preceptorController.getStudentsByCourse);
router.get('/students/:studentId', preceptorController.getStudentDetail);

// ===== ASISTENCIA MANUAL =====
router.post('/attendance/manual', preceptorController.registerManualAttendance);
router.put('/attendance/:recordId', preceptorController.updateAttendance);
router.get('/attendance/records', preceptorController.getAttendanceRecords);
router.get('/courses/:courseId/attendance/:date', preceptorController.getDailyAttendance);

// ===== REPORTES =====
router.get('/reports/attendance', preceptorController.getAttendanceReport);
router.get('/reports/behavior', preceptorController.getBehaviorReport);
router.get('/reports/academic', preceptorController.getAcademicReport);

// ===== ALERTAS =====
router.get('/alerts', preceptorController.getAlerts);
router.post('/alerts', preceptorController.createAlert);
router.put('/alerts/:alertId', preceptorController.updateAlert);
router.delete('/alerts/:alertId', preceptorController.deleteAlert);

// ===== SANCIONES =====
router.get('/sanctions', preceptorController.getSanctions);
router.post('/sanctions', preceptorController.createSanction);
router.put('/sanctions/:sanctionId', preceptorController.updateSanction);

// ===== COMUNICADOS =====
router.get('/communications', preceptorController.getCommunications);
router.post('/communications', preceptorController.createCommunication);
router.put('/communications/:communicationId', preceptorController.updateCommunication);

// ===== ESTADÍSTICAS =====
router.get('/statistics', preceptorController.getStatistics);

export default router;