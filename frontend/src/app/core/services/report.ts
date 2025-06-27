import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportFilters {
  fecha_desde: string;
  fecha_hasta: string;
  curso_division_id?: number;
  usuario_id?: number;
}

export interface AttendanceRecord {
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  };
  fecha: string;
  ingreso?: Date;
  egreso?: Date;
  estado: 'presente' | 'ausente' | 'tardanza' | 'incompleto';
  minutos_tardanza?: number;
}

export interface AcademicPerformanceRecord {
  estudiante: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  };
  curso: string;
  materias: Array<{
    nombre: string;
    notas: Array<{
      valor: number;
      tipo: string;
      fecha: string;
      observaciones?: string;
    }>;
    promedio: number;
  }>;
  promedio_general: number;
  total_notas: number;
}

export interface StatisticsReport {
  periodo: {
    desde: string;
    hasta: string;
  };
  asistencia: {
    conteos: {
      total_registros: number;
      presentes: number;
      ausentes: number;
      tardanzas: number;
      incompletos: number;
    };
    porcentajes: {
      asistencia: string;
      ausencias: string;
      tardanzas: string;
    };
    por_dia: { [key: string]: any };
  };
  rendimiento?: {
    total_estudiantes: number;
    promedio_general: string;
    estudiantes_sobresalientes: number;
    estudiantes_regulares: number;
    estudiantes_en_riesgo: number;
  };
  generado_en: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  // === REPORTES DE ASISTENCIA ===

  getAttendanceReport(filters: ReportFilters): Observable<{ filtros: ReportFilters; total_registros: number; datos: AttendanceRecord[] }> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/attendance`, { params });
  }

  getAttendanceSummary(filters: ReportFilters): Observable<any> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/attendance/summary`, { params });
  }

  getSubjectAttendanceReport(curso_division_materia_id: number, fecha_desde: string, fecha_hasta: string): Observable<any> {
    const params = new HttpParams()
      .set('fecha_desde', fecha_desde)
      .set('fecha_hasta', fecha_hasta);

    return this.http.get<any>(`${this.apiUrl}/attendance/subject/${curso_division_materia_id}`, { params });
  }

  // === REPORTES DE RENDIMIENTO ===

  getAcademicPerformanceReport(filters: ReportFilters): Observable<{ filtros: ReportFilters; total_estudiantes: number; datos: AcademicPerformanceRecord[] }> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/academic-performance`, { params });
  }

  // === REPORTES DE ESTADÍSTICAS ===

  getStatisticsReport(filters: ReportFilters): Observable<StatisticsReport> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get<StatisticsReport>(`${this.apiUrl}/statistics`, { params });
  }

  // === REPORTES DE PROFESORES ===

  getTeacherReport(profesor_id: number, fecha_desde: string, fecha_hasta: string): Observable<any> {
    const params = new HttpParams()
      .set('fecha_desde', fecha_desde)
      .set('fecha_hasta', fecha_hasta);

    return this.http.get<any>(`${this.apiUrl}/teacher/${profesor_id}`, { params });
  }

  // === EXPORTACIONES ===

  exportAttendanceToExcel(filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get(`${this.apiUrl}/attendance/export/excel`, { 
      params, 
      responseType: 'blob' 
    });
  }

  exportAttendanceToPDF(filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get(`${this.apiUrl}/attendance/export/pdf`, { 
      params, 
      responseType: 'blob' 
    });
  }

  exportPerformanceToExcel(filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get(`${this.apiUrl}/academic-performance/export/excel`, { 
      params, 
      responseType: 'blob' 
    });
  }

  exportPerformanceToPDF(filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('fecha_desde', filters.fecha_desde)
      .set('fecha_hasta', filters.fecha_hasta);

    if (filters.curso_division_id) {
      params = params.set('curso_division_id', filters.curso_division_id.toString());
    }
    if (filters.usuario_id) {
      params = params.set('usuario_id', filters.usuario_id.toString());
    }

    return this.http.get(`${this.apiUrl}/academic-performance/export/pdf`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // === UTILIDADES ===

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDateRange(days: number): { fecha_desde: string; fecha_hasta: string } {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(hasta.getDate() - days);

    return {
      fecha_desde: this.formatDate(desde),
      fecha_hasta: this.formatDate(hasta)
    };
  }
}
