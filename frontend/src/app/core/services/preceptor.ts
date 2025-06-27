import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PreceptorService {
  private apiUrl = `${environment.apiUrl}/preceptor`;

  constructor(private http: HttpClient) {}

  // ===== DASHBOARD =====
  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  // ===== CURSOS ASIGNADOS =====
  getAssignedCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses`);
  }

  getCourseDetail(courseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}`);
  }

  // ===== ESTUDIANTES =====
  getAllStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students`);
  }

  getStudentsByCourse(courseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}/students`);
  }

  getStudentDetail(studentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/${studentId}`);
  }

  // ===== ASISTENCIA MANUAL =====
  registerManualAttendance(data: {
    studentId: number;
    courseId: number;
    date: string;
    status: string;
    observations?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/manual`, data);
  }

  updateAttendance(recordId: number, data: {
    status?: string;
    observations?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/attendance/${recordId}`, data);
  }

  getAttendanceRecords(filters: {
    courseId?: number;
    date?: string;
    studentId?: number;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters.date) {
      params = params.set('date', filters.date);
    }
    if (filters.studentId) {
      params = params.set('studentId', filters.studentId.toString());
    }

    return this.http.get(`${this.apiUrl}/attendance/records`, { params });
  }

  getDailyAttendance(courseId: number, date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}/attendance/${date}`);
  }

  // ===== REPORTES =====
  getAttendanceReport(filters: {
    courseId?: number;
    startDate?: string;
    endDate?: string;
    studentId?: number;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.studentId) {
      params = params.set('studentId', filters.studentId.toString());
    }

    return this.http.get(`${this.apiUrl}/reports/attendance`, { params });
  }

  getBehaviorReport(filters: {
    courseId?: number;
    startDate?: string;
    endDate?: string;
    studentId?: number;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.studentId) {
      params = params.set('studentId', filters.studentId.toString());
    }

    return this.http.get(`${this.apiUrl}/reports/behavior`, { params });
  }

  getAcademicReport(filters: {
    courseId?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get(`${this.apiUrl}/reports/academic`, { params });
  }

  // ===== ALERTAS =====
  getAlerts(filters?: {
    type?: string;
    priority?: string;
    status?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get(`${this.apiUrl}/alerts`, { params });
  }

  createAlert(data: {
    studentId: number;
    courseId?: number;
    type: string;
    priority: string;
    title: string;
    description?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/alerts`, data);
  }

  updateAlert(alertId: number, data: {
    status?: string;
    comments?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/alerts/${alertId}`, data);
  }

  deleteAlert(alertId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/alerts/${alertId}`);
  }

  // ===== SANCIONES =====
  getSanctions(filters?: {
    studentId?: number;
    courseId?: number;
    status?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.studentId) {
      params = params.set('studentId', filters.studentId.toString());
    }
    if (filters?.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get(`${this.apiUrl}/sanctions`, { params });
  }

  createSanction(data: {
    studentId: number;
    courseId?: number;
    type: string;
    severity: string;
    description: string;
    startDate: string;
    endDate?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/sanctions`, data);
  }

  updateSanction(sanctionId: number, data: {
    status?: string;
    comments?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/sanctions/${sanctionId}`, data);
  }

  // ===== COMUNICADOS =====
  getCommunications(filters?: {
    courseId?: number;
    type?: string;
    status?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get(`${this.apiUrl}/communications`, { params });
  }

  createCommunication(data: {
    courseId?: number;
    type: string;
    title: string;
    content: string;
    targetAudience: string;
    priority?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/communications`, data);
  }

  updateCommunication(communicationId: number, data: {
    status?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/communications/${communicationId}`, data);
  }

  // ===== ESTADÍSTICAS =====
  getStatistics(filters?: {
    courseId?: number;
    period?: string;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.courseId) {
      params = params.set('courseId', filters.courseId.toString());
    }
    if (filters?.period) {
      params = params.set('period', filters.period);
    }

    return this.http.get(`${this.apiUrl}/statistics`, { params });
  }
}