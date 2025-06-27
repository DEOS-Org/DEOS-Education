import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  leida: boolean;
  fecha_creacion: string;
  fecha_leida?: string;
  accion_url?: string;
  metadata?: any;
  es_global?: boolean;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface NotificationFilters {
  tipo?: string;
  leida?: boolean;
  include_global?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  no_leidas: number;
  leidas: number;
  por_tipo: { [key: string]: number };
}

export interface CreateNotificationData {
  usuario_id?: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  accion_url?: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';
  
  // Subject para notificaciones en tiempo real
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar notificaciones iniciales y contar no leídas
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.getMyNotifications({ limit: 10 }).subscribe({
      next: (notifications) => {
        console.log('Notifications loaded successfully:', notifications);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error loading initial notifications:', error);
        // Si hay error, simplemente no cargar notificaciones
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  // ===== OBTENER NOTIFICACIONES =====
  
  getMyNotifications(filters: NotificationFilters = {}): Observable<Notification[]> {
    const params = new URLSearchParams();
    
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.leida !== undefined) params.append('unreadOnly', (!filters.leida).toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('page', Math.floor((filters.offset || 0) / (filters.limit || 20) + 1).toString());

    return this.http.get<any>(`${this.apiUrl}?${params.toString()}`).pipe(
      tap((response: any) => {
        const notifications = response?.notifications || response?.data || response || [];
        this.notificationsSubject.next(Array.isArray(notifications) ? notifications : []);
      })
    );
  }

  getAllNotifications(filters: NotificationFilters = {}): Observable<any> {
    const params = new URLSearchParams();
    
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.leida !== undefined) params.append('leida', filters.leida.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    return this.http.get<any>(`${this.apiUrl}?${params.toString()}`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`).pipe(
      tap((response: any) => {
        const count = response?.count || 0;
        this.unreadCountSubject.next(count);
      })
    );
  }

  private updateUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  // ===== MARCAR COMO LEÍDA =====
  
  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Actualizar estado local
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => 
          n.id === notificationId ? { ...n, leida: true, fecha_leida: new Date().toISOString() } : n
        );
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        // Actualizar estado local
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({
          ...n,
          leida: true,
          fecha_leida: new Date().toISOString()
        }));
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  // ===== CREAR NOTIFICACIONES (ADMIN) =====
  
  createNotification(data: CreateNotificationData): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  createBulkNotification(userIds: number[], data: Omit<CreateNotificationData, 'usuario_id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk`, {
      user_ids: userIds,
      ...data
    });
  }

  createGlobalNotification(data: Omit<CreateNotificationData, 'usuario_id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/global`, data);
  }

  // ===== ELIMINAR NOTIFICACIONES (ADMIN) =====
  
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        // Actualizar estado local
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
      })
    );
  }

  cleanupOldNotifications(days: number = 30): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cleanup/old?days=${days}`);
  }

  // ===== ESTADÍSTICAS =====
  
  getStats(userId?: number): Observable<NotificationStats> {
    const params = userId ? `?usuario_id=${userId}` : '';
    return this.http.get<any>(`${this.apiUrl}/stats${params}`);
  }

  // ===== INTEGRACIÓN CON MENSAJERÍA =====
  
  createMessageNotification(messageId: number, senderId: number, recipientId: number, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto/message`, {
      message_id: messageId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: content
    });
  }

  createGroupMessageNotification(messageId: number, senderId: number, groupId: number, groupName: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto/group-message`, {
      message_id: messageId,
      sender_id: senderId,
      group_id: groupId,
      group_name: groupName,
      content: content
    });
  }

  // ===== NOTIFICACIONES AUTOMÁTICAS =====
  
  createWelcomeNotification(userId: number, roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto/welcome`, {
      usuario_id: userId,
      rol_name: roleName
    });
  }

  createMissingFingerprintNotification(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto/missing-fingerprint`, {
      usuario_id: userId
    });
  }

  createDeviceErrorNotification(deviceName: string, errorMessage: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto/device-error`, {
      device_name: deviceName,
      error_message: errorMessage
    });
  }

  createExcessiveAbsenceNotification(studentId: number, absenceCount: number, period: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auto/excessive-absence`, {
      student_id: studentId,
      absence_count: absenceCount,
      period: period
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  refreshNotifications(): void {
    this.getMyNotifications({ limit: 20 }).subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error refreshing notifications:', error);
      }
    });
  }

  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': 
      default: return 'info';
    }
  }

  getNotificationColor(tipo: string): string {
    switch (tipo) {
      case 'success': return 'var(--interactive-success)';
      case 'warning': return 'var(--interactive-warning)';
      case 'error': return 'var(--interactive-danger)';
      case 'info': 
      default: return 'var(--interactive-primary)';
    }
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Ahora';
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short'
      });
    }
  }

  // Método para polling de notificaciones (opcional)
  startNotificationPolling(intervalMs: number = 30000): void {
    setInterval(() => {
      this.updateUnreadCount();
    }, intervalMs);
  }
}