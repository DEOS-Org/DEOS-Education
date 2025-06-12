import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  route?: string;
}

interface RecentActivity {
  description: string;
  time: string;
  icon: string;
}

interface AttendanceStats {
  totalPresentes: number;
  totalAusentes: number;
  totalTarde: number;
  porcentajeAsistencia: number;
  trendPresentes: number;
  trendAusentes: number;
  promedioTardanzas: number;
}

interface AttendanceData {
  fecha: string;
  presentes: number;
  ausentes: number;
  tarde: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  recentActivities: RecentActivity[] = [];
  attendanceStats: AttendanceStats = {
    totalPresentes: 0,
    totalAusentes: 0,
    totalTarde: 0,
    porcentajeAsistencia: 0,
    trendPresentes: 0,
    trendAusentes: 0,
    promedioTardanzas: 0
  };
  
  // Chart instances
  dailyAttendanceChart: any;
  attendanceDistributionChart: any;
  weeklyTrendChart: any;
  
  // Chart data
  attendanceData: AttendanceData[] = [];
  showMonthlyView = false;
  isUsingDemoData = false;
  
  dashboardCards: DashboardCard[] = [
    {
      title: 'Total Usuarios',
      value: 0,
      icon: 'group',
      color: 'primary',
      route: '/admin/users'
    },
    {
      title: 'Estudiantes',
      value: 0,
      icon: 'school',
      color: 'accent',
      route: '/admin/users?role=alumno'
    },
    {
      title: 'Profesores',
      value: 0,
      icon: 'person',
      color: 'warn',
      route: '/admin/users?role=profesor'
    },
    {
      title: 'Padres/Tutores',
      value: 0,
      icon: 'family_restroom',
      color: 'primary',
      route: '/admin/users?role=padre'
    },
    {
      title: 'Cursos Activos',
      value: 0,
      icon: 'class',
      color: 'accent',
      route: '/admin/academic'
    },
    {
      title: 'Huellas Registradas',
      value: 0,
      icon: 'fingerprint',
      color: 'warn',
      route: '/admin/biometric/fingerprints'
    },
    {
      title: 'Dispositivos Activos',
      value: 0,
      icon: 'devices',
      color: 'primary',
      route: '/admin/devices'
    },
    {
      title: 'Registros Hoy',
      value: 0,
      icon: 'access_time',
      color: 'accent',
      route: '/admin/biometric/records'
    },
    {
      title: 'Registros Semana',
      value: 0,
      icon: 'calendar_week',
      color: 'warn',
      route: '/admin/biometric/records'
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAttendanceData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        // Actualizar las tarjetas con las estadísticas reales
        this.dashboardCards[0].value = stats.usuarios.total;
        this.dashboardCards[1].value = stats.usuarios.por_rol.alumnos;
        this.dashboardCards[2].value = stats.usuarios.por_rol.profesores;
        this.dashboardCards[3].value = stats.usuarios.por_rol.padres;
        this.dashboardCards[4].value = stats.academico.total_curso_divisiones;
        this.dashboardCards[5].value = stats.biometrico.total_huellas_registradas;
        this.dashboardCards[6].value = stats.biometrico.dispositivos_activos;
        this.dashboardCards[7].value = stats.biometrico.registros_hoy;
        this.dashboardCards[8].value = stats.biometrico.registros_esta_semana;
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.snackBar.open('Error al cargar los datos del dashboard', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        
        // Set default values on error
        this.dashboardCards.forEach(card => {
          card.value = card.title.includes('%') ? '0%' : 0;
        });
      }
    });
  }

  getCardClass(color: string): string {
    return `stat-card-${color}`;
  }

  getCardDescription(title: string): string {
    const descriptions: { [key: string]: string } = {
      'Total Usuarios': 'Total de usuarios registrados en el sistema',
      'Estudiantes': 'Alumnos matriculados actualmente',
      'Profesores': 'Docentes registrados en el sistema',
      'Padres/Tutores': 'Padres y tutores registrados',
      'Cursos Activos': 'Cursos y divisiones activas',
      'Huellas Registradas': 'Huellas dactilares en el sistema',
      'Dispositivos Activos': 'Dispositivos biométricos activos',
      'Registros Hoy': 'Registros de asistencia de hoy',
      'Registros Semana': 'Registros de esta semana'
    };
    return descriptions[title] || '';
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  navigateToCard(card: DashboardCard): void {
    if (!card.route) return;
    
    // Check if the route has query parameters
    if (card.route.includes('?')) {
      const [path, queryString] = card.route.split('?');
      const params: any = {};
      
      // Parse query parameters
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = value;
      });
      
      this.router.navigate([path], { queryParams: params });
    } else {
      this.router.navigate([card.route]);
    }
  }

  loadAttendanceData(): void {
    this.dashboardService.getAttendanceStats().subscribe({
      next: (data) => {
        this.attendanceStats = data.stats;
        this.attendanceData = data.weeklyData.length > 0 ? data.weeklyData : [];
        
        // If no real data, generate sample data for demonstration
        if (this.attendanceData.length === 0) {
          this.isUsingDemoData = true;
          this.generateSampleAttendanceData();
          this.calculateAttendanceStats();
        } else {
          this.isUsingDemoData = false;
        }
        
        // Create charts after a small delay to ensure DOM is ready
        setTimeout(() => {
          this.createDailyAttendanceChart();
          this.createAttendanceDistributionChart();
          this.createWeeklyTrendChart();
        }, 500);
      },
      error: (error) => {
        console.error('Error loading attendance data:', error);
        this.snackBar.open('Error al cargar datos de asistencia', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        
        // Fallback to sample data
        this.isUsingDemoData = true;
        this.generateSampleAttendanceData();
        this.calculateAttendanceStats();
        
        setTimeout(() => {
          this.createDailyAttendanceChart();
          this.createAttendanceDistributionChart();
          this.createWeeklyTrendChart();
        }, 500);
      }
    });
  }

  generateSampleAttendanceData(): void {
    // Generate last 7 days of sample data
    const today = new Date();
    this.attendanceData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Sample data based on typical school attendance
      const total = Math.floor(Math.random() * 50) + 250; // 250-300 students
      const presentes = Math.floor(total * (0.85 + Math.random() * 0.1)); // 85-95% attendance
      const tarde = Math.floor((total - presentes) * 0.3); // 30% of absences are late
      const ausentes = total - presentes - tarde;
      
      this.attendanceData.push({
        fecha: date.toISOString().split('T')[0],
        presentes,
        ausentes,
        tarde,
        total
      });
    }
  }

  calculateAttendanceStats(): void {
    if (this.attendanceData.length === 0) return;
    
    const today = this.attendanceData[this.attendanceData.length - 1];
    const yesterday = this.attendanceData.length > 1 ? this.attendanceData[this.attendanceData.length - 2] : today;
    
    this.attendanceStats = {
      totalPresentes: today.presentes,
      totalAusentes: today.ausentes,
      totalTarde: today.tarde,
      porcentajeAsistencia: Math.round((today.presentes / today.total) * 100),
      trendPresentes: Math.round(((today.presentes - yesterday.presentes) / yesterday.presentes) * 100),
      trendAusentes: Math.round(((today.ausentes - yesterday.ausentes) / yesterday.ausentes) * 100),
      promedioTardanzas: Math.round((this.attendanceData.reduce((sum, day) => sum + (day.tarde / day.total), 0) / this.attendanceData.length) * 100)
    };
  }

  createDailyAttendanceChart(): void {
    const canvas = document.getElementById('dailyAttendanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.dailyAttendanceChart) {
      this.dailyAttendanceChart.destroy();
    }

    this.dailyAttendanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.attendanceData.map(d => new Date(d.fecha).toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Presentes',
            data: this.attendanceData.map(d => d.presentes),
            backgroundColor: 'rgba(52, 199, 89, 0.8)',
            borderColor: '#34c759',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Tardanzas',
            data: this.attendanceData.map(d => d.tarde),
            backgroundColor: 'rgba(255, 149, 0, 0.8)',
            borderColor: '#ff9500',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Ausentes',
            data: this.attendanceData.map(d => d.ausentes),
            backgroundColor: 'rgba(255, 59, 48, 0.8)',
            borderColor: '#ff3b30',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'var(--text-primary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 12,
                weight: 500
              },
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: false
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              color: 'var(--border-primary)',
              lineWidth: 1
            },
            ticks: {
              color: 'var(--text-secondary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 11
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'var(--border-primary)',
              lineWidth: 1
            },
            ticks: {
              color: 'var(--text-secondary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 11
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  createAttendanceDistributionChart(): void {
    const canvas = document.getElementById('attendanceDistributionChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.attendanceDistributionChart) {
      this.attendanceDistributionChart.destroy();
    }

    // Calculate totals for pie chart
    const totals = this.attendanceData.reduce(
      (acc, day) => ({
        presentes: acc.presentes + day.presentes,
        tarde: acc.tarde + day.tarde,
        ausentes: acc.ausentes + day.ausentes
      }),
      { presentes: 0, tarde: 0, ausentes: 0 }
    );

    this.attendanceDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Presentes', 'Tardanzas', 'Ausentes'],
        datasets: [
          {
            data: [totals.presentes, totals.tarde, totals.ausentes],
            backgroundColor: [
              '#34c759',
              '#ff9500', 
              '#ff3b30'
            ],
            borderColor: 'var(--bg-elevated)',
            borderWidth: 3,
            hoverOffset: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'var(--text-primary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 12,
                weight: 500
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: false
          }
        },
        interaction: {
          intersect: false
        }
      }
    });
  }

  createWeeklyTrendChart(): void {
    const canvas = document.getElementById('weeklyTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.weeklyTrendChart) {
      this.weeklyTrendChart.destroy();
    }

    // Calculate attendance percentages
    const percentages = this.attendanceData.map(d => Math.round((d.presentes / d.total) * 100));

    this.weeklyTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.attendanceData.map(d => new Date(d.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Porcentaje de Asistencia',
            data: percentages,
            borderColor: '#007aff',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#007aff',
            pointBorderColor: 'var(--bg-elevated)',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'var(--border-primary)',
              lineWidth: 1
            },
            ticks: {
              color: 'var(--text-secondary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'var(--border-primary)',
              lineWidth: 1
            },
            ticks: {
              color: 'var(--text-secondary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 11
              },
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  toggleTimeframe(): void {
    this.showMonthlyView = !this.showMonthlyView;
    // TODO: Implement monthly view data loading
    this.snackBar.open('Vista mensual próximamente disponible', 'Cerrar', {
      duration: 3000
    });
  }

  ngOnDestroy(): void {
    if (this.dailyAttendanceChart) {
      this.dailyAttendanceChart.destroy();
    }
    if (this.attendanceDistributionChart) {
      this.attendanceDistributionChart.destroy();
    }
    if (this.weeklyTrendChart) {
      this.weeklyTrendChart.destroy();
    }
  }
}
