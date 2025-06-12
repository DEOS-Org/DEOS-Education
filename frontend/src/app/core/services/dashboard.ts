import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { UserService } from './user';
// import { BiometricService } from './biometric';
// import { DeviceService } from './device';

export interface DashboardStats {
  usuarios: {
    total: number;
    por_rol: {
      alumnos: number;
      profesores: number;
      padres: number;
      administradores: number;
      preceptores: number;
      directivos: number;
    };
  };
  academico: {
    total_cursos: number;
    total_divisiones: number;
    total_curso_divisiones: number;
    estudiantes_por_curso: Array<{
      curso: string;
      division: string;
      estudiantes: number;
    }>;
  };
  biometrico: {
    total_huellas_registradas: number;
    total_dispositivos: number;
    dispositivos_activos: number;
    registros_hoy: number;
    registros_esta_semana: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(
    private http: HttpClient,
    private userService: UserService
    // private biometricService: BiometricService,
    // private deviceService: DeviceService
  ) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`).pipe(
      catchError(error => {
        console.error('Error getting dashboard stats:', error);
        // Return default stats if API fails
        return of({
          usuarios: {
            total: 0,
            por_rol: {
              alumnos: 0,
              profesores: 0,
              padres: 0,
              administradores: 0,
              preceptores: 0,
              directivos: 0
            }
          },
          academico: {
            total_cursos: 0,
            total_divisiones: 0,
            total_curso_divisiones: 0,
            estudiantes_por_curso: []
          },
          biometrico: {
            total_huellas_registradas: 0,
            total_dispositivos: 0,
            dispositivos_activos: 0,
            registros_hoy: 0,
            registros_esta_semana: 0
          }
        });
      })
    );
  }

  getUserCountByRole(role: string): Observable<number> {
    return this.http.get<{role: string, count: number}>(`${this.apiUrl}/dashboard/users/count/${role}`).pipe(
      map(response => response.count),
      catchError(() => of(0))
    );
  }

  getStudentCountByCourse(cursoId?: number, divisionId?: number): Observable<number> {
    const params: any = {};
    if (cursoId) params.cursoId = cursoId.toString();
    if (divisionId) params.divisionId = divisionId.toString();

    return this.http.get<{count: number}>(`${this.apiUrl}/dashboard/students/count`, { params }).pipe(
      map(response => response.count),
      catchError(() => of(0))
    );
  }

  private getTodayRecords(): Observable<any[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.http.get<any>(`${this.apiUrl}/biometric/records`, {
      params: {
        fecha_desde: startOfDay.toISOString(),
        fecha_hasta: endOfDay.toISOString()
      }
    }).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  private calculateAverageAttendance(students: any[], todayRecords: any[]): string {
    if (students.length === 0) return '0%';
    
    const uniqueStudentIds = new Set(
      todayRecords
        .filter(r => r.tipo === 'ingreso')
        .map(r => r.usuario_id)
    );
    
    const attendanceRate = (uniqueStudentIds.size / students.length) * 100;
    return `${Math.round(attendanceRate)}%`;
  }

  getAttendanceStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/attendance/stats`).pipe(
      catchError(error => {
        console.error('Error getting attendance stats:', error);
        return of({
          stats: {
            totalPresentes: 0,
            totalAusentes: 0,
            totalTarde: 0,
            porcentajeAsistencia: 0,
            trendPresentes: 0,
            trendAusentes: 0,
            promedioTardanzas: 0
          },
          weeklyData: []
        });
      })
    );
  }
}