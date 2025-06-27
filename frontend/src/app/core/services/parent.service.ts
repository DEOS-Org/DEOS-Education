import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParentService {
  private apiUrl = `${environment.apiUrl}/api/parent`;

  constructor(private http: HttpClient) { }

  // ===== HIJOS =====
  getChildren(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/hijos`);
  }

  // ===== CALIFICACIONES =====
  getChildGrades(hijoId: number, materiaId?: number, trimestre?: number): Observable<any[]> {
    let params = new HttpParams();
    if (materiaId) params = params.set('materiaId', materiaId.toString());
    if (trimestre) params = params.set('trimestre', trimestre.toString());
    
    return this.http.get<any[]>(`${this.apiUrl}/hijos/${hijoId}/calificaciones`, { params });
  }

  getChildReportCard(hijoId: number, trimestre?: number): Observable<any> {
    let params = new HttpParams();
    if (trimestre) params = params.set('trimestre', trimestre.toString());
    
    return this.http.get<any>(`${this.apiUrl}/hijos/${hijoId}/boletin`, { params });
  }

  getChildStatistics(hijoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/hijos/${hijoId}/estadisticas`);
  }

  // ===== RESÚMENES =====
  getAcademicSummary(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/resumen-academico`);
  }

  getSiblingsComparison(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/comparativa-hermanos`);
  }

  getAcademicNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notificaciones-academicas`);
  }

  // ===== DASHBOARD =====
  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }
}