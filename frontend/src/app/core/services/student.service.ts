import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = `${environment.apiUrl}/api/student`;

  constructor(private http: HttpClient) { }

  // ===== CALIFICACIONES =====
  getGrades(materiaId?: number, trimestre?: number): Observable<any[]> {
    let params = new HttpParams();
    if (materiaId) params = params.set('materiaId', materiaId.toString());
    if (trimestre) params = params.set('trimestre', trimestre.toString());
    
    return this.http.get<any[]>(`${this.apiUrl}/grades`, { params });
  }

  getAverages(trimestre?: number): Observable<any[]> {
    let params = new HttpParams();
    if (trimestre) params = params.set('trimestre', trimestre.toString());
    
    return this.http.get<any[]>(`${this.apiUrl}/averages`, { params });
  }

  getReportCard(trimestre?: number): Observable<any> {
    let params = new HttpParams();
    if (trimestre) params = params.set('trimestre', trimestre.toString());
    
    return this.http.get<any>(`${this.apiUrl}/report-card`, { params });
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  getAcademicHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/academic-history`);
  }

  getRanking(claseId?: number): Observable<any> {
    let params = new HttpParams();
    if (claseId) params = params.set('claseId', claseId.toString());
    
    return this.http.get<any>(`${this.apiUrl}/ranking`, { params });
  }

  // ===== MATERIAS =====
  getSubjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/subjects`);
  }

  // ===== DASHBOARD =====
  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }
}