import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ParentService, DashboardData } from '../../../core/services/parent';

export interface DashboardChild {
  id: string;
  name: string;
  grade: string;
  division: string;
  photo?: string;
  stats: {
    attendance: number;
    averageGrade: number;
    pendingTasks: number;
    nextExam?: {
      subject: string;
      date: Date;
    };
  };
}

export interface DashboardSummary {
  totalChildren: number;
  upcomingEvents: number;
  unreadMessages: number;
  pendingPayments: number;
  overduePayments: number;
  totalDebt: number;
}

export interface RecentActivity {
  id: string;
  type: 'grade' | 'attendance' | 'task' | 'payment' | 'message' | 'meeting';
  title: string;
  description: string;
  childName?: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

export interface UpcomingEvent {
  id: string;
  type: 'exam' | 'meeting' | 'payment' | 'holiday' | 'activity';
  title: string;
  description?: string;
  date: Date;
  childName?: string;
  location?: string;
  urgent: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
  description: string;
  count?: number;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class ParentDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State signals
  loading = signal(false);
  children = signal<DashboardChild[]>([]);
  summary = signal<DashboardSummary | null>(null);
  recentActivities = signal<RecentActivity[]>([]);
  upcomingEvents = signal<UpcomingEvent[]>([]);
  selectedChild = signal<DashboardChild | null>(null);
  
  // UI state
  selectedTab = signal(0);
  
  // Quick actions
  quickActions = signal<QuickAction[]>([
    {
      id: 'grades',
      label: 'Ver Calificaciones',
      icon: 'grade',
      route: '/parent/grades',
      color: 'primary',
      description: 'Revisar notas y calificaciones'
    },
    {
      id: 'attendance',
      label: 'Asistencia',
      icon: 'event_available',
      route: '/parent/attendance',
      color: 'accent',
      description: 'Consultar asistencia escolar'
    },
    {
      id: 'assignments',
      label: 'Tareas',
      icon: 'assignment',
      route: '/parent/assignments',
      color: 'warn',
      description: 'Revisar tareas pendientes',
      count: 5
    },
    {
      id: 'meetings',
      label: 'Reuniones',
      icon: 'event',
      route: '/parent/meetings',
      color: 'primary',
      description: 'Programar reuniones'
    },
    {
      id: 'communications',
      label: 'Mensajes',
      icon: 'message',
      route: '/parent/communications',
      color: 'accent',
      description: 'Leer mensajes del colegio',
      count: 3
    },
    {
      id: 'payments',
      label: 'Pagos',
      icon: 'payment',
      route: '/parent/payments',
      color: 'warn',
      description: 'Gestionar pagos escolares',
      count: 2
    },
    {
      id: 'children',
      label: 'Mis Hijos',
      icon: 'family_restroom',
      route: '/parent/children',
      color: 'primary',
      description: 'Gestionar información de los hijos'
    },
    {
      id: 'schedule',
      label: 'Horarios',
      icon: 'schedule',
      route: '/parent/children',
      color: 'accent',
      description: 'Ver horarios de clases'
    }
  ]);

  // Computed properties
  urgentActivities = computed(() => 
    this.recentActivities().filter(a => a.priority === 'high' && !a.read)
  );
  
  todayEvents = computed(() => {
    const today = new Date();
    return this.upcomingEvents().filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.toDateString() === today.toDateString();
    });
  });
  
  thisWeekEvents = computed(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.upcomingEvents().filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate <= nextWeek;
    });
  });

  constructor(
    private parentService: ParentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    this.loading.set(true);
    
    // Load real data from services
    forkJoin({
      dashboard: this.parentService.getDashboard(),
      children: this.parentService.getChildren(),
      notifications: this.parentService.getNotifications(false, undefined, 5, 0)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.processDashboardData(data.dashboard);
        this.processChildrenData(data.children);
        this.processNotificationsData(data.notifications.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.snackBar.open('Error al cargar los datos del dashboard', 'Cerrar', {
          duration: 5000
        });
        this.loadMockData(); // Fallback to mock data
        this.loading.set(false);
      }
    });
  }

  private processDashboardData(data: DashboardData) {
    this.summary.set({
      totalChildren: data.summary.total_children,
      upcomingEvents: data.summary.upcoming_meetings,
      unreadMessages: data.summary.unread_communications,
      pendingPayments: data.summary.pending_tasks,
      overduePayments: 0,
      totalDebt: 0
    });

    // Process recent activities
    this.recentActivities.set(data.recent_activities.map(activity => ({
      id: activity.id || Date.now().toString(),
      type: activity.type,
      title: activity.message,
      description: activity.message,
      childName: activity.child,
      date: new Date(activity.date),
      priority: 'medium' as const,
      read: false
    })));

    // Process urgent notifications as upcoming events
    this.upcomingEvents.set(data.urgent_notifications.map(notification => ({
      id: notification.id.toString(),
      type: notification.type,
      title: notification.title,
      description: notification.message,
      date: new Date(),
      urgent: notification.urgent || false
    })));
  }

  private processChildrenData(children: any[]) {
    this.children.set(children.map(child => ({
      id: child.alumno_id.toString(),
      name: `${child.alumno_nombre} ${child.alumno_apellido}`,
      grade: child.curso_nombre || 'Sin curso',
      division: child.division_nombre || 'Sin división',
      stats: {
        attendance: 95, // Mock data - would come from attendance service
        averageGrade: 8.5, // Mock data - would come from grades service
        pendingTasks: 3, // Mock data - would come from assignments service
        nextExam: {
          subject: 'Matemáticas',
          date: new Date('2024-12-15')
        }
      }
    })));
  }

  private processNotificationsData(notifications: any[]) {
    // Notifications are already processed in processDashboardData
    // This could be used for additional notification processing if needed
  }

  private loadMockData() {
    // Fallback to original mock data loading
    this.loadChildren();
    this.loadSummary();
    this.loadRecentActivities();
    this.loadUpcomingEvents();
  }

  private loadChildren() {
    const mockChildren: DashboardChild[] = [
      {
        id: '1',
        name: 'Sofia García',
        grade: '4to Grado',
        division: 'A',
        photo: '/assets/images/student1.jpg',
        stats: {
          attendance: 95,
          averageGrade: 8.7,
          pendingTasks: 2,
          nextExam: {
            subject: 'Matemáticas',
            date: new Date('2024-03-25')
          }
        }
      },
      {
        id: '2',
        name: 'Mateo García',
        grade: '2do Año',
        division: 'B',
        photo: '/assets/images/student2.jpg',
        stats: {
          attendance: 88,
          averageGrade: 7.5,
          pendingTasks: 4,
          nextExam: {
            subject: 'Historia',
            date: new Date('2024-03-28')
          }
        }
      }
    ];
    
    this.children.set(mockChildren);
    this.selectedChild.set(mockChildren[0]);
  }

  private loadSummary() {
    const mockSummary: DashboardSummary = {
      totalChildren: 2,
      upcomingEvents: 8,
      unreadMessages: 3,
      pendingPayments: 2,
      overduePayments: 1,
      totalDebt: 45000
    };
    
    this.summary.set(mockSummary);
  }

  private loadRecentActivities() {
    const mockActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'grade',
        title: 'Nueva Calificación',
        description: 'Matemáticas: 9/10 - Examen Unidad 3',
        childName: 'Sofia García',
        date: new Date('2024-03-20T10:30:00'),
        priority: 'medium',
        read: false
      },
      {
        id: '2',
        type: 'attendance',
        title: 'Ausencia Registrada',
        description: 'Faltó a clases por motivos de salud',
        childName: 'Mateo García',
        date: new Date('2024-03-19T08:00:00'),
        priority: 'high',
        read: false
      },
      {
        id: '3',
        type: 'message',
        title: 'Mensaje del Profesor',
        description: 'Recordatorio sobre la reunión de padres',
        childName: 'Sofia García',
        date: new Date('2024-03-18T15:45:00'),
        priority: 'medium',
        read: true
      },
      {
        id: '4',
        type: 'payment',
        title: 'Pago Vencido',
        description: 'Cuota mensual de marzo - $15,000',
        date: new Date('2024-03-15T00:00:00'),
        priority: 'high',
        read: false
      },
      {
        id: '5',
        type: 'task',
        title: 'Tarea Entregada',
        description: 'Proyecto de Ciencias Naturales',
        childName: 'Mateo García',
        date: new Date('2024-03-14T16:20:00'),
        priority: 'low',
        read: true
      },
      {
        id: '6',
        type: 'meeting',
        title: 'Reunión Programada',
        description: 'Reunión con la Directora - 25/03 a las 14:00',
        date: new Date('2024-03-13T11:00:00'),
        priority: 'medium',
        read: true
      }
    ];
    
    this.recentActivities.set(mockActivities);
  }

  private loadUpcomingEvents() {
    const mockEvents: UpcomingEvent[] = [
      {
        id: '1',
        type: 'exam',
        title: 'Examen de Matemáticas',
        description: 'Unidad 4: Fracciones y Decimales',
        date: new Date('2024-03-25T09:00:00'),
        childName: 'Sofia García',
        urgent: true
      },
      {
        id: '2',
        type: 'meeting',
        title: 'Reunión de Padres',
        description: 'Reunión general de 4to grado',
        date: new Date('2024-03-25T14:00:00'),
        location: 'Aula 4A',
        urgent: true
      },
      {
        id: '3',
        type: 'payment',
        title: 'Vencimiento de Cuota',
        description: 'Cuota mensual de abril',
        date: new Date('2024-04-10T23:59:00'),
        urgent: false
      },
      {
        id: '4',
        type: 'exam',
        title: 'Examen de Historia',
        description: 'Revolución de Mayo',
        date: new Date('2024-03-28T10:30:00'),
        childName: 'Mateo García',
        urgent: true
      },
      {
        id: '5',
        type: 'holiday',
        title: 'Día del Veterano',
        description: 'No hay clases',
        date: new Date('2024-04-02T00:00:00'),
        urgent: false
      },
      {
        id: '6',
        type: 'activity',
        title: 'Excursión al Museo',
        description: 'Visita al Museo de Ciencias Naturales',
        date: new Date('2024-04-05T08:00:00'),
        childName: 'Sofia García',
        location: 'Museo de Ciencias',
        urgent: false
      },
      {
        id: '7',
        type: 'meeting',
        title: 'Entrega de Boletines',
        description: 'Entrega de boletines del primer trimestre',
        date: new Date('2024-04-08T17:00:00'),
        location: 'Aulas correspondientes',
        urgent: false
      },
      {
        id: '8',
        type: 'activity',
        title: 'Acto del 25 de Mayo',
        description: 'Acto patrio - 25 de Mayo',
        date: new Date('2024-05-25T09:00:00'),
        location: 'Patio principal',
        urgent: false
      }
    ];
    
    this.upcomingEvents.set(mockEvents);
  }

  // Action methods
  selectChild(child: DashboardChild) {
    this.selectedChild.set(child);
  }

  markActivityAsRead(activity: RecentActivity) {
    const activities = this.recentActivities();
    const index = activities.findIndex(a => a.id === activity.id);
    if (index !== -1) {
      activities[index].read = true;
      this.recentActivities.set([...activities]);
    }
  }

  markAllActivitiesAsRead() {
    const activities = this.recentActivities().map(a => ({ ...a, read: true }));
    this.recentActivities.set(activities);
  }

  refreshDashboard() {
    this.loadDashboardData();
  }

  // Utility methods
  getActivityIcon(type: string): string {
    const icons = {
      grade: 'grade',
      attendance: 'event_available',
      task: 'assignment',
      payment: 'payment',
      message: 'message',
      meeting: 'event'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getActivityColor(type: string, priority: string): string {
    if (priority === 'high') return 'warn';
    if (priority === 'medium') return 'accent';
    
    const colors = {
      grade: 'primary',
      attendance: 'accent',
      task: 'warn',
      payment: 'warn',
      message: 'primary',
      meeting: 'accent'
    };
    return colors[type as keyof typeof colors] || 'primary';
  }

  getEventIcon(type: string): string {
    const icons = {
      exam: 'quiz',
      meeting: 'event',
      payment: 'payment',
      holiday: 'celebration',
      activity: 'sports'
    };
    return icons[type as keyof typeof icons] || 'event';
  }

  getEventColor(type: string): string {
    const colors = {
      exam: 'warn',
      meeting: 'primary',
      payment: 'accent',
      holiday: 'primary',
      activity: 'accent'
    };
    return colors[type as keyof typeof colors] || 'primary';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.round(diffInHours * 60);
      return `hace ${minutes} minutos`;
    } else if (diffInHours < 24) {
      const hours = Math.round(diffInHours);
      return `hace ${hours} horas`;
    } else {
      const days = Math.round(diffInHours / 24);
      return `hace ${days} días`;
    }
  }

  getDaysUntil(date: Date): number {
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getFilteredUpcomingEvents(): UpcomingEvent[] {
    return this.upcomingEvents().filter(e => !this.isToday(e.date));
  }

  getUnreadActivitiesCount(): number {
    return this.recentActivities().filter(a => !a.read).length;
  }

  isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  getAttendanceColor(percentage: number): string {
    if (percentage >= 95) return 'primary';
    if (percentage >= 85) return 'accent';
    return 'warn';
  }

  getGradeColor(grade: number): string {
    if (grade >= 8) return 'primary';
    if (grade >= 6) return 'accent';
    return 'warn';
  }

  getTasksColor(count: number): string {
    if (count === 0) return 'primary';
    if (count <= 2) return 'accent';
    return 'warn';
  }

  selectTab(index: number) {
    this.selectedTab.set(index);
  }
}