import express from 'express';
import { parentController, getHijos, getCalificacionesHijo, getBoletinHijo, getEstadisticasHijo, getResumenAcademicoHijos, getComparativaHermanos, getNotificacionesAcademicas } from '../controllers/parentController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

// Apply authentication and role authorization to all parent routes
router.use(authenticate);
router.use(authorizeRoles('padre'));

// Dashboard
router.get('/dashboard', parentController.getDashboard);

// Children management
router.get('/children', parentController.getChildren);
router.get('/children/attendance', parentController.getChildrenAttendance);
router.get('/children/grades', parentController.getChildrenGrades);
router.get('/children/assignments', parentController.getChildrenAssignments);
router.get('/children/teachers', parentController.getChildrenTeachers);

// Communications
router.get('/communications', parentController.getCommunications);
router.put('/communications/:communicationId/read', parentController.markCommunicationRead);
router.post('/communications/send', parentController.sendMessage);

// Meetings
router.get('/meetings', parentController.getMeetings);
router.post('/meetings', parentController.scheduleMeeting);

// Notifications
router.get('/notifications', parentController.getNotifications);
router.put('/notifications/:notificationId/read', parentController.markNotificationRead);

// Reports
router.get('/reports', parentController.getFamilyReports);

// Settings
router.get('/settings', parentController.getSettings);
router.put('/settings', parentController.updateSettings);

// ===== SISTEMA AVANZADO DE CALIFICACIONES =====
router.get('/hijos', getHijos);
router.get('/hijos/:hijoId/calificaciones', getCalificacionesHijo);
router.get('/hijos/:hijoId/boletin', getBoletinHijo);
router.get('/hijos/:hijoId/estadisticas', getEstadisticasHijo);
router.get('/resumen-academico', getResumenAcademicoHijos);
router.get('/comparativa-hermanos', getComparativaHermanos);
router.get('/notificaciones-academicas', getNotificacionesAcademicas);

export { router as parentRoutes };