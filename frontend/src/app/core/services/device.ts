import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Device {
  id?: number;
  nombre: string;
  ip: string;
  puerto: number;
  tipo: 'biometrico' | 'rfid' | 'camara';
  ubicacion: string;
  activo: boolean;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeviceRequest {
  nombre: string;
  ip: string;
  puerto: number;
  tipo: 'biometrico' | 'rfid' | 'camara';
  ubicacion: string;
  descripcion?: string;
}

export interface UpdateDeviceRequest {
  nombre?: string;
  ip?: string;
  puerto?: number;
  tipo?: 'biometrico' | 'rfid' | 'camara';
  ubicacion?: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Device management
  createDevice(deviceData: CreateDeviceRequest): Observable<Device> {
    return this.http.post<Device>(`${this.apiUrl}/devices`, deviceData);
  }

  getDevice(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.apiUrl}/devices/${id}`);
  }

  updateDevice(id: number, deviceData: UpdateDeviceRequest): Observable<Device> {
    return this.http.put<Device>(`${this.apiUrl}/devices/${id}`, deviceData);
  }

  deleteDevice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/devices/${id}`);
  }

  getDevices(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/devices`);
  }

  getAllDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/devices`);
  }

  // Device operations
  testConnection(deviceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/${deviceId}/test`, {});
  }

  activateDevice(deviceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/${deviceId}/activate`, {});
  }

  deactivateDevice(deviceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/${deviceId}/deactivate`, {});
  }

  // Device status and monitoring
  getDeviceStatus(deviceId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices/${deviceId}/status`);
  }

  getDeviceLogs(deviceId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/devices/${deviceId}/logs`);
  }

  // Filter devices by type
  getDevicesByType(type: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/devices?type=${type}`);
  }

  // Sync device data
  syncDevice(deviceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/devices/${deviceId}/sync`, {});
  }
}