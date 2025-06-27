import express from 'express';
import {
  createNotification,
  createBulkNotification,
  createGlobalNotification,
  getNotifications,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  getStats,
  getUnreadCount,
  createWelcomeNotification,
  createMissingFingerprintNotification,
  createDeviceErrorNotification,
  createExcessiveAbsenceNotification
} from '../controllers/notificationController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

// ===== RUTAS PÚBLICAS (CON AUTENTICACIÓN) =====

// Obtener notificaciones del usuario actual
router.get('/my', authenticate, getMyNotifications);

// Obtener cantidad de notificaciones no leídas
router.get('/unread-count', authenticate, getUnreadCount);

// Marcar notificación como leída
router.patch('/:id/read', authenticate, markAsRead);

// Marcar todas las notificaciones como leídas
router.patch('/mark-all-read', authenticate, markAllAsRead);

// Obtener estadísticas personales
router.get('/stats', authenticate, getStats);

// ===== RUTAS DE ADMINISTRACIÓN =====

// Obtener todas las notificaciones (admin)
router.get('/', authenticate, authorizeRoles('admin'), getNotifications);

// Crear notificación individual
router.post('/', authenticate, authorizeRoles('admin'), createNotification);

// Crear notificación masiva
router.post('/bulk', authenticate, authorizeRoles('admin'), createBulkNotification);

// Crear notificación global
router.post('/global', authenticate, authorizeRoles('admin'), createGlobalNotification);

// Eliminar notificación
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteNotification);

// Limpiar notificaciones antiguas
router.delete('/cleanup/old', authenticate, authorizeRoles('admin'), cleanupOldNotifications);

// ===== RUTAS DE NOTIFICACIONES AUTOMÁTICAS =====

// Crear notificación de bienvenida
router.post('/auto/welcome', authenticate, authorizeRoles('admin'), createWelcomeNotification);

// Crear notificación de huella faltante
router.post('/auto/missing-fingerprint', authenticate, authorizeRoles('admin'), createMissingFingerprintNotification);

// Crear notificación de error de dispositivo
router.post('/auto/device-error', authenticate, authorizeRoles('admin'), createDeviceErrorNotification);

// Crear notificación de ausencias excesivas
router.post('/auto/excessive-absence', authenticate, authorizeRoles('admin', 'preceptor'), createExcessiveAbsenceNotification);

export default router;