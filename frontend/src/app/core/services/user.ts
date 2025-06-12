import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  contraseña?: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  roles: string[];
}

export interface UpdateUserRequest {
  dni?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  contraseña?: string;
}

export interface AssignRoleRequest {
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // User management
  createUser(userData: CreateUserRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/users`, userData);
  }

  getUser(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: number, userData: UpdateUserRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/users/${id}`, userData);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`);
  }

  getAllUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users`);
  }

  // Role management
  assignRole(userId: number, roleData: AssignRoleRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/roles`, roleData);
  }

  removeRole(userId: number, role: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}/roles/${role}`);
  }

  // Student-Parent relationships
  assignParentToStudent(studentId: number, parentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/alumnos/${studentId}/padres`, { padreId: parentId });
  }

  removeParentFromStudent(studentId: number, parentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/alumnos/${studentId}/padres/${parentId}`);
  }

  getStudentParents(studentId: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users/alumnos/${studentId}/padres`);
  }

  getParentStudents(parentId: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users/padres/${parentId}/alumnos`);
  }

  // Filter users by role
  getUsersByRole(role: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users?role=${role}`);
  }

  // Student detail
  getStudentDetail(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${studentId}/student-detail`);
  }

  // Professor detail
  getProfessorDetail(professorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${professorId}/professor-detail`);
  }
}
