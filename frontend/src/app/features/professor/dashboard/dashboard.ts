import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth';
import { ProfessorService, DashboardData } from '../../../core/services/professor';

Chart.register(...registerables);

@Component({
  selector: 'app-professor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class ProfessorDashboardComponent implements OnInit, OnDestroy {
  // Reactive state with signals
  loading = signal(false);
  dashboardData = signal<DashboardData | null>(null);
  currentUser: any = null;

  // Computed properties
  estadisticas = computed(() => this.dashboardData()?.estadisticas);
  clasesRecientes = computed(() => this.dashboardData()?.clasesRecientes || []);
  actividadReciente = computed(() => this.dashboardData()?.actividadReciente || []);

  constructor(
    private router: Router,
    private authService: AuthService,
    private professorService: ProfessorService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    
    this.professorService.getDashboard().pipe(
      catchError((error) => {
        console.error('Error loading dashboard:', error);
        this.snackBar.open('Error al cargar datos del dashboard', 'Cerrar', { duration: 5000 });
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.dashboardData.set(data);
      }
      this.loading.set(false);
    });
  }

  // Navigation methods
  goToClasses(): void {
    this.router.navigate(['/professor/classes']);
  }

  goToAttendance(): void {
    this.router.navigate(['/professor/attendance']);
  }

  goToGrades(): void {
    this.router.navigate(['/professor/grades']);
  }

  goToStudents(): void {
    this.router.navigate(['/professor/students']);
  }

  goToSchedule(): void {
    this.router.navigate(['/professor/schedule']);
  }

  goToReports(): void {
    this.router.navigate(['/professor/reports']);
  }

  // Helper methods
  getScheduleTimeRange(schedule: any): string {
    if (!schedule?.hora_inicio || !schedule?.hora_fin) return 'Sin horario';
    return `${schedule.hora_inicio} - ${schedule.hora_fin}`;
  }

  formatActivityTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES');
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'asistencia': return 'fact_check';
      case 'calificacion': return 'grade';
      case 'clase': return 'school';
      case 'tarea': return 'assignment';
      default: return 'info';
    }
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.snackBar.open('Dashboard actualizado', 'Cerrar', { duration: 3000 });
  }

  // TrackBy functions for performance
  trackByClaseId(index: number, clase: any): any {
    return clase?.id || index;
  }

  trackByActivityId(index: number, activity: any): any {
    return activity?.id || index;
  }
}