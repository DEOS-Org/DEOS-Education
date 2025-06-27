import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as parentService from '../services/parentService';

export class ParentController {
  // Dashboard
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const dashboardData = await parentService.getDashboard(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error('Error in getDashboard:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Gestión de hijos
  async getChildren(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const children = await parentService.getChildren(userId);
      res.json(children);
    } catch (error) {
      console.error('Error in getChildren:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async getChildrenAttendance(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { childId, startDate, endDate } = req.query;
      const attendance = await parentService.getChildrenAttendance(
        userId,
        childId as string,
        startDate as string,
        endDate as string
      );
      res.json(attendance);
    } catch (error) {
      console.error('Error in getChildrenAttendance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async getChildrenGrades(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { childId, subject, trimester } = req.query;
      const grades = await parentService.getChildrenGrades(
        userId,
        childId as string,
        subject as string,
        trimester as string
      );
      res.json(grades);
    } catch (error) {
      console.error('Error in getChildrenGrades:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async getChildrenAssignments(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { childId, status, subject, startDate, endDate } = req.query;
      const assignments = await parentService.getChildrenAssignments(
        userId,
        childId as string,
        status as string,
        subject as string,
        startDate as string,
        endDate as string
      );
      res.json(assignments);
    } catch (error) {
      console.error('Error in getChildrenAssignments:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Comunicaciones
  async getCommunications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { type, read, sender, startDate, endDate, limit = 10, offset = 0 } = req.query;
      const communications = await parentService.getCommunications(
        userId,
        type as string,
        read === 'true',
        sender as string,
        startDate as string,
        endDate as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(communications);
    } catch (error) {
      console.error('Error in getCommunications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async markCommunicationRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { communicationId } = req.params;
      await parentService.markCommunicationRead(userId, parseInt(communicationId));
      res.json({ success: true });
    } catch (error) {
      console.error('Error in markCommunicationRead:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { recipientId, subject, message, childId } = req.body;
      const result = await parentService.sendMessage(
        userId,
        recipientId,
        subject,
        message,
        childId
      );
      res.json(result);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reuniones
  async getMeetings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { childId, status, startDate, endDate } = req.query;
      const meetings = await parentService.getMeetings(
        userId,
        childId as string,
        status as string,
        startDate as string,
        endDate as string
      );
      res.json(meetings);
    } catch (error) {
      console.error('Error in getMeetings:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async scheduleMeeting(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const meetingData = req.body;
      const meeting = await parentService.scheduleMeeting(userId, meetingData);
      res.json(meeting);
    } catch (error) {
      console.error('Error in scheduleMeeting:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Notificaciones
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { read, type, limit = 10, offset = 0 } = req.query;
      const notifications = await parentService.getNotifications(
        userId,
        read === 'true',
        type as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(notifications);
    } catch (error) {
      console.error('Error in getNotifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async markNotificationRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { notificationId } = req.params;
      await parentService.markNotificationRead(userId, parseInt(notificationId));
      res.json({ success: true });
    } catch (error) {
      console.error('Error in markNotificationRead:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reportes
  async getFamilyReports(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { reportType, childId, startDate, endDate } = req.query;
      const reports = await parentService.getFamilyReports(
        userId,
        reportType as string,
        childId as string,
        startDate as string,
        endDate as string
      );
      res.json(reports);
    } catch (error) {
      console.error('Error in getFamilyReports:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Configuración
  async getSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const settings = await parentService.getSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('Error in getSettings:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const settingsData = req.body;
      const settings = await parentService.updateSettings(userId, settingsData);
      res.json(settings);
    } catch (error) {
      console.error('Error in updateSettings:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Profesores de los hijos
  async getChildrenTeachers(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { childId } = req.query;
      const teachers = await parentService.getChildrenTeachers(userId, childId as string);
      res.json(teachers);
    } catch (error) {
      console.error('Error in getChildrenTeachers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

// ===== NUEVOS ENDPOINTS PARA CALIFICACIONES AVANZADAS =====

export const getHijos = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const hijos = await parentService.obtenerHijos(parentId);
  res.json(hijos);
});

export const getCalificacionesHijo = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { hijoId } = req.params;
  const { materiaId, trimestre } = req.query;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const calificaciones = await parentService.obtenerCalificacionesHijo(
    parentId,
    Number(hijoId),
    materiaId ? Number(materiaId) : undefined,
    trimestre ? Number(trimestre) : undefined
  );

  res.json(calificaciones);
});

export const getBoletinHijo = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { hijoId } = req.params;
  const { trimestre } = req.query;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const boletin = await parentService.obtenerBoletinHijo(
    parentId,
    Number(hijoId),
    trimestre ? Number(trimestre) : undefined
  );

  res.json(boletin);
});

export const getEstadisticasHijo = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;
  const { hijoId } = req.params;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const estadisticas = await parentService.obtenerEstadisticasHijo(parentId, Number(hijoId));
  res.json(estadisticas);
});

export const getResumenAcademicoHijos = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const resumen = await parentService.obtenerResumenAcademicoHijos(parentId);
  res.json(resumen);
});

export const getComparativaHermanos = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const comparativa = await parentService.obtenerComparativaHermanos(parentId);
  res.json(comparativa);
});

export const getNotificacionesAcademicas = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.user?.id;

  if (!parentId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const notificaciones = await parentService.obtenerNotificacionesAcademicas(parentId);
  res.json(notificaciones);
});

export const parentController = new ParentController();