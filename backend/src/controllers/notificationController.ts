import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as notificationService from '../services/notificationService';

// ===== GET NOTIFICATIONS =====
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  const notifications = await notificationService.getUserNotifications(
    userId,
    Number(page),
    Number(limit),
    unreadOnly === 'true'
  );
  
  res.json(notifications);
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const count = await notificationService.getUnreadCount(userId);
  res.json({ count });
});

// ===== MARK AS READ =====
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  await notificationService.markAsRead(Number(notificationId), userId);
  res.json({ message: 'Notificación marcada como leída' });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  await notificationService.markAllAsRead(userId);
  res.json({ message: 'Todas las notificaciones marcadas como leídas' });
});

// ===== CREATE NOTIFICATION =====
export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const {
    usuario_id,
    titulo,
    mensaje,
    tipo = 'info',
    accion_url,
    metadata,
    sendEmail = false
  } = req.body;
  
  // Verificar que el usuario tiene permisos para crear notificaciones
  const userRole = req.user?.rol;
  if (!['admin', 'preceptor'].includes(userRole)) {
    throw new AppError('No tienes permisos para crear notificaciones', 403);
  }
  
  const notification = await notificationService.createNotification({
    usuario_id,
    titulo,
    mensaje,
    tipo,
    accion_url,
    metadata
  }, sendEmail);
  
  res.status(201).json(notification);
});

// ===== GLOBAL NOTIFICATIONS =====
export const createGlobalNotification = asyncHandler(async (req: Request, res: Response) => {
  const {
    titulo,
    mensaje,
    tipo = 'info',
    roles = [],
    accion_url,
    metadata,
    sendEmail = false
  } = req.body;
  
  // Solo admin puede crear notificaciones globales
  const userRole = req.user?.rol;
  if (userRole !== 'admin') {
    throw new AppError('No tienes permisos para crear notificaciones globales', 403);
  }
  
  const notifications = await notificationService.createGlobalNotification({
    titulo,
    mensaje,
    tipo,
    accion_url,
    metadata
  }, roles, sendEmail);
  
  res.status(201).json({ 
    message: 'Notificación global creada',
    count: notifications.length 
  });
});

// ===== DELETE NOTIFICATION =====
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  await notificationService.deleteNotification(Number(notificationId), userId);
  res.json({ message: 'Notificación eliminada' });
});

// ===== ADMIN FUNCTIONS =====
export const getAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  // Solo admin puede ver todas las notificaciones
  const userRole = req.user?.rol;
  if (userRole !== 'admin') {
    throw new AppError('No tienes permisos para ver todas las notificaciones', 403);
  }
  
  const { page = 1, limit = 50, tipo, usuario_id } = req.query;
  
  const notifications = await notificationService.getAllNotifications({
    page: Number(page),
    limit: Number(limit),
    tipo: tipo as string,
    usuario_id: usuario_id ? Number(usuario_id) : undefined
  });
  
  res.json(notifications);
});

export const getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
  // Solo admin puede ver estadísticas
  const userRole = req.user?.rol;
  if (userRole !== 'admin') {
    throw new AppError('No tienes permisos para ver estadísticas', 403);
  }
  
  const stats = await notificationService.getNotificationStats();
  res.json(stats);
});