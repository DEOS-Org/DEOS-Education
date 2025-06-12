import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  contraseña: string;
}

export interface LoginResponse {
  token: string;
  usuario: User;  // Cambiado de 'user' a 'usuario' para coincidir con el backend
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(this.userKey);
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      // Limpiar localStorage si hay datos corruptos
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Auth service - login response:', response);
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.some(role => user.roles.includes(role));
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/request-password-reset`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, { 
      currentPassword, 
      newPassword 
    });
  }

  redirectToRoleHome(): void {
    const user = this.getCurrentUser();
    console.log('Current user for redirect:', user);
    
    if (!user) {
      console.log('No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('User roles:', user.roles);

    // Redirect based on primary role
    if (user.roles.includes('admin')) {
      console.log('Redirecting to admin dashboard');
      this.router.navigate(['/admin']);
    } else if (user.roles.includes('preceptor')) {
      console.log('Redirecting to preceptor dashboard');
      this.router.navigate(['/preceptor']);
    } else if (user.roles.includes('profesor')) {
      console.log('Redirecting to professor dashboard');
      this.router.navigate(['/professor']);
    } else if (user.roles.includes('alumno')) {
      console.log('Redirecting to student dashboard');
      this.router.navigate(['/student']);
    } else if (user.roles.includes('padre')) {
      console.log('Redirecting to parent dashboard');
      this.router.navigate(['/parent']);
    } else {
      console.log('No matching role found, redirecting to login');
      this.router.navigate(['/login']);
    }
  }
}
