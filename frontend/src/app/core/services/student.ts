import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentDashboard {
  student: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    curso: string;
    division: string;
  };
  attendance: {
    presenteHoy: boolean;
    porcentajeSemanal: number;
    diasPresenteSemana: number;
    diasClaseSemana: number;
  };
  todayClasses: any[];
  recentGrades: any[];
  upcomingAssignments: any[];
}

export interface AttendanceRecord {
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  estado: string;
}

export interface AttendanceStats {
  mensual: {
    diasPresente: number;
    diasClase: number;
    porcentaje: number;
  };
  anual: {
    diasPresente: number;
    diasClase: number;
    porcentaje: number;
  };
}

export interface Schedule {
  [key: string]: any[];
}

export interface Subject {
  id: number;
  nombre: string;
  carga_horaria: number;
  profesor_nombre?: string;
  profesor_apellido?: string;
  profesor_email?: string;
  horas_semanales: number;
}

export interface Grade {
  id: number;
  nota: number;
  fecha: string;
  descripcion: string;
  materia_nombre: string;
  tipo_evaluacion: string;
}

export interface GradesSummary {
  promedioGeneral: number;
  materias: {
    materia_nombre: string;
    promedio: number;
    total_notas: number;
    nota_minima: number;
    nota_maxima: number;
  }[];
}

export interface StudentProfile {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  curso_año: string;
  division_nombre: string;
  roles: string;
}

export interface CalendarEvent {
  fecha: string;
  titulo: string;
  materia_nombre: string;
  tipo: string;
  evento_tipo: string;
}

export interface CourseInfo {
  id: number;
  año: string;
  nivel: string;
  division_nombre: string;
  total_estudiantes: number;
}

export interface Classmate {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = 'http://localhost:3001/api/student';

  constructor(private http: HttpClient) {}

  // ===== DASHBOARD =====
  getDashboard(): Observable<StudentDashboard> {
    return this.http.get<StudentDashboard>(`${this.apiUrl}/dashboard`);
  }

  // ===== ATTENDANCE =====
  getMyAttendance(fechaDesde?: string, fechaHasta?: string): Observable<AttendanceRecord[]> {
    const params: any = {};
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance`, { params });
  }

  getAttendanceStats(): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.apiUrl}/attendance/stats`);
  }

  // ===== SCHEDULE =====
  getMySchedule(): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.apiUrl}/schedule`);
  }

  getTodaySchedule(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schedule/today`);
  }

  // ===== GRADES =====
  getMyGrades(): Observable<{ [key: string]: Grade[] }> {
    return this.http.get<{ [key: string]: Grade[] }>(`${this.apiUrl}/grades`);
  }

  getGradesBySubject(materiaId: number): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.apiUrl}/grades/subject/${materiaId}`);
  }

  getGradesSummary(): Observable<GradesSummary> {
    return this.http.get<GradesSummary>(`${this.apiUrl}/grades/summary`);
  }

  // ===== SUBJECTS =====
  getMySubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`);
  }

  getSubjectDetail(materiaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subjects/${materiaId}`);
  }

  // ===== PROFILE =====
  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(profileData: Partial<StudentProfile>): Observable<StudentProfile> {
    return this.http.put<StudentProfile>(`${this.apiUrl}/profile`, profileData);
  }

  // ===== ASSIGNMENTS =====
  getMyAssignments(estado?: string, materiaId?: number): Observable<any[]> {
    const params: any = {};
    if (estado) params.estado = estado;
    if (materiaId) params.materiaId = materiaId;
    
    return this.http.get<any[]>(`${this.apiUrl}/assignments`, { params });
  }

  getAssignmentDetail(assignmentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/assignments/${assignmentId}`);
  }

  // ===== CALENDAR =====
  getCalendarEvents(fechaDesde?: string, fechaHasta?: string): Observable<CalendarEvent[]> {
    const params: any = {};
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    
    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/calendar/events`, { params });
  }

  getUpcomingEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/calendar/upcoming`);
  }

  // ===== ACADEMIC INFO =====
  getMyCourse(): Observable<CourseInfo> {
    return this.http.get<CourseInfo>(`${this.apiUrl}/course`);
  }

  getClassmates(): Observable<Classmate[]> {
    return this.http.get<Classmate[]>(`${this.apiUrl}/classmates`);
  }

  // ===== COMMUNICATIONS =====
  getComunicados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/comunicados`);
  }

  getMensajes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mensajes`);
  }

  sendMessage(messageData: { destinatario_id: number; asunto: string; mensaje: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mensajes`, messageData);
  }
}