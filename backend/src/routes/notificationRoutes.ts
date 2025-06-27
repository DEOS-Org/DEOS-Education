import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import * as notificationController from '../controllers/notificationController';

const router = Router();

// Aplicar middleware de autenticación para todos los endpoints
router.use(authenticate);

// ===== RUTAS PARA USUARIOS AUTENTICADOS =====
// Obtener notificaciones del usuario
router.get('/', notificationController.getNotifications);

// Obtener cantidad de notificaciones no leídas
router.get('/unread-count', notificationController.getUnreadCount);

// Marcar notificación como leída
router.put('/:notificationId/read', notificationController.markAsRead);

// Marcar todas las notificaciones como leídas
router.put('/mark-all-read', notificationController.markAllAsRead);

// Eliminar notificación
router.delete('/:notificationId', notificationController.deleteNotification);

// ===== RUTAS PARA PRECEPTORES Y ADMIN =====
// Crear notificación individual (preceptor y admin)
router.post('/', authorizeRoles('admin', 'preceptor'), notificationController.createNotification);

// ===== RUTAS SOLO PARA ADMIN =====
// Crear notificación global
router.post('/global', authorizeRoles('admin'), notificationController.createGlobalNotification);

// Ver todas las notificaciones (admin)
router.get('/admin/all', authorizeRoles('admin'), notificationController.getAllNotifications);

// Estadísticas de notificaciones (admin)
router.get('/admin/stats', authorizeRoles('admin'), notificationController.getNotificationStats);

export default router;