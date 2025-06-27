import { Router } from 'express';
import { parentController } from '../controllers/parentController';
import { authenticateToken } from '../middleware/auth';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);
router.use(roleMiddleware(['padre']));

// Dashboard del padre
router.get('/dashboard', parentController.getDashboard);

// Gestión de hijos
router.get('/children', parentController.getChildren);
router.get('/children/attendance', parentController.getChildrenAttendance);
router.get('/children/grades', parentController.getChildrenGrades);
router.get('/children/assignments', parentController.getChildrenAssignments);

// Comunicaciones
router.get('/communications', parentController.getCommunications);
router.put('/communications/:communicationId/read', parentController.markCommunicationRead);

// Reuniones
router.get('/meetings', parentController.getMeetings);
router.post('/meetings', parentController.scheduleMeeting);

// Reportes familiares
router.get('/reports', parentController.getFamilyReports);

// Notificaciones
router.get('/notifications', parentController.getNotifications);
router.put('/notifications/:notificationId/read', parentController.markNotificationRead);

// Configuración
router.get('/settings', parentController.getSettings);
router.put('/settings', parentController.updateSettings);

export default router;