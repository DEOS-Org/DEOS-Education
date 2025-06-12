import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademicService } from '../../../core/services/academic';

interface DailyAttendanceDetail {
  division: {
    id: number;
    nombre: string;
    curso_nombre: string;
  };
  fecha: string;
  estadisticas: {
    total_estudiantes: number;
    presentes: number;
    ausentes: number;
    tarde: number;
    porcentaje_asistencia: number;
  };
  registros: Array<{
    id: number;
    estudiante: {
      id: number;
      nombre: string;
      apellido: string;
      dni: string;
    };
    tipo: 'ingreso' | 'egreso';
    hora: string;
    dispositivo: string;
    estado: 'presente' | 'ausente' | 'tarde';
  }>;
  estudiantes_ausentes: Array<{
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  }>;
}

@Component({
  selector: 'app-daily-attendance-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './daily-attendance-detail.html',
  styleUrl: './daily-attendance-detail.scss'
})
export class DailyAttendanceDetailComponent implements OnInit {
  isLoading = true;
  divisionId!: number;
  fecha!: string;
  attendanceDetail!: DailyAttendanceDetail;

  // Table columns
  registrosColumns: string[] = ['estudiante', 'tipo', 'hora', 'dispositivo', 'estado'];
  ausentesColumns: string[] = ['dni', 'nombre'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academicService: AcademicService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.divisionId = +params['id'];
      this.fecha = params['fecha'];
      this.loadDailyAttendanceDetail();
    });
  }

  loadDailyAttendanceDetail(): void {
    this.isLoading = true;
    this.academicService.getDailyAttendanceDetail(this.divisionId, this.fecha).subscribe({
      next: (detail) => {
        this.attendanceDetail = detail;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading daily attendance detail:', error);
        this.snackBar.open('Error al cargar los detalles de asistencia del día', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  backToDivision(): void {
    this.router.navigate(['/admin/academic/division', this.divisionId]);
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

  formatTime(hora: string): string {
    return hora.substring(0, 5); // Remove seconds
  }

  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'presente': 'presente',
      'tarde': 'tarde',
      'ausente': 'ausente'
    };
    return classes[estado] || 'presente';
  }

  getEstadoIcon(estado: string): string {
    const icons: { [key: string]: string } = {
      'presente': 'check_circle',
      'tarde': 'schedule',
      'ausente': 'cancel'
    };
    return icons[estado] || 'check_circle';
  }

  getTipoIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'ingreso': 'login',
      'egreso': 'logout'
    };
    return icons[tipo] || 'login';
  }

  exportAttendanceReport(): void {
    this.snackBar.open('Exportar reporte de asistencia - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  sendAbsentNotifications(): void {
    this.snackBar.open('Enviar notificaciones a ausentes - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  viewStudentDetail(student: any): void {
    this.router.navigate(['/admin/student', student.id], {
      queryParams: { 
        returnTo: 'daily-attendance',
        divisionId: this.divisionId,
        fecha: this.fecha
      }
    });
  }

  markLateArrival(student: any): void {
    this.snackBar.open(`Marcar llegada tarde para ${student.nombre} ${student.apellido}`, 'Cerrar', {
      duration: 3000
    });
  }

  markManualAttendance(student: any): void {
    this.snackBar.open(`Marcar asistencia manual para ${student.nombre} ${student.apellido}`, 'Cerrar', {
      duration: 3000
    });
  }

  getAttendancePercentageClass(): string {
    const percentage = this.attendanceDetail.estadisticas.porcentaje_asistencia;
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'warning';
    return 'poor';
  }
}