import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as notificationService from '../services/notificationService';
import { AppError } from '../utils/AppError';

// ===== CREAR NOTIFICACIÓN =====
export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { usuario_id, titulo, mensaje, tipo, accion_url, metadata } = req.body;

  if (!titulo || !mensaje || !tipo) {
    throw new AppError('Título, mensaje y tipo son requeridos', 400);
  }

  const notification = await notificationService.createNotification({
    usuario_id,
    titulo,
    mensaje,
    tipo,
    accion_url,
    metadata
  });

  res.status(201).json({
    success: true,
    data: notification
  });
});

// ===== CREAR NOTIFICACIÓN MASIVA =====
export const createBulkNotification = asyncHandler(async (req: Request, res: Response) => {
  const { user_ids, titulo, mensaje, tipo, accion_url, metadata } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    throw new AppError('Se requiere una lista de IDs de usuarios', 400);
  }

  if (!titulo || !mensaje || !tipo) {
    throw new AppError('Título, mensaje y tipo son requeridos', 400);
  }

  const notifications = await notificationService.createBulkNotification(user_ids, {
    titulo,
    mensaje,
    tipo,
    accion_url,
    metadata
  });

  res.status(201).json({
    success: true,
    data: notifications,
    count: notifications.length
  });
});

// ===== CREAR NOTIFICACIÓN GLOBAL =====
export const createGlobalNotification = asyncHandler(async (req: Request, res: Response) => {
  const { titulo, mensaje, tipo, accion_url, metadata } = req.body;

  if (!titulo || !mensaje || !tipo) {
    throw new AppError('Título, mensaje y tipo son requeridos', 400);
  }

  const notification = await notificationService.createGlobalNotification({
    titulo,
    mensaje,
    tipo,
    accion_url,
    metadata
  });

  res.status(201).json({
    success: true,
    data: notification
  });
});

// ===== OBTENER NOTIFICACIONES (ADMIN) =====
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const {
    usuario_id,
    tipo,
    leida,
    fecha_desde,
    fecha_hasta,
    limit = 50,
    offset = 0
  } = req.query;

  const filters: any = {};

  if (usuario_id) filters.usuario_id = parseInt(usuario_id as string);
  if (tipo) filters.tipo = tipo as string;
  if (leida !== undefined) filters.leida = leida === 'true';
  if (fecha_desde) filters.fecha_desde = new Date(fecha_desde as string);
  if (fecha_hasta) filters.fecha_hasta = new Date(fecha_hasta as string);
  if (limit) filters.limit = parseInt(limit as string);
  if (offset) filters.offset = parseInt(offset as string);

  const notifications = await notificationService.getNotifications(filters);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      count: notifications.length
    }
  });
});

// ===== OBTENER NOTIFICACIONES DEL USUARIO ACTUAL =====
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const {
    tipo,
    leida,
    include_global = 'true',
    limit = 20,
    offset = 0
  } = req.query;

  const filters: any = {};
  if (tipo) filters.tipo = tipo as string;
  if (leida !== undefined) filters.leida = leida === 'true';
  if (limit) filters.limit = parseInt(limit as string);
  if (offset) filters.offset = parseInt(offset as string);

  const includeGlobal = include_global === 'true';

  const notifications = await notificationService.getUserNotifications(
    userId,
    includeGlobal,
    filters
  );

  res.json({
    success: true,
    data: notifications,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      count: notifications.length
    }
  });
});

// ===== MARCAR COMO LEÍDA =====
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  const notificationId = parseInt(id);
  if (isNaN(notificationId)) {
    throw new AppError('ID de notificación inválido', 400);
  }

  const notification = await notificationService.markAsRead(notificationId, userId);

  res.json({
    success: true,
    data: notification
  });
});

// ===== MARCAR TODAS COMO LEÍDAS =====
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const updatedCount = await notificationService.markAllAsRead(userId);

  res.json({
    success: true,
    message: `${updatedCount} notificaciones marcadas como leídas`,
    updated_count: updatedCount
  });
});

// ===== ELIMINAR NOTIFICACIÓN =====
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notificationId = parseInt(id);
  if (isNaN(notificationId)) {
    throw new AppError('ID de notificación inválido', 400);
  }

  await notificationService.deleteNotification(notificationId);

  res.json({
    success: true,
    message: 'Notificación eliminada correctamente'
  });
});

// ===== LIMPIAR NOTIFICACIONES ANTIGUAS =====
export const cleanupOldNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;

  const daysOld = parseInt(days as string);
  if (isNaN(daysOld) || daysOld < 1) {
    throw new AppError('Número de días inválido', 400);
  }

  const deletedCount = await notificationService.cleanupOldNotifications(daysOld);

  res.json({
    success: true,
    message: `${deletedCount} notificaciones antiguas eliminadas`,
    deleted_count: deletedCount
  });
});

// ===== OBTENER ESTADÍSTICAS =====
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const { usuario_id } = req.query;
  const currentUserId = (req as any).user?.id;

  // Si se especifica usuario_id, debe ser admin o el mismo usuario
  let targetUserId: number | undefined;
  
  if (usuario_id) {
    targetUserId = parseInt(usuario_id as string);
    
    // Verificar permisos (solo admin puede ver stats de otros usuarios)
    const userRole = (req as any).user?.roles?.[0]?.nombre;
    if (userRole !== 'admin' && targetUserId !== currentUserId) {
      throw new AppError('No tienes permisos para ver las estadísticas de este usuario', 403);
    }
  } else {
    // Si no se especifica, mostrar del usuario actual
    targetUserId = currentUserId;
  }

  const stats = await notificationService.getNotificationStats(targetUserId);

  res.json({
    success: true,
    data: stats
  });
});

// ===== OBTENER NOTIFICACIONES NO LEÍDAS (COUNT) =====
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const notifications = await notificationService.getUserNotifications(userId, true, {
    leida: false,
    limit: 1000 // Alto límite para contar todas
  });

  res.json({
    success: true,
    unread_count: notifications.length
  });
});

// ===== CREAR NOTIFICACIONES AUTOMÁTICAS =====

// Crear notificación de bienvenida
export const createWelcomeNotification = asyncHandler(async (req: Request, res: Response) => {
  const { usuario_id, rol_name } = req.body;

  if (!usuario_id || !rol_name) {
    throw new AppError('ID de usuario y nombre de rol son requeridos', 400);
  }

  const notification = await notificationService.createWelcomeNotification(
    parseInt(usuario_id),
    rol_name
  );

  res.status(201).json({
    success: true,
    data: notification
  });
});

// Crear notificación de huella faltante
export const createMissingFingerprintNotification = asyncHandler(async (req: Request, res: Response) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    throw new AppError('ID de usuario es requerido', 400);
  }

  const notification = await notificationService.createMissingFingerprintNotification(
    parseInt(usuario_id)
  );

  res.status(201).json({
    success: true,
    data: notification
  });
});

// Crear notificación de error de dispositivo
export const createDeviceErrorNotification = asyncHandler(async (req: Request, res: Response) => {
  const { device_name, error_message } = req.body;

  if (!device_name || !error_message) {
    throw new AppError('Nombre de dispositivo y mensaje de error son requeridos', 400);
  }

  const notifications = await notificationService.createDeviceErrorNotification(
    device_name,
    error_message
  );

  res.status(201).json({
    success: true,
    data: notifications
  });
});

// Crear notificación de ausencias excesivas
export const createExcessiveAbsenceNotification = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, absence_count, period } = req.body;

  if (!student_id || !absence_count || !period) {
    throw new AppError('ID de estudiante, cantidad de ausencias y período son requeridos', 400);
  }

  const notification = await notificationService.createExcessiveAbsenceNotification(
    parseInt(student_id),
    parseInt(absence_count),
    period
  );

  res.status(201).json({
    success: true,
    data: notification
  });
});