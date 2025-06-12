import { Component, OnInit } from '@angular/core';
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
import { MatListModule } from '@angular/material/list';
import { UserService } from '../../../core/services/user';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StudentDetail {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  cursoDivision: {
    id: number;
    curso: string;
    division: string;
    nombreCompleto: string;
  };
  padres: Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  }>;
  asistencia: {
    resumen: {
      totalDias: number;
      diasPresente: number;
      diasAusente: number;
      diasTarde: number;
      porcentajeAsistencia: number;
    };
    ultimosRegistros: Array<{
      fecha: string;
      tipo: string;
      hora: string;
      dispositivo?: string;
    }>;
    asistenciaPorMes: Array<{
      mes: string;
      presentes: number;
      ausentes: number;
      tarde: number;
    }>;
  };
  materias: Array<{
    id: number;
    nombre: string;
    profesor: string;
    promedio?: number;
  }>;
}

@Component({
  selector: 'app-student-detail',
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
    MatListModule
  ],
  templateUrl: './student-detail.html',
  styleUrl: './student-detail.scss'
})
export class StudentDetailComponent implements OnInit {
  isLoading = true;
  studentId!: number;
  studentDetail!: StudentDetail;
  attendanceChart: any;
  returnTo: string = 'academic';
  divisionId?: number;

  // Table columns
  registrosColumns: string[] = ['fecha', 'tipo', 'hora', 'dispositivo'];
  materiasColumns: string[] = ['nombre', 'profesor', 'promedio'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.studentId = +params['id'];
      this.loadStudentDetail();
    });

    this.route.queryParams.subscribe(params => {
      this.returnTo = params['returnTo'] || 'academic';
      this.divisionId = params['divisionId'] ? +params['divisionId'] : undefined;
    });
  }

  loadStudentDetail(): void {
    this.isLoading = true;
    this.userService.getStudentDetail(this.studentId).subscribe({
      next: (detail) => {
        this.studentDetail = detail;
        this.isLoading = false;
        setTimeout(() => this.createAttendanceChart(), 100);
      },
      error: (error) => {
        console.error('Error loading student detail:', error);
        this.snackBar.open('Error al cargar los detalles del alumno', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  createAttendanceChart(): void {
    const canvas = document.getElementById('attendanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }

    const data = this.studentDetail.asistencia.asistenciaPorMes;
    
    this.attendanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.mes),
        datasets: [
          {
            label: 'Presentes',
            data: data.map(d => d.presentes),
            backgroundColor: '#4caf50',
            borderColor: '#388e3c',
            borderWidth: 1
          },
          {
            label: 'Ausentes',
            data: data.map(d => d.ausentes),
            backgroundColor: '#f44336',
            borderColor: '#d32f2f',
            borderWidth: 1
          },
          {
            label: 'Tarde',
            data: data.map(d => d.tarde),
            backgroundColor: '#ff9800',
            borderColor: '#f57c00',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Asistencia por Mes'
          }
        }
      }
    });
  }

  getAttendanceColor(porcentaje: number): string {
    if (porcentaje >= 90) return 'excellent';
    if (porcentaje >= 80) return 'good';
    if (porcentaje >= 70) return 'warning';
    return 'danger';
  }

  getTipoRegistroIcon(tipo: string): string {
    switch (tipo) {
      case 'ingreso':
        return 'login';
      case 'egreso':
        return 'logout';
      default:
        return 'help';
    }
  }

  getTipoRegistroColor(tipo: string): string {
    switch (tipo) {
      case 'ingreso':
        return 'primary';
      case 'egreso':
        return 'accent';
      default:
        return 'basic';
    }
  }

  backToList(): void {
    if (this.returnTo === 'division' && this.divisionId) {
      this.router.navigate(['/admin/academic/division', this.divisionId]);
    } else if (this.returnTo === 'users') {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/admin/academic']);
    }
  }

  editStudent(): void {
    this.snackBar.open('Editar alumno - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  contactParent(parent: any): void {
    this.snackBar.open(`Contactar a ${parent.nombre} ${parent.apellido}`, 'Cerrar', {
      duration: 3000
    });
  }

  generateReport(): void {
    this.snackBar.open('Generar reporte del alumno - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  ngOnDestroy(): void {
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }
  }
}