import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Curso {
  id?: number;
  nombre: string;
  nivel: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Division {
  id?: number;
  nombre: string;
  curso_id: number;
  capacidad: number;
  activo: boolean;
  Curso?: Curso;
  createdAt?: string;
  updatedAt?: string;
}

export interface Materia {
  id?: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  creditos: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Horario {
  id?: number;
  curso_id: number;
  materia_id: number;
  profesor_usuario_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  activo: boolean;
  Curso?: Curso;
  Materia?: Materia;
  Profesor?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Cursos
  getCursos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/cursos`);
  }

  createCurso(curso: Partial<Curso>): Observable<Curso> {
    return this.http.post<Curso>(`${this.apiUrl}/academic/cursos`, curso);
  }

  updateCurso(id: number, curso: Partial<Curso>): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/academic/cursos/${id}`, curso);
  }

  deleteCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/academic/cursos/${id}`);
  }

  // Divisiones
  getDivisiones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/divisiones`);
  }

  getDivisionesByCurso(cursoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/cursos/${cursoId}/divisiones`);
  }

  createDivision(division: Partial<Division>): Observable<Division> {
    return this.http.post<Division>(`${this.apiUrl}/academic/divisiones`, division);
  }

  updateDivision(id: number, division: Partial<Division>): Observable<Division> {
    return this.http.put<Division>(`${this.apiUrl}/academic/divisiones/${id}`, division);
  }

  deleteDivision(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/academic/divisiones/${id}`);
  }

  // Materias
  getMaterias(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/materias`);
  }

  createMateria(materia: Partial<Materia>): Observable<Materia> {
    return this.http.post<Materia>(`${this.apiUrl}/academic/materias`, materia);
  }

  updateMateria(id: number, materia: Partial<Materia>): Observable<Materia> {
    return this.http.put<Materia>(`${this.apiUrl}/academic/materias/${id}`, materia);
  }

  deleteMateria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/academic/materias/${id}`);
  }

  // Horarios
  getHorarios(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/horarios`);
  }

  getHorariosByCurso(cursoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/cursos/${cursoId}/horarios`);
  }

  createHorario(horario: Partial<Horario>): Observable<Horario> {
    return this.http.post<Horario>(`${this.apiUrl}/academic/horarios`, horario);
  }

  updateHorario(id: number, horario: Partial<Horario>): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/academic/horarios/${id}`, horario);
  }

  deleteHorario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/academic/horarios/${id}`);
  }

  // Asignaciones
  getAsignaciones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/asignaciones`);
  }

  assignProfesorToMateria(profesorId: number, materiaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/academic/asignaciones`, {
      profesor_usuario_id: profesorId,
      materia_id: materiaId
    });
  }

  removeProfesorFromMateria(profesorId: number, materiaId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/academic/asignaciones/${profesorId}/${materiaId}`);
  }

  // Get all curso-divisiones (using the existing getDivisionesByCurso for each curso)
  getCursosDivisiones(): Observable<any> {
    // We'll get all cursos first, then get divisions for each
    return this.getCursos();
  }

  createCursoDivision(cursoId: number, divisionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/academic/cursos-divisiones`, {
      curso_id: cursoId,
      division_id: divisionId
    });
  }

  // Navegación de Curso-División
  getCursoDivisionDetails(cursoDivisionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/curso-division/${cursoDivisionId}/details`);
  }

  getEstudiantesByCursoDivision(cursoDivisionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/curso-division/${cursoDivisionId}/estudiantes`);
  }

  getProfesoresByCursoDivision(cursoDivisionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/curso-division/${cursoDivisionId}/profesores`);
  }

  getRegistrosAsistenciaByCursoDivision(cursoDivisionId: number, fechaDesde?: string, fechaHasta?: string): Observable<any> {
    let params = '';
    if (fechaDesde && fechaHasta) {
      params = `?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
    } else if (fechaDesde) {
      params = `?fechaDesde=${fechaDesde}`;
    }
    return this.http.get<any>(`${this.apiUrl}/academic/curso-division/${cursoDivisionId}/asistencia${params}`);
  }

  getDivisionDetail(divisionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/divisiones/${divisionId}/detail`);
  }

  getDailyAttendanceDetail(divisionId: number, fecha: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/academic/divisiones/${divisionId}/attendance/${fecha}`);
  }
}