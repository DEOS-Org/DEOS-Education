import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { StudentService, StudentDashboard } from '../../../core/services/student';

Chart.register(...registerables);

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentUser: any = null;

  // Dashboard statistics
  stats = {
    attendancePercentage: 0,
    totalSubjects: 0,
    pendingAssignments: 0,
    averageGrade: 0,
    totalAbsences: 0,
    todayClasses: 0
  };

  // Student data
  mySubjects: any[] = [];
  todaySchedule: any[] = [];
  recentGrades: any[] = [];
  upcomingEvents: any[] = [];
  attendanceHistory: any[] = [];

  // Chart instances
  attendanceChart: Chart | null = null;
  gradesChart: Chart | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroyCharts();
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    const sub = this.studentService.getDashboard().subscribe({
      next: (dashboard: StudentDashboard) => {
        this.processDashboardData(dashboard);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.snackBar.open('Error al cargar el dashboard', 'Cerrar', { duration: 3000 });
        this.loadMockData(); // Fallback to mock data
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  private processDashboardData(dashboard: StudentDashboard): void {
    // Update user info
    if (dashboard.student) {
      this.currentUser = {
        ...this.currentUser,
        ...dashboard.student
      };
    }

    // Update stats
    this.stats.attendancePercentage = dashboard.attendance?.porcentajeSemanal || 0;
    this.stats.todayClasses = dashboard.todayClasses?.length || 0;
    
    // Process today's classes
    this.todaySchedule = dashboard.todayClasses || [];
    
    // Process recent grades
    this.recentGrades = dashboard.recentGrades || [];
    this.calculateAverageGradeFromData();
    
    // Process upcoming assignments
    this.upcomingEvents = dashboard.upcomingAssignments || [];
    
    // Create charts with real data
    this.createAttendanceChart();
    this.createGradesChart();
  }

  private calculateAverageGradeFromData(): void {
    if (this.recentGrades.length === 0) {
      this.stats.averageGrade = 0;
      return;
    }

    const total = this.recentGrades.reduce((sum, grade) => sum + (grade.nota || 0), 0);
    this.stats.averageGrade = Math.round((total / this.recentGrades.length) * 100) / 100;
  }

  private loadMockData(): void {
    this.loadStudentSubjects();
    this.loadTodaySchedule();
    this.loadAttendanceStats();
    this.loadRecentGrades();
    this.loadUpcomingEvents();
  }

  private loadStudentSubjects(): void {
    if (!this.currentUser?.id) return;

    // Mock data - En producción esto vendría del backend
    this.mySubjects = [
      {
        id: 1,
        nombre: 'Matemática',
        profesor: 'Prof. García',
        aula: 'Aula 101',
        proxima_clase: '2024-01-15 09:00',
        calificacion_promedio: 8.5
      },
      {
        id: 2,
        nombre: 'Lengua y Literatura',
        profesor: 'Prof. Martínez',
        aula: 'Aula 203',
        proxima_clase: '2024-01-15 10:00',
        calificacion_promedio: 9.0
      },
      {
        id: 3,
        nombre: 'Historia',
        profesor: 'Prof. López',
        aula: 'Aula 105',
        proxima_clase: '2024-01-15 11:00',
        calificacion_promedio: 7.8
      },
      {
        id: 4,
        nombre: 'Ciencias Naturales',
        profesor: 'Prof. Rodríguez',
        aula: 'Lab 1',
        proxima_clase: '2024-01-15 14:00',
        calificacion_promedio: 8.2
      }
    ];

    this.stats.totalSubjects = this.mySubjects.length;
    this.calculateAverageGrade();
  }

  private loadTodaySchedule(): void {
    // Mock data - En producción esto vendría del backend
    this.todaySchedule = [
      {
        hora_inicio: '08:00',
        hora_fin: '08:40',
        materia: 'Matemática',
        profesor: 'Prof. García',
        aula: 'Aula 101',
        estado: 'completada'
      },
      {
        hora_inicio: '08:40',
        hora_fin: '09:20',
        materia: 'Lengua y Literatura',
        profesor: 'Prof. Martínez',
        aula: 'Aula 203',
        estado: 'completada'
      },
      {
        hora_inicio: '09:20',
        hora_fin: '10:00',
        materia: 'Historia',
        profesor: 'Prof. López',
        aula: 'Aula 105',
        estado: 'actual'
      },
      {
        hora_inicio: '10:20',
        hora_fin: '11:00',
        materia: 'Ciencias Naturales',
        profesor: 'Prof. Rodríguez',
        aula: 'Lab 1',
        estado: 'pendiente'
      }
    ];

    this.stats.todayClasses = this.todaySchedule.length;
  }

  private loadAttendanceStats(): void {
    // Mock data - En producción esto vendría del backend
    this.attendanceHistory = [
      { fecha: '2024-01-08', estado: 'presente', total_clases: 4 },
      { fecha: '2024-01-09', estado: 'presente', total_clases: 4 },
      { fecha: '2024-01-10', estado: 'ausente', total_clases: 4 },
      { fecha: '2024-01-11', estado: 'presente', total_clases: 4 },
      { fecha: '2024-01-12', estado: 'presente', total_clases: 4 },
      { fecha: '2024-01-15', estado: 'presente', total_clases: 4 }
    ];

    // Calcular estadísticas
    const totalDays = this.attendanceHistory.length;
    const presentDays = this.attendanceHistory.filter(a => a.estado === 'presente').length;
    const absentDays = totalDays - presentDays;

    this.stats.attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    this.stats.totalAbsences = absentDays;

    this.createAttendanceChart();
    this.isLoading = false;
  }

  private loadRecentGrades(): void {
    // Mock data - En producción esto vendría del backend
    this.recentGrades = [
      {
        materia: 'Matemática',
        evaluacion: 'Examen Parcial',
        calificacion: 8.5,
        fecha: '2024-01-12',
        tipo: 'examen'
      },
      {
        materia: 'Lengua y Literatura',
        evaluacion: 'Ensayo',
        calificacion: 9.0,
        fecha: '2024-01-11',
        tipo: 'trabajo'
      },
      {
        materia: 'Historia',
        evaluacion: 'Quiz',
        calificacion: 7.5,
        fecha: '2024-01-10',
        tipo: 'quiz'
      },
      {
        materia: 'Ciencias Naturales',
        evaluacion: 'Laboratorio',
        calificacion: 8.8,
        fecha: '2024-01-09',
        tipo: 'practica'
      }
    ];

    this.createGradesChart();
  }

  private loadUpcomingEvents(): void {
    // Mock data - En producción esto vendría del backend
    this.upcomingEvents = [
      {
        titulo: 'Examen de Matemática',
        fecha: '2024-01-18',
        hora: '09:00',
        tipo: 'examen',
        materia: 'Matemática'
      },
      {
        titulo: 'Entrega Proyecto Historia',
        fecha: '2024-01-20',
        hora: '23:59',
        tipo: 'entrega',
        materia: 'Historia'
      },
      {
        titulo: 'Práctica de Laboratorio',
        fecha: '2024-01-22',
        hora: '14:00',
        tipo: 'practica',
        materia: 'Ciencias Naturales'
      }
    ];
  }

  private calculateAverageGrade(): void {
    if (this.mySubjects.length === 0) {
      this.stats.averageGrade = 0;
      return;
    }

    const total = this.mySubjects.reduce((sum, subject) => sum + (subject.calificacion_promedio || 0), 0);
    this.stats.averageGrade = Math.round((total / this.mySubjects.length) * 100) / 100;
  }

  private createAttendanceChart(): void {
    const canvas = document.getElementById('attendanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.destroyChart('attendanceChart');

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = this.attendanceHistory.map(a => {
      const date = new Date(a.fecha);
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    });

    const data = this.attendanceHistory.map(a => a.estado === 'presente' ? 1 : 0);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Asistencia',
          data,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              callback: function(value) {
                return value === 1 ? 'Presente' : 'Ausente';
              }
            }
          }
        }
      }
    };

    this.attendanceChart = new Chart(ctx, config);
  }

  private createGradesChart(): void {
    const canvas = document.getElementById('gradesChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.destroyChart('gradesChart');

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.recentGrades.map(g => g.materia),
        datasets: [{
          data: this.recentGrades.map(g => g.calificacion),
          backgroundColor: [
            '#2196f3',
            '#4caf50',
            '#ff9800',
            '#f44336'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    this.gradesChart = new Chart(ctx, config);
  }

  private destroyChart(chartId: string): void {
    if (chartId === 'attendanceChart' && this.attendanceChart) {
      this.attendanceChart.destroy();
      this.attendanceChart = null;
    } else if (chartId === 'gradesChart' && this.gradesChart) {
      this.gradesChart.destroy();
      this.gradesChart = null;
    }
  }

  private destroyCharts(): void {
    this.destroyChart('attendanceChart');
    this.destroyChart('gradesChart');
  }

  // Navigation methods
  goToSchedule(): void {
    // Navigate to schedule
  }

  goToAttendance(): void {
    // Navigate to attendance
  }

  goToGrades(): void {
    // Navigate to grades
  }

  goToSubjects(): void {
    // Navigate to subjects
  }

  // Helper methods
  getEventTypeColor(tipo: string): string {
    switch (tipo) {
      case 'examen': return 'warn';
      case 'entrega': return 'accent';
      case 'practica': return 'primary';
      default: return '';
    }
  }

  getGradeTypeIcon(tipo: string): string {
    switch (tipo) {
      case 'examen': return 'quiz';
      case 'trabajo': return 'assignment';
      case 'quiz': return 'help';
      case 'practica': return 'science';
      default: return 'grade';
    }
  }

  getScheduleStatusColor(estado: string): string {
    switch (estado) {
      case 'completada': return 'primary';
      case 'actual': return 'accent';
      case 'pendiente': return '';
      default: return '';
    }
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return date.toLocaleDateString('es-ES');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.snackBar.open('Dashboard actualizado', 'Cerrar', { duration: 3000 });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  formatTime(time: string): string {
    if (!time) return 'No especificado';
    return time.substring(0, 5);
  }

  getAttendanceColor(): string {
    const percentage = this.stats.attendancePercentage;
    if (percentage >= 90) return 'primary';
    if (percentage >= 75) return 'accent';
    return 'warn';
  }

  getGradeColor(nota: number): string {
    if (nota >= 8) return 'primary';
    if (nota >= 6) return 'accent';
    return 'warn';
  }
}