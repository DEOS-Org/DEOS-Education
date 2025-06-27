import { Op } from 'sequelize';
import { AppError } from '../utils/AppError';
import Notificacion, { NotificacionInstance } from '../models/Notificacion';
import Usuario from '../models/Usuario';
import * as emailService from './emailService';

export interface CreateNotificationData {
  usuario_id?: number | null;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  accion_url?: string | null;
  metadata?: any | null;
}

export interface NotificationFilters {
  page: number;
  limit: number;
  tipo?: string;
  usuario_id?: number;
}

// ===== USER NOTIFICATIONS =====
export const getUserNotifications = async (
  userId: number,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
) => {
  const offset = (page - 1) * limit;
  
  const whereClause: any = {
    [Op.or]: [
      { usuario_id: userId },
      { usuario_id: null } // notificaciones globales
    ]
  };
  
  if (unreadOnly) {
    whereClause.leida = false;
  }
  
  const { rows: notifications, count } = await Notificacion.findAndCountAll({
    where: whereClause,
    order: [['fecha_creacion', 'DESC']],
    limit,
    offset,
    include: [{
      model: Usuario,
      as: 'Usuario',
      attributes: ['nombre', 'apellido'],
      required: false
    }]
  });
  
  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: limit
    }
  };
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  return await Notificacion.count({
    where: {
      [Op.or]: [
        { usuario_id: userId },
        { usuario_id: null }
      ],
      leida: false
    }
  });
};

// ===== MARK AS READ =====
export const markAsRead = async (notificationId: number, userId: number) => {
  const notification = await Notificacion.findOne({
    where: {
      id: notificationId,
      [Op.or]: [
        { usuario_id: userId },
        { usuario_id: null }
      ]
    }
  });
  
  if (!notification) {
    throw new AppError('Notificación no encontrada', 404);
  }
  
  if (!notification.leida) {
    await notification.update({
      leida: true,
      fecha_leida: new Date()
    });
  }
  
  return notification;
};

export const markAllAsRead = async (userId: number) => {
  await Notificacion.update(
    {
      leida: true,
      fecha_leida: new Date()
    },
    {
      where: {
        [Op.or]: [
          { usuario_id: userId },
          { usuario_id: null }
        ],
        leida: false
      }
    }
  );
};

// ===== CREATE NOTIFICATIONS =====
export const createNotification = async (
  data: CreateNotificationData,
  sendEmail: boolean = false
): Promise<NotificacionInstance> => {
  const notification = await Notificacion.create(data);
  
  // Enviar email si se solicita
  if (sendEmail && data.usuario_id) {
    try {
      const usuario = await Usuario.findByPk(data.usuario_id);
      if (usuario && usuario.email) {
        await emailService.sendNotificationEmail(
          usuario.email,
          usuario.nombre + ' ' + usuario.apellido,
          data.titulo,
          data.mensaje,
          data.accion_url
        );
      }
    } catch (error) {
      console.error('Error enviando email de notificación:', error);
      // No lanzar error para no afectar la creación de la notificación
    }
  }
  
  return notification;
};

export const createGlobalNotification = async (
  data: Omit<CreateNotificationData, 'usuario_id'>,
  roles: string[] = [],
  sendEmail: boolean = false
): Promise<NotificacionInstance[]> => {
  const notifications: NotificacionInstance[] = [];
  
  if (roles.length === 0) {
    // Notificación global para todos
    const globalNotification = await Notificacion.create({
      ...data,
      usuario_id: null
    });
    notifications.push(globalNotification);
    
    // Enviar emails a todos los usuarios si se solicita
    if (sendEmail) {
      emailService.sendGlobalNotificationEmail(
        data.titulo,
        data.mensaje,
        data.accion_url,
        roles
      ).catch(error => {
        console.error('Error enviando emails globales:', error);
      });
    }
  } else {
    // Crear notificaciones específicas por rol
    const usuarios = await Usuario.findAll({
      include: [{
        model: require('../models/Rol').default,
        where: { nombre: { [Op.in]: roles } }
      }]
    });
    
    for (const usuario of usuarios) {
      const notification = await Notificacion.create({
        ...data,
        usuario_id: usuario.id
      });
      notifications.push(notification);
      
      // Enviar email individual si se solicita
      if (sendEmail && usuario.email) {
        emailService.sendNotificationEmail(
          usuario.email,
          usuario.nombre + ' ' + usuario.apellido,
          data.titulo,
          data.mensaje,
          data.accion_url
        ).catch(error => {
          console.error(`Error enviando email a ${usuario.email}:`, error);
        });
      }
    }
  }
  
  return notifications;
};

// ===== DELETE NOTIFICATION =====
export const deleteNotification = async (notificationId: number, userId: number) => {
  const deleted = await Notificacion.destroy({
    where: {
      id: notificationId,
      usuario_id: userId // Solo puede eliminar sus propias notificaciones
    }
  });
  
  if (deleted === 0) {
    throw new AppError('Notificación no encontrada o no tienes permisos', 404);
  }
};

// ===== ADMIN FUNCTIONS =====
export const getAllNotifications = async (filters: NotificationFilters) => {
  const { page, limit, tipo, usuario_id } = filters;
  const offset = (page - 1) * limit;
  
  const whereClause: any = {};
  
  if (tipo) {
    whereClause.tipo = tipo;
  }
  
  if (usuario_id) {
    whereClause.usuario_id = usuario_id;
  }
  
  const { rows: notifications, count } = await Notificacion.findAndCountAll({
    where: whereClause,
    order: [['fecha_creacion', 'DESC']],
    limit,
    offset,
    include: [{
      model: Usuario,
      as: 'Usuario',
      attributes: ['id', 'nombre', 'apellido', 'email'],
      required: false
    }]
  });
  
  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: limit
    }
  };
};

export const getNotificationStats = async () => {
  const { sequelize } = require('../models/db');
  
  const [stats] = await sequelize.query(`
    SELECT 
      COUNT(*) as total_notifications,
      COUNT(CASE WHEN leida = 0 THEN 1 END) as unread_notifications,
      COUNT(CASE WHEN tipo = 'info' THEN 1 END) as info_notifications,
      COUNT(CASE WHEN tipo = 'warning' THEN 1 END) as warning_notifications,
      COUNT(CASE WHEN tipo = 'error' THEN 1 END) as error_notifications,
      COUNT(CASE WHEN tipo = 'success' THEN 1 END) as success_notifications,
      COUNT(CASE WHEN usuario_id IS NULL THEN 1 END) as global_notifications,
      DATE(fecha_creacion) as date,
      COUNT(*) as daily_count
    FROM notificaciones 
    WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(fecha_creacion)
    ORDER BY date DESC
  `);
  
  const [summary] = await sequelize.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN leida = 0 THEN 1 END) as unread,
      COUNT(CASE WHEN usuario_id IS NULL THEN 1 END) as global_count,
      AVG(CASE WHEN leida = 1 THEN TIMESTAMPDIFF(MINUTE, fecha_creacion, fecha_leida) END) as avg_read_time_minutes
    FROM notificaciones
  `);
  
  return {
    summary: summary[0],
    daily_stats: stats
  };
};

// ===== AUTOMATIC NOTIFICATIONS =====
export const createAbsenceNotification = async (
  studentId: number,
  className: string,
  date: string,
  parentIds: number[] = []
) => {
  const student = await Usuario.findByPk(studentId);
  if (!student) return;
  
  const notificationData = {
    titulo: `Ausencia registrada - ${student.nombre} ${student.apellido}`,
    mensaje: `Se ha registrado una ausencia de ${student.nombre} ${student.apellido} en la clase de ${className} el día ${date}.`,
    tipo: 'warning' as const,
    metadata: {
      type: 'absence',
      student_id: studentId,
      class_name: className,
      date: date
    }
  };
  
  // Notificar a los padres
  for (const parentId of parentIds) {
    await createNotification({
      ...notificationData,
      usuario_id: parentId
    }, true);
  }
  
  // Notificar al preceptor (si existe)
  const preceptores = await Usuario.findAll({
    include: [{
      model: require('../models/Rol').default,
      where: { nombre: 'preceptor' }
    }]
  });
  
  for (const preceptor of preceptores) {
    await createNotification({
      ...notificationData,
      usuario_id: preceptor.id
    });
  }
};

export const createGradeNotification = async (
  studentId: number,
  subjectName: string,
  grade: number,
  parentIds: number[] = []
) => {
  const student = await Usuario.findByPk(studentId);
  if (!student) return;
  
  const notificationData = {
    titulo: `Nueva calificación - ${student.nombre} ${student.apellido}`,
    mensaje: `${student.nombre} ${student.apellido} ha recibido una calificación de ${grade} en ${subjectName}.`,
    tipo: grade >= 7 ? 'success' as const : grade >= 4 ? 'info' as const : 'warning' as const,
    metadata: {
      type: 'grade',
      student_id: studentId,
      subject_name: subjectName,
      grade: grade
    }
  };
  
  // Notificar al estudiante
  await createNotification({
    ...notificationData,
    usuario_id: studentId
  });
  
  // Notificar a los padres
  for (const parentId of parentIds) {
    await createNotification({
      ...notificationData,
      usuario_id: parentId
    }, true);
  }
};

export const createAnnouncementNotification = async (
  title: string,
  message: string,
  roles: string[] = [],
  actionUrl?: string
) => {
  await createGlobalNotification({
    titulo: title,
    mensaje: message,
    tipo: 'info',
    accion_url: actionUrl
  }, roles, true);
};