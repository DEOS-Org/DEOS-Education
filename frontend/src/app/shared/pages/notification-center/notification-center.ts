import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.scss'
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  isLoading = false;
  
  // Paginación
  totalNotifications = 0;
  pageSize = 20;
  currentPage = 0;
  
  // Filtros
  selectedTab = 0; // 0: Todas, 1: No leídas, 2: Por tipo
  selectedType = '';
  typeFilter = '';
  
  // Tipos de notificación disponibles
  notificationTypes = [
    { value: '', label: 'Todos los tipos' },
    { value: 'info', label: 'Información' },
    { value: 'success', label: 'Éxito' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'error', label: 'Error' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    this.isLoading = true;
    
    const filters: any = {
      limit: this.pageSize,
      offset: this.currentPage * this.pageSize
    };

    // Aplicar filtros según la pestaña seleccionada
    switch (this.selectedTab) {
      case 1: // No leídas
        filters.leida = false;
        break;
      case 2: // Por tipo
        if (this.typeFilter) {
          filters.tipo = this.typeFilter;
        }
        break;
      default: // Todas
        break;
    }

    this.notificationService.getAllNotifications(filters).subscribe({
      next: (response) => {
        this.notifications = response?.notifications || response?.data || response || [];
        this.totalNotifications = response?.pagination?.totalItems || response?.total || this.notifications.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
        this.notifications = [];
        this.totalNotifications = 0;
      }
    });
  }

  onTabChange(tabIndex: number): void {
    this.selectedTab = tabIndex;
    this.currentPage = 0;
    this.loadNotifications();
  }

  onTypeFilterChange(): void {
    this.currentPage = 0;
    this.loadNotifications();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadNotifications();
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!notification.leida) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.leida = true;
          notification.fecha_leida = new Date().toISOString();
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
        this.notifications.forEach(n => {
          n.leida = true;
          n.fecha_leida = new Date().toISOString();
        });
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  deleteNotification(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      this.notificationService.deleteNotification(notification.id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          this.totalNotifications--;
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
    }
  }

  onNotificationClick(notification: Notification): void {
    // Marcar como leída si no lo está
    if (!notification.leida) {
      this.markAsRead(notification);
    }

    // Navegar a la URL de acción si existe
    if (notification.accion_url) {
      // Verificar si es una URL interna o externa
      if (notification.accion_url.startsWith('http')) {
        window.open(notification.accion_url, '_blank');
      } else {
        this.router.navigate([notification.accion_url]);
      }
    }
  }

  refreshNotifications(): void {
    this.loadNotifications();
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

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUnreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.leida).length;
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}