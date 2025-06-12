import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
  id?: number;
  nombre: string;
  descripcion?: string;
  permisos: string[];
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleRequest {
  nombre: string;
  descripcion?: string;
  permisos: string[];
}

export interface UpdateRoleRequest {
  nombre?: string;
  descripcion?: string;
  permisos?: string[];
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Role management
  createRole(roleData: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, roleData);
  }

  getRole(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/roles/${id}`);
  }

  updateRole(id: number, roleData: UpdateRoleRequest): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/roles/${id}`, roleData);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${id}`);
  }

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/roles`);
  }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  // Permission management
  getAvailablePermissions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles/permissions`);
  }

  assignPermissionToRole(roleId: number, permission: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/roles/${roleId}/permissions`, { permission });
  }

  removePermissionFromRole(roleId: number, permission: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/roles/${roleId}/permissions/${permission}`);
  }

  // User role assignments
  getUsersWithRole(roleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles/${roleId}/users`);
  }
}