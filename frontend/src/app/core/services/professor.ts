import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  estadisticas: {
    totalClases: number;
    totalEstudiantes: number;
    totalCalificaciones: number;
    porcentajeAsistencia: number;
  };
  clasesRecientes: any[];
  actividadReciente: any[];
}

export interface Subject {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface ProfessorClass {
  id: number;
  materia: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  curso: {
    id: number;
    nombre: string;
    nivel: string;
  };
  division: {
    id: number;
    nombre: string;
  };
}

export interface Student {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  numero_documento: string;
  promedio?: number;
  clases?: string[];
}

export interface ScheduleItem {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  materia: string;
  curso: string;
  division: string;
  cursoDivisionMateriaId: number;
}

export interface JustifyAbsenceData {
  asistenciaId: number;
  observaciones: string;
}

export interface ClassAttendance {
  id: number;
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    numero_documento: string;
  };
  estado: string;
  observaciones: string;
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  horaEntradaAlmuerzo?: string;
  horaSalidaAlmuerzo?: string;
  calculadoAutomaticamente: boolean;
}

export interface GradeData {
  usuarioId: number;
  cursoDivisionMateriaId: number;
  tipoEvaluacion: 'examen' | 'tarea' | 'proyecto' | 'participacion' | 'quiz' | 'exposicion';
  descripcion: string;
  calificacion: number;
  calificacionMaxima: number;
  fechaEvaluacion: string;
  fechaEntrega?: string;
  observaciones?: string;
  trimestre: number;
}

export interface ClassGrade {
  id: number;
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    numero_documento: string;
  };
  tipoEvaluacion: string;
  descripcion: string;
  calificacion: number;
  calificacionMaxima: number;
  fechaEvaluacion: string;
  fechaEntrega?: string;
  observaciones?: string;
  trimestre: number;
}

export interface AttendanceReportItem {
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    numero_documento: string;
  };
  presente: number;
  ausente: number;
  tardanza: number;
  justificado: number;
  total: number;
}

export interface GradeReportItem {
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    numero_documento: string;
  };
  calificaciones: Array<{
    id: number;
    tipoEvaluacion: string;
    descripcion: string;
    calificacion: number;
    calificacionMaxima: number;
    porcentaje: number;
    fechaEvaluacion: string;
    trimestre: number;
  }>;
  promedio: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfessorService {
  private apiUrl = `${environment.apiUrl}/professor`;

  constructor(private http: HttpClient) {}

  // ===== DASHBOARD =====
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`).pipe(
      catchError(() => of(this.getMockDashboard()))
    );
  }

  // Materias y clases
  getSubjects(): Observable<any> {
    return this.http.get(`${this.apiUrl}/subjects`);
  }

  getClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes`);
  }

  getClassStudents(classId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/${classId}/students`);
  }

  getAllStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students`);
  }

  // Horario
  getSchedule(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedule`);
  }

  // Asistencia
  justifyAbsence(data: JustifyAbsenceData): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/justify`, data);
  }

  getClassAttendance(classId: number, fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/${classId}/attendance`, {
      params: { fecha }
    });
  }

  // Calificaciones
  recordGrade(data: GradeData): Observable<any> {
    return this.http.post(`${this.apiUrl}/grades`, data);
  }

  getClassGrades(classId: number, trimestre?: number): Observable<any> {
    const params: any = {};
    if (trimestre) {
      params.trimestre = trimestre.toString();
    }
    return this.http.get(`${this.apiUrl}/classes/${classId}/grades`, { params });
  }

  updateGrade(gradeId: number, data: Partial<GradeData>): Observable<any> {
    return this.http.put(`${this.apiUrl}/grades/${gradeId}`, data);
  }

  deleteGrade(gradeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/grades/${gradeId}`);
  }

  // Reportes
  getAttendanceReport(classId: number, fechaInicio: string, fechaFin: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/${classId}/attendance-report`, {
      params: { fechaInicio, fechaFin }
    });
  }

  getGradesReport(classId: number, trimestre?: number): Observable<any> {
    const params: any = {};
    if (trimestre) {
      params.trimestre = trimestre.toString();
    }
    return this.http.get(`${this.apiUrl}/classes/${classId}/grades-report`, { params });
  }

  // ===== DATOS MOCK PARA DESARROLLO =====
  private getMockDashboard(): DashboardData {
    return {
      estadisticas: {
        totalClases: 5,
        totalEstudiantes: 125,
        totalCalificaciones: 340,
        porcentajeAsistencia: 87
      },
      clasesRecientes: [
        {
          id: 1,
          materia: 'Matemática',
          curso_division: '3° A',
          dia: 'lunes',
          hora_inicio: '08:00',
          hora_fin: '09:30',
          aula: 'A101'
        },
        {
          id: 2,
          materia: 'Física',
          curso_division: '4° B',
          dia: 'martes',
          hora_inicio: '10:00',
          hora_fin: '11:30',
          aula: 'Lab1'
        }
      ],
      actividadReciente: [
        {
          tipo: 'calificacion',
          estudiante: 'Juan Pérez',
          materia: 'Matemática',
          detalle: '8',
          fecha: '2024-01-15'
        },
        {
          tipo: 'asistencia',
          estudiante: 'María García',
          materia: 'Asistencia',
          detalle: 'presente',
          fecha: '2024-01-15'
        }
      ]
    };
  }
}