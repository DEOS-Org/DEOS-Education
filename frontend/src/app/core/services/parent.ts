import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardData {
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

export interface Child {
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  dni: string;
  email: string;
  telefono: string;
  curso_nombre: string;
  division_nombre: string;
  fecha_ingreso: string;
  alumno_estado: string;
}

export interface Attendance {
  asistencia_id: number;
  fecha: string;
  estado: string;
  observaciones: string;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  materia_nombre: string;
  profesor_nombre: string;
  profesor_apellido: string;
}

export interface Grade {
  calificacion_id: number;
  nota: number;
  tipo_evaluacion: string;
  fecha: string;
  trimestre: string;
  observaciones: string;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  materia_nombre: string;
  profesor_nombre: string;
  profesor_apellido: string;
}

export interface Assignment {
  id: number;
  titulo: string;
  descripcion: string;
  materia: string;
  profesor: string;
  estudiante_id: number;
  estudiante_nombre: string;
  fecha_asignacion: string;
  fecha_vencimiento: string;
  estado: string;
  progreso: number;
}

export interface Communication {
  id: number;
  subject: string;
  content: string;
  sender: {
    name: string;
    role: string;
  };
  timestamp: Date;
  isRead: boolean;
  type: string;
  priority: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  teacher_name: string;
  student_name: string;
  status: string;
  meeting_type: string;
}

export interface Notification {
  notificacion_id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fecha_creacion: string;
  leido: boolean;
  importante: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  private apiUrl = `${environment.apiUrl}/parent`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`);
  }

  // Gestión de hijos
  getChildren(): Observable<Child[]> {
    return this.http.get<Child[]>(`${this.apiUrl}/children`);
  }

  getChildrenAttendance(childId?: string, startDate?: string, endDate?: string): Observable<Attendance[]> {
    let params = new HttpParams();
    if (childId) params = params.set('childId', childId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<Attendance[]>(`${this.apiUrl}/children/attendance`, { params });
  }

  getChildrenGrades(childId?: string, subject?: string, trimester?: string): Observable<Grade[]> {
    let params = new HttpParams();
    if (childId) params = params.set('childId', childId);
    if (subject) params = params.set('subject', subject);
    if (trimester) params = params.set('trimester', trimester);

    return this.http.get<Grade[]>(`${this.apiUrl}/children/grades`, { params });
  }

  getChildrenAssignments(
    childId?: string, 
    status?: string, 
    subject?: string, 
    startDate?: string, 
    endDate?: string
  ): Observable<Assignment[]> {
    let params = new HttpParams();
    if (childId) params = params.set('childId', childId);
    if (status) params = params.set('status', status);
    if (subject) params = params.set('subject', subject);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<Assignment[]>(`${this.apiUrl}/children/assignments`, { params });
  }

  // Comunicaciones
  getCommunications(
    type?: string,
    read?: boolean,
    sender?: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number
  ): Observable<{ data: Communication[], total: number, page: number, totalPages: number }> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (read !== undefined) params = params.set('read', read.toString());
    if (sender) params = params.set('sender', sender);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (limit) params = params.set('limit', limit.toString());
    if (offset) params = params.set('offset', offset.toString());

    return this.http.get<{ data: Communication[], total: number, page: number, totalPages: number }>(
      `${this.apiUrl}/communications`,
      { params }
    );
  }

  markCommunicationRead(communicationId: number): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.apiUrl}/communications/${communicationId}/read`,
      {}
    );
  }

  // Reuniones
  getMeetings(
    childId?: string,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Observable<Meeting[]> {
    let params = new HttpParams();
    if (childId) params = params.set('childId', childId);
    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<Meeting[]>(`${this.apiUrl}/meetings`, { params });
  }

  scheduleMeeting(meetingData: any): Observable<Meeting> {
    return this.http.post<Meeting>(`${this.apiUrl}/meetings`, meetingData);
  }

  // Reportes familiares
  getFamilyReports(
    reportType?: string,
    childId?: string,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    let params = new HttpParams();
    if (reportType) params = params.set('reportType', reportType);
    if (childId) params = params.set('childId', childId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any>(`${this.apiUrl}/reports`, { params });
  }

  // Notificaciones
  getNotifications(
    read?: boolean,
    type?: string,
    limit?: number,
    offset?: number
  ): Observable<{ data: Notification[], total: number }> {
    let params = new HttpParams();
    if (read !== undefined) params = params.set('read', read.toString());
    if (type) params = params.set('type', type);
    if (limit) params = params.set('limit', limit.toString());
    if (offset) params = params.set('offset', offset.toString());

    return this.http.get<{ data: Notification[], total: number }>(
      `${this.apiUrl}/notifications`,
      { params }
    );
  }

  markNotificationRead(notificationId: number): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.apiUrl}/notifications/${notificationId}/read`,
      {}
    );
  }

  // Configuración
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings`);
  }

  updateSettings(settingsData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/settings`, settingsData);
  }

  // Métodos de utilidad
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAttendanceStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'presente': 'Presente',
      'ausente': 'Ausente',
      'tardanza': 'Tardanza',
      'justificado': 'Justificado'
    };
    return statusMap[status] || status;
  }

  getGradeColor(grade: number): string {
    if (grade >= 9) return 'success';
    if (grade >= 7) return 'primary';
    if (grade >= 6) return 'accent';
    return 'warn';
  }

  getAssignmentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en-progreso': 'En Progreso',
      'completada': 'Completada',
      'vencida': 'Vencida'
    };
    return statusMap[status] || status;
  }

  getMeetingStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'Programada',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'rescheduled': 'Reprogramada'
    };
    return statusMap[status] || status;
  }

  getCommunicationTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      'message': 'Mensaje',
      'announcement': 'Anuncio',
      'alert': 'Alerta',
      'newsletter': 'Boletín'
    };
    return typeMap[type] || type;
  }
}