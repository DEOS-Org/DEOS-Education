import { QueryTypes } from 'sequelize';
import { sequelize } from '../models';

interface DashboardData {
  summary: {
    total_children: number;
    pending_tasks: number;
    unread_communications: number;
    upcoming_meetings: number;
  };
  recent_activities: any[];
  urgent_notifications: any[];
  quick_stats: any;
}

interface CommunicationFilters {
  type?: string;
  read?: boolean;
  sender?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

interface NotificationFilters {
  read?: boolean;
  type?: string;
  limit: number;
  offset: number;
}

export const parentService = {
  // Obtener datos del dashboard
  async getDashboardData(parentId: number): Promise<DashboardData> {
    try {
      // Obtener hijos del padre
      const children = await sequelize.query(`
        SELECT 
          a.alumno_id,
          u.nombre AS alumno_nombre,
          u.apellido AS alumno_apellido,
          c.curso_nombre,
          d.division_nombre
        FROM alumno a
        JOIN usuario u ON a.usuario_id = u.usuario_id
        LEFT JOIN curso c ON a.curso_id = c.curso_id
        LEFT JOIN division d ON a.division_id = d.division_id
        WHERE a.padre_id = :parentId OR a.madre_id = :parentId
      `, {
        replacements: { parentId },
        type: QueryTypes.SELECT
      });

      // Resumen estadístico
      const summary = {
        total_children: children.length,
        pending_tasks: await this.getPendingTasksCount(parentId),
        unread_communications: await this.getUnreadCommunicationsCount(parentId),
        upcoming_meetings: await this.getUpcomingMeetingsCount(parentId)
      };

      // Actividades recientes
      const recent_activities = await this.getRecentActivities(parentId);

      // Notificaciones urgentes
      const urgent_notifications = await this.getUrgentNotifications(parentId);

      // Estadísticas rápidas
      const quick_stats = await this.getQuickStats(parentId);

      return {
        summary,
        recent_activities,
        urgent_notifications,
        quick_stats
      };
    } catch (error) {
      console.error('Error en getDashboardData:', error);
      throw error;
    }
  },

  // Obtener lista de hijos
  async getChildren(parentId: number): Promise<any[]> {
    try {
      const children = await sequelize.query(`
        SELECT 
          a.alumno_id,
          u.nombre AS alumno_nombre,
          u.apellido AS alumno_apellido,
          u.dni,
          u.email,
          u.telefono,
          c.curso_nombre,
          d.division_nombre,
          a.fecha_ingreso,
          a.estado AS alumno_estado
        FROM alumno a
        JOIN usuario u ON a.usuario_id = u.usuario_id
        LEFT JOIN curso c ON a.curso_id = c.curso_id
        LEFT JOIN division d ON a.division_id = d.division_id
        WHERE a.padre_id = :parentId OR a.madre_id = :parentId
        ORDER BY u.nombre, u.apellido
      `, {
        replacements: { parentId },
        type: QueryTypes.SELECT
      });

      return children;
    } catch (error) {
      console.error('Error en getChildren:', error);
      throw error;
    }
  },

  // Obtener asistencia de los hijos
  async getChildrenAttendance(parentId: number, childId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      let whereClause = 'WHERE (a.padre_id = :parentId OR a.madre_id = :parentId)';
      const replacements: any = { parentId };

      if (childId) {
        whereClause += ' AND a.alumno_id = :childId';
        replacements.childId = childId;
      }

      if (startDate) {
        whereClause += ' AND asist.fecha >= :startDate';
        replacements.startDate = startDate;
      }

      if (endDate) {
        whereClause += ' AND asist.fecha <= :endDate';
        replacements.endDate = endDate;
      }

      const attendance = await sequelize.query(`
        SELECT 
          asist.asistencia_id,
          asist.fecha,
          asist.estado,
          asist.observaciones,
          a.alumno_id,
          u.nombre AS alumno_nombre,
          u.apellido AS alumno_apellido,
          m.materia_nombre,
          prof.nombre AS profesor_nombre,
          prof.apellido AS profesor_apellido
        FROM asistencia asist
        JOIN alumno a ON asist.alumno_id = a.alumno_id
        JOIN usuario u ON a.usuario_id = u.usuario_id
        LEFT JOIN materia m ON asist.materia_id = m.materia_id
        LEFT JOIN profesor p ON asist.profesor_id = p.profesor_id
        LEFT JOIN usuario prof ON p.usuario_id = prof.usuario_id
        ${whereClause}
        ORDER BY asist.fecha DESC, u.nombre
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      return attendance;
    } catch (error) {
      console.error('Error en getChildrenAttendance:', error);
      throw error;
    }
  },

  // Obtener calificaciones de los hijos
  async getChildrenGrades(parentId: number, childId?: string, subject?: string, trimester?: string): Promise<any[]> {
    try {
      let whereClause = 'WHERE (a.padre_id = :parentId OR a.madre_id = :parentId)';
      const replacements: any = { parentId };

      if (childId) {
        whereClause += ' AND a.alumno_id = :childId';
        replacements.childId = childId;
      }

      if (subject) {
        whereClause += ' AND m.materia_nombre = :subject';
        replacements.subject = subject;
      }

      if (trimester) {
        whereClause += ' AND cal.trimestre = :trimester';
        replacements.trimester = trimester;
      }

      const grades = await sequelize.query(`
        SELECT 
          cal.calificacion_id,
          cal.nota,
          cal.tipo_evaluacion,
          cal.fecha,
          cal.trimestre,
          cal.observaciones,
          a.alumno_id,
          u.nombre AS alumno_nombre,
          u.apellido AS alumno_apellido,
          m.materia_nombre,
          prof.nombre AS profesor_nombre,
          prof.apellido AS profesor_apellido
        FROM calificacion cal
        JOIN alumno a ON cal.alumno_id = a.alumno_id
        JOIN usuario u ON a.usuario_id = u.usuario_id
        LEFT JOIN materia m ON cal.materia_id = m.materia_id
        LEFT JOIN profesor p ON cal.profesor_id = p.profesor_id
        LEFT JOIN usuario prof ON p.usuario_id = prof.usuario_id
        ${whereClause}
        ORDER BY cal.fecha DESC, m.materia_nombre
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      return grades;
    } catch (error) {
      console.error('Error en getChildrenGrades:', error);
      throw error;
    }
  },

  // Obtener tareas y asignaciones de los hijos
  async getChildrenAssignments(parentId: number, childId?: string, status?: string, subject?: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      // Esta función requeriría una tabla de tareas/asignaciones
      // Por ahora retornamos datos mock que coincidan con el frontend
      const mockAssignments = [
        {
          id: 1,
          titulo: 'Ensayo sobre Revolución Industrial',
          descripcion: 'Escribir un ensayo de 1000 palabras sobre las causas y consecuencias de la Revolución Industrial.',
          materia: 'Historia',
          profesor: 'Prof. López',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          fecha_asignacion: '2024-11-20',
          fecha_vencimiento: '2024-12-08',
          estado: 'pendiente',
          progreso: 0
        }
      ];

      return mockAssignments;
    } catch (error) {
      console.error('Error en getChildrenAssignments:', error);
      throw error;
    }
  },

  // Obtener comunicaciones
  async getCommunications(parentId: number, filters: CommunicationFilters): Promise<any> {
    try {
      // Esta función requeriría tablas de comunicaciones/mensajes
      // Por ahora retornamos datos mock
      const mockCommunications = {
        data: [
          {
            id: 1,
            subject: 'Reunión de Padres - Próxima Semana',
            content: 'Estimados padres, los invitamos a la reunión de padres...',
            sender: { name: 'Dra. López Silva', role: 'Directora Académica' },
            timestamp: new Date(),
            isRead: false,
            type: 'announcement',
            priority: 'high'
          }
        ],
        total: 1,
        page: Math.floor(filters.offset / filters.limit),
        totalPages: 1
      };

      return mockCommunications;
    } catch (error) {
      console.error('Error en getCommunications:', error);
      throw error;
    }
  },

  // Marcar comunicación como leída
  async markCommunicationRead(parentId: number, communicationId: number): Promise<void> {
    try {
      // Implementar lógica para marcar como leída
      console.log(`Marcando comunicación ${communicationId} como leída para padre ${parentId}`);
    } catch (error) {
      console.error('Error en markCommunicationRead:', error);
      throw error;
    }
  },

  // Obtener reuniones
  async getMeetings(parentId: number, childId?: string, status?: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      // Mock data para reuniones
      const mockMeetings = [
        {
          id: 1,
          title: 'Reunión académica - Juan Carlos',
          date: '2024-12-15',
          time: '14:00',
          teacher_name: 'Prof. García',
          student_name: 'Juan Carlos Pérez González',
          status: 'scheduled',
          meeting_type: 'in-person'
        }
      ];

      return mockMeetings;
    } catch (error) {
      console.error('Error en getMeetings:', error);
      throw error;
    }
  },

  // Programar reunión
  async scheduleMeeting(parentId: number, meetingData: any): Promise<any> {
    try {
      // Implementar lógica para programar reunión
      const newMeeting = {
        id: Date.now(),
        ...meetingData,
        parent_id: parentId,
        status: 'scheduled',
        created_at: new Date()
      };

      return newMeeting;
    } catch (error) {
      console.error('Error en scheduleMeeting:', error);
      throw error;
    }
  },

  // Obtener reportes familiares
  async getFamilyReports(parentId: number, reportType?: string, childId?: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      // Mock data para reportes
      const mockReports = {
        attendance_summary: {
          total_days: 100,
          present_days: 95,
          absent_days: 5,
          attendance_rate: 95
        },
        grade_summary: {
          average_grade: 8.5,
          subjects: [
            { subject: 'Matemática', average: 9.0 },
            { subject: 'Lengua', average: 8.5 },
            { subject: 'Historia', average: 8.0 }
          ]
        }
      };

      return mockReports;
    } catch (error) {
      console.error('Error en getFamilyReports:', error);
      throw error;
    }
  },

  // Obtener notificaciones
  async getNotifications(parentId: number, filters: NotificationFilters): Promise<any> {
    try {
      const whereClause = 'WHERE n.usuario_id = :parentId';
      const replacements: any = { parentId };

      if (filters.read !== undefined) {
        // whereClause += ' AND n.leido = :read';
        // replacements.read = filters.read;
      }

      const notifications = await sequelize.query(`
        SELECT 
          n.notificacion_id,
          n.titulo,
          n.mensaje,
          n.tipo,
          n.fecha_creacion,
          n.leido,
          n.importante
        FROM notificacion n
        ${whereClause}
        ORDER BY n.fecha_creacion DESC
        LIMIT :limit OFFSET :offset
      `, {
        replacements: {
          ...replacements,
          limit: filters.limit,
          offset: filters.offset
        },
        type: QueryTypes.SELECT
      });

      return {
        data: notifications,
        total: notifications.length
      };
    } catch (error) {
      console.error('Error en getNotifications:', error);
      throw error;
    }
  },

  // Marcar notificación como leída
  async markNotificationRead(parentId: number, notificationId: number): Promise<void> {
    try {
      await sequelize.query(`
        UPDATE notificacion 
        SET leido = true 
        WHERE notificacion_id = :notificationId AND usuario_id = :parentId
      `, {
        replacements: { notificationId, parentId },
        type: QueryTypes.UPDATE
      });
    } catch (error) {
      console.error('Error en markNotificationRead:', error);
      throw error;
    }
  },

  // Obtener configuración del padre
  async getSettings(parentId: number): Promise<any> {
    try {
      const settings = await sequelize.query(`
        SELECT 
          configuracion_json
        FROM configuracion_sistema 
        WHERE usuario_id = :parentId
      `, {
        replacements: { parentId },
        type: QueryTypes.SELECT
      });

      if (settings.length > 0) {
        return JSON.parse((settings[0] as any).configuracion_json);
      }

      // Configuración por defecto
      return {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        communication_preferences: {
          language: 'es',
          frequency: 'daily'
        },
        privacy: {
          show_profile: true,
          allow_messages: true
        }
      };
    } catch (error) {
      console.error('Error en getSettings:', error);
      throw error;
    }
  },

  // Actualizar configuración del padre
  async updateSettings(parentId: number, settingsData: any): Promise<any> {
    try {
      await sequelize.query(`
        INSERT INTO configuracion_sistema (usuario_id, configuracion_json, fecha_actualizacion)
        VALUES (:parentId, :settings, NOW())
        ON DUPLICATE KEY UPDATE 
        configuracion_json = :settings,
        fecha_actualizacion = NOW()
      `, {
        replacements: {
          parentId,
          settings: JSON.stringify(settingsData)
        },
        type: QueryTypes.UPSERT
      });

      return settingsData;
    } catch (error) {
      console.error('Error en updateSettings:', error);
      throw error;
    }
  },

  // Métodos auxiliares privados
  async getPendingTasksCount(parentId: number): Promise<number> {
    // Mock data - en producción consultar tabla de tareas
    return 5;
  },

  async getUnreadCommunicationsCount(parentId: number): Promise<number> {
    // Mock data - en producción consultar tabla de comunicaciones
    return 3;
  },

  async getUpcomingMeetingsCount(parentId: number): Promise<number> {
    // Mock data - en producción consultar tabla de reuniones
    return 2;
  },

  async getRecentActivities(parentId: number): Promise<any[]> {
    return [
      {
        type: 'grade',
        message: 'Nueva calificación en Matemática',
        date: new Date(),
        child: 'Juan Carlos'
      },
      {
        type: 'attendance',
        message: 'Falta registrada en Educación Física',
        date: new Date(),
        child: 'María Elena'
      }
    ];
  },

  async getUrgentNotifications(parentId: number): Promise<any[]> {
    return [
      {
        id: 1,
        title: 'Reunión de Padres',
        message: 'Recordatorio: Reunión mañana a las 18:00',
        type: 'meeting',
        urgent: true
      }
    ];
  },

  async getQuickStats(parentId: number): Promise<any> {
    return {
      attendance_rate: 95,
      average_grade: 8.5,
      pending_tasks: 5,
      upcoming_events: 3
    };
  }
};