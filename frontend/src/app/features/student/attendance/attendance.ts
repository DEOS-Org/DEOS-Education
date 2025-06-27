import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { StudentService, AttendanceRecord, AttendanceStats } from '../../../core/services/student';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.scss'
})
export class StudentAttendanceComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentUser: any = null;

  // Statistics
  attendanceStats = {
    percentage: 0,
    present: 0,
    absent: 0,
    late: 0
  };

  // Attendance history
  attendanceHistory: any[] = [];
  filteredAttendanceHistory: any[] = [];
  displayedColumns: string[] = ['fecha', 'materia', 'hora', 'estado', 'hora_llegada', 'observaciones'];

  // Filters
  selectedSubject: string = '';
  selectedMonth: string = '';
  selectedStatus: string = '';
  availableSubjects: any[] = [];
  availableMonths = [
    { value: '01', name: 'Enero' },
    { value: '02', name: 'Febrero' },
    { value: '03', name: 'Marzo' },
    { value: '04', name: 'Abril' },
    { value: '05', name: 'Mayo' },
    { value: '06', name: 'Junio' },
    { value: '07', name: 'Julio' },
    { value: '08', name: 'Agosto' },
    { value: '09', name: 'Septiembre' },
    { value: '10', name: 'Octubre' },
    { value: '11', name: 'Noviembre' },
    { value: '12', name: 'Diciembre' }
  ];

  // Charts
  private monthlyChart: Chart | null = null;
  private subjectChart: Chart | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private snackBar: MatSnackBar
  ) {}

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadAttendanceData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroyCharts();
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadAttendanceData(): void {
    this.isLoading = true;
    
    // Mock data - En producción esto vendría del backend
    this.loadAttendanceStats();
    this.loadAttendanceHistory();
    this.loadAvailableSubjects();
    
    setTimeout(() => {
      this.isLoading = false;
      this.applyFilters();
      this.createCharts();
    }, 1000);
  }

  private loadAttendanceStats(): void {
    // Mock data
    this.attendanceStats = {
      percentage: 92,
      present: 138,
      absent: 12,
      late: 8
    };
  }

  private loadAttendanceHistory(): void {
    // Mock data - En producción esto vendría del backend
    this.attendanceHistory = [
      {
        fecha: '2024-12-06',
        materia: 'Matemática',
        hora: '08:00',
        estado: 'presente',
        hora_llegada: '07:58',
        observaciones: null
      },
      {
        fecha: '2024-12-06',
        materia: 'Lengua y Literatura',
        hora: '08:40',
        estado: 'presente',
        hora_llegada: '08:38',
        observaciones: null
      },
      {
        fecha: '2024-12-05',
        materia: 'Historia',
        hora: '09:40',
        estado: 'tarde',
        hora_llegada: '09:47',
        observaciones: 'Llegó 7 minutos tarde'
      },
      {
        fecha: '2024-12-05',
        materia: 'Ciencias Naturales',
        hora: '10:20',
        estado: 'presente',
        hora_llegada: '10:18',
        observaciones: null
      },
      {
        fecha: '2024-12-04',
        materia: 'Matemática',
        hora: '08:00',
        estado: 'ausente',
        hora_llegada: null,
        observaciones: 'Falta injustificada'
      },
      {
        fecha: '2024-12-04',
        materia: 'Educación Física',
        hora: '11:00',
        estado: 'justificado',
        hora_llegada: null,
        observaciones: 'Certificado médico presentado'
      }
    ];
  }

  private loadAvailableSubjects(): void {
    // Mock data
    this.availableSubjects = [
      { id: 1, nombre: 'Matemática' },
      { id: 2, nombre: 'Lengua y Literatura' },
      { id: 3, nombre: 'Historia' },
      { id: 4, nombre: 'Ciencias Naturales' },
      { id: 5, nombre: 'Educación Física' }
    ];
  }

  applyFilters(): void {
    this.filteredAttendanceHistory = this.attendanceHistory.filter(record => {
      let matchesSubject = true;
      let matchesMonth = true;
      let matchesStatus = true;

      if (this.selectedSubject) {
        const subject = this.availableSubjects.find(s => s.id.toString() === this.selectedSubject);
        matchesSubject = subject ? record.materia === subject.nombre : false;
      }

      if (this.selectedMonth) {
        const recordMonth = new Date(record.fecha).getMonth() + 1;
        matchesMonth = recordMonth.toString().padStart(2, '0') === this.selectedMonth;
      }

      if (this.selectedStatus) {
        matchesStatus = record.estado === this.selectedStatus;
      }

      return matchesSubject && matchesMonth && matchesStatus;
    });
  }

  clearFilters(): void {
    this.selectedSubject = '';
    this.selectedMonth = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'presente': return 'primary';
      case 'ausente': return 'warn';
      case 'tarde': return 'accent';
      case 'justificado': return '';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'presente': return 'check_circle';
      case 'ausente': return 'cancel';
      case 'tarde': return 'schedule';
      case 'justificado': return 'verified';
      default: return 'help';
    }
  }

  private createCharts(): void {
    this.createMonthlyAttendanceChart();
    this.createSubjectAttendanceChart();
  }

  private createMonthlyAttendanceChart(): void {
    const ctx = document.getElementById('monthlyAttendanceChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        datasets: [{
          label: 'Asistencia (%)',
          data: [95, 92, 88, 94, 90, 93, 89, 91, 94, 92, 88, 90],
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  private createSubjectAttendanceChart(): void {
    const ctx = document.getElementById('subjectAttendanceChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.subjectChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Matemática', 'Lengua', 'Historia', 'Ciencias', 'Ed. Física'],
        datasets: [{
          data: [95, 92, 88, 94, 90],
          backgroundColor: [
            '#2196f3',
            '#4caf50',
            '#ff9800',
            '#9c27b0',
            '#f44336'
          ]
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
    });
  }

  private destroyCharts(): void {
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = null;
    }
    if (this.subjectChart) {
      this.subjectChart.destroy();
      this.subjectChart = null;
    }
  }

  refreshAttendance(): void {
    this.loadAttendanceData();
    this.snackBar.open('Datos de asistencia actualizados', 'Cerrar', { duration: 3000 });
  }

  exportAttendance(): void {
    this.snackBar.open('Exportando datos - En desarrollo', 'Cerrar', { duration: 3000 });
  }
}