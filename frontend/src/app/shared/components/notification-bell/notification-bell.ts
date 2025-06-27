import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: Notification[] = [];
  isLoading = false;

  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Suscribirse al contador de no leídas
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Suscribirse a las notificaciones
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications.slice(0, 5); // Solo mostrar las 5 más recientes
      })
    );

    // Cargar notificaciones iniciales
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getMyNotifications({ limit: 5, leida: false }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!notification.leida) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // La actualización del estado se maneja en el servicio
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // La actualización del estado se maneja en el servicio
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  getNotificationIcon(tipo: string): string {
    return this.notificationService.getNotificationIcon(tipo);
  }

  getNotificationColor(tipo: string): string {
    return this.notificationService.getNotificationColor(tipo);
  }

  formatTimeAgo(dateString: string): string {
    return this.notificationService.formatTimeAgo(dateString);
  }

  onNotificationClick(notification: Notification): void {
    // Marcar como leída si no lo está
    if (!notification.leida) {
      this.markAsRead(notification);
    }

    // Navegar a la URL de acción si existe
    if (notification.accion_url) {
      // Aquí podrías usar el Router para navegar
      console.log('Navigate to:', notification.accion_url);
    }
  }

  refreshNotifications(): void {
    this.notificationService.refreshNotifications();
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}