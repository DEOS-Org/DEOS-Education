import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicService } from '../../../../core/services/academic';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DivisionDetail {
  id: number;
  nombre: string;
  curso: {
    id: number;
    nombre: string;
    nivel: string;
  };
  alumnos: Array<{
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
  }>;
  profesores: Array<{
    id: number;
    nombre: string;
    apellido: string;
    materia: string;
  }>;
  materias: Array<{
    id: number;
    nombre: string;
    profesor: string;
  }>;
  registrosAsistencia: Array<{
    fecha: string;
    presentes: number;
    ausentes: number;
    tarde: number;
    total: number;
  }>;
}

@Component({
  selector: 'app-division-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './division-detail.html',
  styleUrl: './division-detail.scss'
})
export class DivisionDetailComponent implements OnInit, OnDestroy {
  isLoading = true;
  divisionId!: number;
  divisionDetail!: DivisionDetail;
  showAttendanceChart = false;
  attendanceChart: any;

  // Table columns
  alumnosColumns: string[] = ['dni', 'nombre', 'email', 'acciones'];
  profesoresColumns: string[] = ['nombre', 'materia', 'acciones'];
  materiasColumns: string[] = ['nombre', 'profesor', 'horario'];
  asistenciaColumns: string[] = ['fecha', 'presentes', 'ausentes', 'tarde', 'porcentaje'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academicService: AcademicService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.divisionId = +params['id'];
      this.loadDivisionDetail();
    });
  }

  loadDivisionDetail(): void {
    this.isLoading = true;
    this.academicService.getDivisionDetail(this.divisionId).subscribe({
      next: (detail) => {
        this.divisionDetail = detail;
        this.isLoading = false;
        // Create chart if needed
        if (this.showAttendanceChart) {
          setTimeout(() => this.createAttendanceChart(), 200);
        }
      },
      error: (error) => {
        console.error('Error loading division detail:', error);
        this.snackBar.open('Error al cargar los detalles de la división', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  calculateAttendancePercentage(record: any): number {
    if (record.total === 0) return 0;
    return Math.round((record.presentes / record.total) * 100);
  }

  backToList(): void {
    this.router.navigate(['/admin/academic']);
  }

  viewStudentDetail(student: any): void {
    this.router.navigate(['/admin/student', student.id], {
      queryParams: { 
        returnTo: 'division',
        divisionId: this.divisionId 
      }
    });
  }

  viewTeacherDetail(teacher: any): void {
    this.snackBar.open(`Ver detalle del profesor: ${teacher.nombre} ${teacher.apellido}`, 'Cerrar', {
      duration: 3000
    });
  }

  exportAttendance(): void {
    this.snackBar.open('Exportar asistencia - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  getTotalPresentes(): number {
    return this.divisionDetail.registrosAsistencia.reduce((sum, r) => sum + r.presentes, 0);
  }

  getTotalAusentes(): number {
    return this.divisionDetail.registrosAsistencia.reduce((sum, r) => sum + r.ausentes, 0);
  }

  getTotalTarde(): number {
    return this.divisionDetail.registrosAsistencia.reduce((sum, r) => sum + r.tarde, 0);
  }

  getPromedioAsistencia(): number {
    const registros = this.divisionDetail.registrosAsistencia;
    if (registros.length === 0) return 0;
    
    const totalAsistencia = registros.reduce((sum, r) => {
      return sum + (r.total > 0 ? (r.presentes / r.total) * 100 : 0);
    }, 0);
    
    return Math.round(totalAsistencia / registros.length);
  }

  formatDate(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  viewDayAttendance(registro: any): void {
    console.log('Navigation clicked:', registro);
    console.log('Division ID:', this.divisionId);
    console.log('Date:', registro.fecha);
    
    const fecha = registro.fecha;
    if (!fecha) {
      console.error('No fecha found in registro:', registro);
      return;
    }
    
    // Ensure date is in YYYY-MM-DD format
    const formattedDate = fecha instanceof Date ? 
      fecha.toISOString().split('T')[0] : 
      fecha.toString();
    
    console.log('Formatted date:', formattedDate);
    console.log('Navigating to:', `/admin/academic/division/${this.divisionId}/attendance/${formattedDate}`);
    
    this.router.navigate(['/admin/academic/division', this.divisionId, 'attendance', formattedDate], {
      queryParams: { 
        returnTo: 'division-detail'
      }
    });
  }

  createAttendanceChart(): void {
    try {
      const canvas = document.getElementById('divisionAttendanceChart') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Cannot get 2D context from canvas');
        return;
      }

      // Destroy existing chart
      if (this.attendanceChart) {
        this.attendanceChart.destroy();
      }

      // Debug logging
      console.log('Division Detail:', this.divisionDetail);
      console.log('Registros Asistencia:', this.divisionDetail?.registrosAsistencia);
      
      // Validate data
      if (!this.divisionDetail?.registrosAsistencia || this.divisionDetail.registrosAsistencia.length === 0) {
        console.warn('No attendance data available for chart');
        // Create sample data for testing
        this.createSampleChart(ctx);
        return;
      }

      const data = this.divisionDetail.registrosAsistencia.slice(0, 10).reverse();
      
      this.attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => new Date(d.fecha).toLocaleDateString('es-AR')),
          datasets: [
            {
              label: 'Presentes',
              data: data.map(d => d.presentes || 0),
              borderColor: 'var(--interactive-success)',
              backgroundColor: 'rgba(52, 199, 89, 0.1)',
              tension: 0.4,
              borderWidth: 3,
              pointBackgroundColor: 'var(--interactive-success)',
              pointBorderColor: 'var(--bg-elevated)',
              pointBorderWidth: 2,
              pointRadius: 6
            },
            {
              label: 'Ausentes',
              data: data.map(d => d.ausentes || 0),
              borderColor: 'var(--interactive-danger)',
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              tension: 0.4,
              borderWidth: 3,
              pointBackgroundColor: 'var(--interactive-danger)',
              pointBorderColor: 'var(--bg-elevated)',
              pointBorderWidth: 2,
              pointRadius: 6
            },
            {
              label: 'Tardanzas',
              data: data.map(d => d.tarde || 0),
              borderColor: 'var(--interactive-warning)',
              backgroundColor: 'rgba(255, 149, 0, 0.1)',
              tension: 0.4,
              borderWidth: 3,
              pointBackgroundColor: 'var(--interactive-warning)',
              pointBorderColor: 'var(--bg-elevated)',
              pointBorderWidth: 2,
              pointRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          backgroundColor: 'var(--bg-elevated)',
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: 'var(--text-primary)',
                font: {
                  family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  size: 14,
                  weight: 500
                },
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            title: {
              display: true,
              text: 'Tendencia de Asistencia (Últimos 10 días)',
              color: 'var(--text-primary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                size: 18,
                weight: 600
              },
              padding: 20
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
                  size: 12
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'var(--border-primary)',
                lineWidth: 1
              },
              ticks: {
                stepSize: 1,
                color: 'var(--text-secondary)',
                font: {
                  family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  size: 12
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          elements: {
            point: {
              hoverRadius: 8
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating attendance chart:', error);
      this.snackBar.open('Error al crear el gráfico de asistencia', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private createSampleChart(ctx: CanvasRenderingContext2D): void {
    // Create sample data for demonstration
    const sampleData = [
      { fecha: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), presentes: 25, ausentes: 3, tarde: 2 },
      { fecha: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), presentes: 27, ausentes: 1, tarde: 2 },
      { fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), presentes: 24, ausentes: 4, tarde: 2 },
      { fecha: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), presentes: 26, ausentes: 2, tarde: 2 },
      { fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), presentes: 28, ausentes: 0, tarde: 2 },
      { fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), presentes: 23, ausentes: 5, tarde: 2 },
      { fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), presentes: 29, ausentes: 1, tarde: 0 },
      { fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), presentes: 25, ausentes: 3, tarde: 2 },
      { fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), presentes: 27, ausentes: 1, tarde: 2 },
      { fecha: new Date(), presentes: 26, ausentes: 2, tarde: 2 }
    ];

    this.attendanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sampleData.map(d => d.fecha.toLocaleDateString('es-AR')),
        datasets: [
          {
            label: 'Presentes',
            data: sampleData.map(d => d.presentes),
            borderColor: 'var(--interactive-success)',
            backgroundColor: 'rgba(52, 199, 89, 0.1)',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: 'var(--interactive-success)',
            pointBorderColor: 'var(--bg-elevated)',
            pointBorderWidth: 2,
            pointRadius: 6
          },
          {
            label: 'Ausentes',
            data: sampleData.map(d => d.ausentes),
            borderColor: 'var(--interactive-danger)',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: 'var(--interactive-danger)',
            pointBorderColor: 'var(--bg-elevated)',
            pointBorderWidth: 2,
            pointRadius: 6
          },
          {
            label: 'Tardanzas',
            data: sampleData.map(d => d.tarde),
            borderColor: 'var(--interactive-warning)',
            backgroundColor: 'rgba(255, 149, 0, 0.1)',
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: 'var(--interactive-warning)',
            pointBorderColor: 'var(--bg-elevated)',
            pointBorderWidth: 2,
            pointRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'var(--bg-elevated)',
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'var(--text-primary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 14,
                weight: 500
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: 'Datos de Asistencia (Muestra de Ejemplo)',
            color: 'var(--text-primary)',
            font: {
              family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              size: 18,
              weight: 600
            },
            padding: 20
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
                size: 12
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'var(--border-primary)',
              lineWidth: 1
            },
            ticks: {
              stepSize: 1,
              color: 'var(--text-secondary)',
              font: {
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                size: 12
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    });
  }

  private createEmptyChart(ctx: CanvasRenderingContext2D): void {
    this.attendanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Sin datos'],
        datasets: [{
          label: 'No hay datos disponibles',
          data: [0],
          borderColor: 'var(--text-secondary)',
          backgroundColor: 'transparent'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'No hay registros de asistencia disponibles',
            color: 'var(--text-secondary)',
            font: {
              family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              size: 16,
              weight: 500
            }
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false
          }
        }
      }
    });
  }

  toggleAttendanceChart(): void {
    this.showAttendanceChart = !this.showAttendanceChart;
    if (this.showAttendanceChart) {
      // Wait for DOM update
      setTimeout(() => {
        this.createAttendanceChart();
      }, 100);
    } else if (this.attendanceChart) {
      this.attendanceChart.destroy();
      this.attendanceChart = null;
    }
  }

  ngOnDestroy(): void {
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }
  }

  removeStudentFromDivision(alumno: any): void {
    // TODO: Implementar remover estudiante de división
    this.snackBar.open('Función próximamente...', 'Cerrar', { duration: 3000 });
  }

  unassignTeacher(profesor: any): void {
    // TODO: Implementar desasignar profesor
    this.snackBar.open('Función próximamente...', 'Cerrar', { duration: 3000 });
  }
}