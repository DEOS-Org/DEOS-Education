import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-preceptor-alerts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatExpansionModule,
    MatSnackBarModule
  ],
  template: `
    <div class="preceptor-alerts">
      <h1>Alertas del Preceptor</h1>
      <p>Componente en desarrollo...</p>
    </div>
  `,
  styles: [`
    .preceptor-alerts {
      padding: 20px;
    }
  `]
})
export class PreceptorAlertsComponent implements OnInit, OnDestroy {
  isLoading = true;
  
  // Forms
  filtersForm: FormGroup;
  newAlertForm: FormGroup;
  
  // Data
  alerts: any[] = [];
  systemAlerts: any[] = [];
  studentAlerts: any[] = [];
  
  // Statistics
  alertStats = {
    total: 0,
    unread: 0,
    highPriority: 0,
    todayAlerts: 0
  };

  // Alert types configuration
  alertTypes = [
    { value: 'attendance', label: 'Asistencia', icon: 'how_to_reg', color: 'primary' },
    { value: 'behavior', label: 'Comportamiento', icon: 'psychology', color: 'accent' },
    { value: 'academic', label: 'Académico', icon: 'school', color: 'primary' },
    { value: 'health', label: 'Salud', icon: 'local_hospital', color: 'warn' },
    { value: 'security', label: 'Seguridad', icon: 'security', color: 'warn' },
    { value: 'system', label: 'Sistema', icon: 'settings', color: 'accent' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      search: [''],
      type: [''],
      priority: [''],
      status: [''],
      dateRange: ['today']
    });

    this.newAlertForm = this.fb.group({
      type: ['attendance'],
      priority: ['medium'],
      title: [''],
      message: [''],
      targetStudents: [''],
      autoResolve: [false]
    });
  }

  ngOnInit(): void {
    this.loadAlertsData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupFormSubscriptions(): void {
    this.subscriptions.push(
      this.filtersForm.valueChanges.subscribe(() => {
        this.filterAlerts();
      })
    );
  }

  loadAlertsData(): void {
    this.isLoading = true;
    
    // Load notifications (acting as alerts)
    this.subscriptions.push(
      this.notificationService.getMyNotifications({ limit: 100 }).subscribe({
        next: (notifications) => {
          this.processAlertsData(notifications);
          this.loadSystemAlerts();
        },
        error: (error) => {
          console.error('Error loading alerts:', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar alertas', 'Cerrar', { duration: 5000 });
        }
      })
    );
  }

  processAlertsData(notifications: any[]): void {
    // Convert notifications to alerts format
    this.alerts = notifications.map(notification => ({
      id: notification.id,
      type: this.getAlertTypeFromNotification(notification),
      priority: this.getPriorityFromNotification(notification),
      title: notification.titulo,
      message: notification.mensaje,
      status: notification.leida ? 'resolved' : 'active',
      createdAt: notification.fecha_creacion,
      student: this.getStudentFromNotification(notification),
      source: 'notification',
      originalData: notification
    }));

    this.calculateAlertStats();
    this.categorizeAlerts();
  }

  getAlertTypeFromNotification(notification: any): string {
    // Determine alert type based on notification content
    const title = notification.titulo.toLowerCase();
    const message = notification.mensaje.toLowerCase();
    
    if (title.includes('asistencia') || message.includes('asistencia')) return 'attendance';
    if (title.includes('huella') || message.includes('biométrico')) return 'security';
    if (title.includes('dispositivo') || message.includes('error')) return 'system';
    if (title.includes('ausencia') || message.includes('ausente')) return 'attendance';
    
    return 'system';
  }

  getPriorityFromNotification(notification: any): string {
    switch (notification.tipo) {
      case 'error': return 'high';
      case 'warning': return 'medium';
      case 'success': return 'low';
      default: return 'medium';
    }
  }

  getStudentFromNotification(notification: any): any {
    // Extract student info if available
    if (notification.metadata?.student_id) {
      return {
        id: notification.metadata.student_id,
        name: notification.metadata.student_name || 'Estudiante',
        division: notification.metadata.division || 'Sin división'
      };
    }
    return null;
  }

  loadSystemAlerts(): void {
    // Generate sample system alerts
    this.systemAlerts = [
      {
        id: 'sys_001',
        type: 'system',
        priority: 'high',
        title: 'Dispositivo Biométrico Desconectado',
        message: 'El dispositivo de entrada principal no responde desde hace 30 minutos.',
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        source: 'system'
      },
      {
        id: 'sys_002',
        type: 'attendance',
        priority: 'medium',
        title: 'Ausencias Masivas Detectadas',
        message: '15 estudiantes de 3° A no han registrado ingreso hoy.',
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'system'
      },
      {
        id: 'sys_003',
        type: 'security',
        priority: 'high',
        title: 'Intento de Acceso No Autorizado',
        message: 'Se detectó un intento de acceso con huella no registrada.',
        status: 'resolved',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'system'
      }
    ];

    this.isLoading = false;
  }

  categorizeAlerts(): void {
    // Separate student-specific alerts
    this.studentAlerts = this.alerts.filter(alert => alert.student);
  }

  calculateAlertStats(): void {
    const allAlerts = [...this.alerts, ...this.systemAlerts];
    
    this.alertStats.total = allAlerts.length;
    this.alertStats.unread = allAlerts.filter(alert => alert.status === 'active').length;
    this.alertStats.highPriority = allAlerts.filter(alert => alert.priority === 'high').length;
    
    // Count today's alerts
    const today = new Date().toDateString();
    this.alertStats.todayAlerts = allAlerts.filter(alert => 
      new Date(alert.createdAt).toDateString() === today
    ).length;
  }

  filterAlerts(): void {
    // Apply filters to alerts
    const filters = this.filtersForm.value;
    // Implementation would filter the alerts array based on form values
    console.log('Applying filters:', filters);
  }

  getAlertTypeConfig(type: string): any {
    return this.alertTypes.find(t => t.value === type) || this.alertTypes[0];
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return 'primary';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return 'priority_high';
      case 'medium': return 'remove';
      case 'low': return 'keyboard_arrow_down';
      default: return 'remove';
    }
  }

  getStatusColor(status: string): string {
    return status === 'active' ? 'warn' : 'primary';
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
    } else {
      return `Hace ${diffInDays} días`;
    }
  }

  createAlert(): void {
    if (this.newAlertForm.valid) {
      const formData = this.newAlertForm.value;
      
      // Create notification as alert
      this.notificationService.createNotification({
        titulo: formData.title,
        mensaje: formData.message,
        tipo: formData.priority === 'high' ? 'error' : formData.priority === 'medium' ? 'warning' : 'info',
        metadata: {
          alert_type: formData.type,
          priority: formData.priority,
          auto_resolve: formData.autoResolve,
          source: 'preceptor'
        }
      }).subscribe({
        next: () => {
          this.snackBar.open('Alerta creada exitosamente', 'Cerrar', { duration: 3000 });
          this.newAlertForm.reset();
          this.loadAlertsData();
        },
        error: (error) => {
          console.error('Error creating alert:', error);
          this.snackBar.open('Error al crear la alerta', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  resolveAlert(alert: any): void {
    if (alert.source === 'notification') {
      this.notificationService.markAsRead(alert.id).subscribe({
        next: () => {
          alert.status = 'resolved';
          this.calculateAlertStats();
          this.snackBar.open('Alerta resuelta', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error resolving alert:', error);
          this.snackBar.open('Error al resolver la alerta', 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      // Handle system alerts
      alert.status = 'resolved';
      this.calculateAlertStats();
      this.snackBar.open('Alerta del sistema resuelta', 'Cerrar', { duration: 3000 });
    }
  }

  deleteAlert(alert: any): void {
    if (confirm('¿Está seguro de eliminar esta alerta?')) {
      if (alert.source === 'notification') {
        this.notificationService.deleteNotification(alert.id).subscribe({
          next: () => {
            this.loadAlertsData();
            this.snackBar.open('Alerta eliminada', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting alert:', error);
            this.snackBar.open('Error al eliminar la alerta', 'Cerrar', { duration: 5000 });
          }
        });
      } else {
        // Remove from system alerts
        const index = this.systemAlerts.findIndex(a => a.id === alert.id);
        if (index !== -1) {
          this.systemAlerts.splice(index, 1);
          this.calculateAlertStats();
          this.snackBar.open('Alerta del sistema eliminada', 'Cerrar', { duration: 3000 });
        }
      }
    }
  }

  viewAlertDetail(alert: any): void {
    // Show detailed view of alert
    this.snackBar.open(`Ver detalle de: ${alert.title} - En desarrollo`, 'Cerrar', { duration: 3000 });
  }

  refreshAlerts(): void {
    this.loadAlertsData();
  }

  exportAlerts(): void {
    this.snackBar.open('Exportar alertas - En desarrollo', 'Cerrar', { duration: 3000 });
  }
}