import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Huella {
  id?: number;
  usuario_id: number;
  template_huella: string;
  calidad: number;
  fecha_registro?: string;
  activo: boolean;
  Usuario?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registro {
  id?: number;
  usuario_id: number;
  dispositivo_fichaje_id: number;
  fecha_hora: string;
  tipo_registro: 'entrada' | 'salida';
  verificado: boolean;
  Usuario?: any;
  DispositivoFichaje?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface DispositivoFichaje {
  id?: number;
  nombre: string;
  ubicacion: string;
  ip_address: string;
  puerto: number;
  modelo: string;
  estado: 'online' | 'offline' | 'mantenimiento';
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // ===== HUELLAS DACTILARES =====
  getHuellas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/huellas`);
  }

  getHuellaByUsuario(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/usuarios/${usuarioId}/huella`);
  }

  createHuella(huella: Partial<Huella>): Observable<Huella> {
    return this.http.post<Huella>(`${this.apiUrl}/biometric/huellas`, huella);
  }

  updateHuella(id: number, huella: Partial<Huella>): Observable<Huella> {
    return this.http.put<Huella>(`${this.apiUrl}/biometric/huellas/${id}`, huella);
  }

  deleteHuella(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/biometric/huellas/${id}`);
  }

  // ===== REGISTROS DE FICHAJE =====
  getRegistros(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/registros`);
  }

  getRegistrosByUsuario(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/usuarios/${usuarioId}/registros`);
  }

  getRegistrosByFecha(fechaInicio: string, fechaFin: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/registros/fecha`, {
      params: { fechaInicio, fechaFin }
    });
  }

  createRegistro(registro: Partial<Registro>): Observable<Registro> {
    return this.http.post<Registro>(`${this.apiUrl}/biometric/registros`, registro);
  }

  updateRegistro(id: number, registro: Partial<Registro>): Observable<Registro> {
    return this.http.put<Registro>(`${this.apiUrl}/biometric/registros/${id}`, registro);
  }

  deleteRegistro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/biometric/registros/${id}`);
  }

  // ===== DISPOSITIVOS DE FICHAJE =====
  getDispositivos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/dispositivos`);
  }

  createDispositivo(dispositivo: Partial<DispositivoFichaje>): Observable<DispositivoFichaje> {
    return this.http.post<DispositivoFichaje>(`${this.apiUrl}/biometric/dispositivos`, dispositivo);
  }

  updateDispositivo(id: number, dispositivo: Partial<DispositivoFichaje>): Observable<DispositivoFichaje> {
    return this.http.put<DispositivoFichaje>(`${this.apiUrl}/biometric/dispositivos/${id}`, dispositivo);
  }

  deleteDispositivo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/biometric/dispositivos/${id}`);
  }

  testConnection(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/biometric/dispositivos/${id}/test`, {});
  }

  // ===== OPERACIONES ESPECIALES =====
  enrollFingerprint(usuarioId: number, deviceId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/biometric/enroll`, {
      usuario_id: usuarioId,
      dispositivo_id: deviceId
    });
  }

  verifyFingerprint(usuarioId: number, deviceId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/biometric/verify`, {
      usuario_id: usuarioId,
      dispositivo_id: deviceId
    });
  }

  syncDevice(deviceId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/biometric/dispositivos/${deviceId}/sync`, {});
  }

  getDeviceUsers(deviceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/biometric/dispositivos/${deviceId}/usuarios`);
  }

  clearDeviceUsers(deviceId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/biometric/dispositivos/${deviceId}/usuarios`);
  }
}
