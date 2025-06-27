import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { parentService } from '../services/parentService';
import { logUserAction } from '../services/logService';

export const parentController = {
  // Dashboard del padre
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const dashboardData = await parentService.getDashboardData(parentId);
      
      await logUserAction(
        parentId,
        'Acceso al dashboard del portal padre',
        'PORTAL_PADRE'
      );

      res.json(dashboardData);
    } catch (error) {
      console.error('Error al obtener dashboard del padre:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Lista de hijos
  async getChildren(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const children = await parentService.getChildren(parentId);
      
      res.json(children);
    } catch (error) {
      console.error('Error al obtener lista de hijos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Asistencia de los hijos
  async getChildrenAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { childId, startDate, endDate } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const attendance = await parentService.getChildrenAttendance(
        parentId,
        childId as string,
        startDate as string,
        endDate as string
      );
      
      res.json(attendance);
    } catch (error) {
      console.error('Error al obtener asistencia de hijos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Calificaciones de los hijos
  async getChildrenGrades(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { childId, subject, trimester } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const grades = await parentService.getChildrenGrades(
        parentId,
        childId as string,
        subject as string,
        trimester as string
      );
      
      res.json(grades);
    } catch (error) {
      console.error('Error al obtener calificaciones de hijos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Tareas y asignaciones de los hijos
  async getChildrenAssignments(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { childId, status, subject, startDate, endDate } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const assignments = await parentService.getChildrenAssignments(
        parentId,
        childId as string,
        status as string,
        subject as string,
        startDate as string,
        endDate as string
      );
      
      res.json(assignments);
    } catch (error) {
      console.error('Error al obtener tareas de hijos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Comunicaciones para el padre
  async getCommunications(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { type, read, sender, startDate, endDate, limit, offset } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const communications = await parentService.getCommunications(
        parentId,
        {
          type: type as string,
          read: read === 'true',
          sender: sender as string,
          startDate: startDate as string,
          endDate: endDate as string,
          limit: parseInt(limit as string) || 25,
          offset: parseInt(offset as string) || 0
        }
      );
      
      res.json(communications);
    } catch (error) {
      console.error('Error al obtener comunicaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Marcar comunicación como leída
  async markCommunicationRead(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { communicationId } = req.params;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      await parentService.markCommunicationRead(parentId, parseInt(communicationId));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error al marcar comunicación como leída:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Reuniones programadas
  async getMeetings(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { childId, status, startDate, endDate } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const meetings = await parentService.getMeetings(
        parentId,
        childId as string,
        status as string,
        startDate as string,
        endDate as string
      );
      
      res.json(meetings);
    } catch (error) {
      console.error('Error al obtener reuniones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Programar nueva reunión
  async scheduleMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const meetingData = req.body;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const meeting = await parentService.scheduleMeeting(parentId, meetingData);
      
      await logUserAction(
        parentId,
        `Reunión programada con ${meetingData.teacher_name} para ${meetingData.date}`,
        'PORTAL_PADRE'
      );
      
      res.status(201).json(meeting);
    } catch (error) {
      console.error('Error al programar reunión:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Reportes familiares
  async getFamilyReports(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { reportType, childId, startDate, endDate } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const reports = await parentService.getFamilyReports(
        parentId,
        reportType as string,
        childId as string,
        startDate as string,
        endDate as string
      );
      
      res.json(reports);
    } catch (error) {
      console.error('Error al obtener reportes familiares:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Notificaciones del padre
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { read, type, limit, offset } = req.query;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const notifications = await parentService.getNotifications(
        parentId,
        {
          read: read === 'true',
          type: type as string,
          limit: parseInt(limit as string) || 10,
          offset: parseInt(offset as string) || 0
        }
      );
      
      res.json(notifications);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Marcar notificación como leída
  async markNotificationRead(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const { notificationId } = req.params;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      await parentService.markNotificationRead(parentId, parseInt(notificationId));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Configuración del padre
  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const settings = await parentService.getSettings(parentId);
      
      res.json(settings);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar configuración del padre
  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.usuario_id;
      const settingsData = req.body;
      
      if (!parentId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const updatedSettings = await parentService.updateSettings(parentId, settingsData);
      
      await logUserAction(
        parentId,
        'Configuración del portal padre actualizada',
        'PORTAL_PADRE'
      );
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};