import { Notificacion, Usuario, Rol, NotificacionInstance } from '../models';
import { AppError } from '../utils/AppError';
import { Op, literal } from 'sequelize';

export interface CreateNotificationData {
  usuario_id?: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  accion_url?: string;
  metadata?: any;
}

export interface NotificationFilters {
  usuario_id?: number;
  tipo?: string;
  leida?: boolean;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  limit?: number;
  offset?: number;
}

// ===== CREAR NOTIFICACIÓN =====
export const createNotification = async (data: CreateNotificationData): Promise<NotificacionInstance> => {
  try {
    // Validar que el usuario existe si se especifica
    if (data.usuario_id) {
      const usuario = await Usuario.findByPk(data.usuario_id);
      if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
      }
    }

    const notification = await Notificacion.create({
      usuario_id: data.usuario_id,
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo,
      accion_url: data.accion_url,
      metadata: data.metadata,
      leida: false,
      fecha_creacion: new Date()
    });

    return notification;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error creating notification:', error);
    throw new AppError('Error al crear la notificación');
  }
};

// ===== CREAR NOTIFICACIÓN MASIVA =====
export const createBulkNotification = async (
  userIds: number[], 
  data: Omit<CreateNotificationData, 'usuario_id'>
): Promise<NotificacionInstance[]> => {
  try {
    // Validar que todos los usuarios existen
    const usuarios = await Usuario.findAll({
      where: {
        id: { [Op.in]: userIds },
        activo: true
      }
    });

    if (usuarios.length !== userIds.length) {
      throw new AppError('Uno o más usuarios no existen o están inactivos', 400);
    }

    // Crear notificaciones para todos los usuarios
    const notifications = await Promise.all(
      userIds.map(userId => 
        Notificacion.create({
          usuario_id: userId,
          titulo: data.titulo,
          mensaje: data.mensaje,
          tipo: data.tipo,
          accion_url: data.accion_url,
          metadata: data.metadata,
          leida: false,
          fecha_creacion: new Date()
        })
      )
    );

    return notifications;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error creating bulk notification:', error);
    throw new AppError('Error al crear las notificaciones masivas');
  }
};

// ===== CREAR NOTIFICACIÓN GLOBAL =====
export const createGlobalNotification = async (
  data: Omit<CreateNotificationData, 'usuario_id'>
): Promise<NotificacionInstance> => {
  try {
    const notification = await Notificacion.create({
      usuario_id: undefined, // undefined = notificación global
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo,
      accion_url: data.accion_url,
      metadata: data.metadata,
      leida: false,
      fecha_creacion: new Date()
    });

    return notification;
  } catch (error) {
    console.error('Error creating global notification:', error);
    throw new AppError('Error al crear la notificación global');
  }
};

// ===== OBTENER NOTIFICACIONES =====
export const getNotifications = async (filters: NotificationFilters = {}) => {
  try {
    const whereClause: any = {};

    // Filtros
    if (filters.usuario_id !== undefined) {
      whereClause.usuario_id = filters.usuario_id;
    }
    if (filters.tipo) {
      whereClause.tipo = filters.tipo;
    }
    if (filters.leida !== undefined) {
      whereClause.leida = filters.leida;
    }
    if (filters.fecha_desde || filters.fecha_hasta) {
      whereClause.fecha_creacion = {};
      if (filters.fecha_desde) {
        whereClause.fecha_creacion[Op.gte] = filters.fecha_desde;
      }
      if (filters.fecha_hasta) {
        whereClause.fecha_creacion[Op.lte] = filters.fecha_hasta;
      }
    }

    const notifications = await Notificacion.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombre', 'apellido', 'email'],
          required: false
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return notifications.map(notification => ({
      id: notification.id,
      usuario_id: notification.usuario_id,
      titulo: notification.titulo,
      mensaje: notification.mensaje,
      tipo: notification.tipo,
      leida: notification.leida,
      fecha_creacion: notification.fecha_creacion,
      fecha_leida: notification.fecha_leida,
      accion_url: notification.accion_url,
      metadata: notification.metadata,
      usuario: (notification as any).Usuario ? {
        id: (notification as any).Usuario.id,
        nombre: (notification as any).Usuario.nombre,
        apellido: (notification as any).Usuario.apellido,
        email: (notification as any).Usuario.email
      } : null
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw new AppError('Error al obtener las notificaciones');
  }
};

// ===== OBTENER NOTIFICACIONES DE USUARIO =====
export const getUserNotifications = async (
  userId: number, 
  includeGlobal: boolean = true,
  filters: Omit<NotificationFilters, 'usuario_id'> = {}
) => {
  try {
    const whereClause: any = {};

    if (includeGlobal) {
      whereClause[Op.or] = [
        { usuario_id: userId },
        literal('usuario_id IS NULL') // Notificaciones globales
      ];
    } else {
      whereClause.usuario_id = userId;
    }

    // Otros filtros
    if (filters.tipo) {
      whereClause.tipo = filters.tipo;
    }
    if (filters.leida !== undefined) {
      whereClause.leida = filters.leida;
    }
    if (filters.fecha_desde || filters.fecha_hasta) {
      whereClause.fecha_creacion = {};
      if (filters.fecha_desde) {
        whereClause.fecha_creacion[Op.gte] = filters.fecha_desde;
      }
      if (filters.fecha_hasta) {
        whereClause.fecha_creacion[Op.lte] = filters.fecha_hasta;
      }
    }

    const notifications = await Notificacion.findAll({
      where: whereClause,
      order: [['fecha_creacion', 'DESC']],
      limit: filters.limit || 20,
      offset: filters.offset || 0
    });

    return notifications.map(notification => ({
      id: notification.id,
      titulo: notification.titulo,
      mensaje: notification.mensaje,
      tipo: notification.tipo,
      leida: notification.leida,
      fecha_creacion: notification.fecha_creacion,
      fecha_leida: notification.fecha_leida,
      accion_url: notification.accion_url,
      metadata: notification.metadata,
      es_global: notification.usuario_id === null
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw new AppError('Error al obtener las notificaciones del usuario');
  }
};

// ===== MARCAR COMO LEÍDA =====
export const markAsRead = async (notificationId: number, userId?: number): Promise<NotificacionInstance> => {
  try {
    const whereClause: any = { id: notificationId };
    
    // Si se especifica usuario, validar que la notificación le pertenezca o sea global
    if (userId) {
      whereClause[Op.or] = [
        { usuario_id: userId },
        { usuario_id: null } // Notificaciones globales
      ];
    }

    const notification = await Notificacion.findOne({ where: whereClause });
    
    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }

    if (notification.leida) {
      return notification; // Ya está leída
    }

    await notification.update({
      leida: true,
      fecha_leida: new Date()
    });

    return notification;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error marking notification as read:', error);
    throw new AppError('Error al marcar la notificación como leída');
  }
};

// ===== MARCAR TODAS COMO LEÍDAS =====
export const markAllAsRead = async (userId: number): Promise<number> => {
  try {
    const [updatedCount] = await Notificacion.update(
      {
        leida: true,
        fecha_leida: new Date()
      },
      {
        where: {
          [Op.or]: [
            { usuario_id: userId },
            literal('usuario_id IS NULL') // Notificaciones globales
          ],
          leida: false
        }
      }
    );

    return updatedCount;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new AppError('Error al marcar todas las notificaciones como leídas');
  }
};

// ===== ELIMINAR NOTIFICACIÓN =====
export const deleteNotification = async (notificationId: number): Promise<void> => {
  try {
    const notification = await Notificacion.findByPk(notificationId);
    
    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }

    await notification.destroy();
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error deleting notification:', error);
    throw new AppError('Error al eliminar la notificación');
  }
};

// ===== LIMPIAR NOTIFICACIONES ANTIGUAS =====
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedCount = await Notificacion.destroy({
      where: {
        fecha_creacion: {
          [Op.lt]: cutoffDate
        },
        leida: true // Solo eliminar las que ya fueron leídas
      }
    });

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw new AppError('Error al limpiar notificaciones antiguas');
  }
};

// ===== OBTENER ESTADÍSTICAS =====
export const getNotificationStats = async (userId?: number) => {
  try {
    const whereClause: any = {};
    
    if (userId) {
      whereClause[Op.or] = [
        { usuario_id: userId },
        { usuario_id: null } // Notificaciones globales
      ];
    }

    const total = await Notificacion.count({ where: whereClause });
    
    const noLeidas = await Notificacion.count({
      where: {
        ...whereClause,
        leida: false
      }
    });

    const porTipo = await Notificacion.findAll({
      where: whereClause,
      attributes: [
        'tipo',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['tipo'],
      raw: true
    });

    return {
      total,
      no_leidas: noLeidas,
      leidas: total - noLeidas,
      por_tipo: porTipo.reduce((acc: any, item: any) => {
        acc[item.tipo] = parseInt(item.count);
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw new AppError('Error al obtener estadísticas de notificaciones');
  }
};

// ===== NOTIFICACIONES AUTOMÁTICAS DEL SISTEMA =====

// Notificación de bienvenida para nuevo usuario
export const createWelcomeNotification = async (userId: number, roleName: string) => {
  const titlesByRole: { [key: string]: string } = {
    'alumno': '¡Bienvenido/a al Sistema DEOS!',
    'profesor': '¡Bienvenido/a al Portal de Profesores!',
    'preceptor': '¡Bienvenido/a al Portal de Preceptores!',
    'admin': '¡Bienvenido/a al Panel de Administración!'
  };

  const messagesByRole: { [key: string]: string } = {
    'alumno': 'Tu cuenta ha sido creada exitosamente. Desde aquí podrás ver tu asistencia, horarios y notas.',
    'profesor': 'Tu cuenta de profesor ha sido activada. Desde aquí podrás gestionar tus clases y ver el rendimiento de tus alumnos.',
    'preceptor': 'Tu cuenta de preceptor ha sido activada. Desde aquí podrás gestionar la asistencia y disciplina de los estudiantes.',
    'admin': 'Tu cuenta de administrador ha sido activada. Desde aquí podrás gestionar todo el sistema educativo.'
  };

  return await createNotification({
    usuario_id: userId,
    titulo: titlesByRole[roleName] || '¡Bienvenido/a al Sistema!',
    mensaje: messagesByRole[roleName] || 'Tu cuenta ha sido creada exitosamente.',
    tipo: 'success',
    metadata: {
      tipo_notificacion: 'bienvenida',
      rol: roleName
    }
  });
};

// Notificación de ausencia de huella dactilar
export const createMissingFingerprintNotification = async (userId: number) => {
  return await createNotification({
    usuario_id: userId,
    titulo: 'Registro de Huella Dactilar Pendiente',
    mensaje: 'Para utilizar el sistema de fichaje biométrico, necesitas registrar tu huella dactilar. Acércate al administrador para completar este proceso.',
    tipo: 'warning',
    accion_url: '/biometric/register',
    metadata: {
      tipo_notificacion: 'huella_faltante',
      urgencia: 'alta'
    }
  });
};

// Notificación de error en dispositivo
export const createDeviceErrorNotification = async (deviceName: string, errorMessage: string) => {
  // Enviar a todos los administradores
  const { sequelize } = require('../models/db');
  
  const [admins] = await sequelize.query(`
    SELECT u.id
    FROM usuario u
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE r.nombre = 'admin' AND u.activo = 1
  `);

  const adminIds = (admins as any[]).map(admin => admin.id);

  return await createBulkNotification(adminIds, {
    titulo: `Error en Dispositivo: ${deviceName}`,
    mensaje: `Se ha detectado un error en el dispositivo ${deviceName}: ${errorMessage}. Se requiere atención inmediata.`,
    tipo: 'error',
    accion_url: '/admin/devices',
    metadata: {
      tipo_notificacion: 'error_dispositivo',
      dispositivo: deviceName,
      error: errorMessage,
      timestamp: new Date()
    }
  });
};

// Notificación de ausencia excesiva
export const createExcessiveAbsenceNotification = async (studentId: number, absenceCount: number, period: string) => {
  return await createNotification({
    usuario_id: studentId,
    titulo: 'Alerta de Ausencias',
    mensaje: `Has acumulado ${absenceCount} ausencias en ${period}. Es importante mantener una buena asistencia para tu rendimiento académico.`,
    tipo: 'warning',
    metadata: {
      tipo_notificacion: 'ausencias_excesivas',
      cantidad_ausencias: absenceCount,
      periodo: period
    }
  });
};