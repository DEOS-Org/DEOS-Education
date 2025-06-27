import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { ReportService, ReportFilters, AttendanceRecord, AcademicPerformanceRecord, StatisticsReport } from '../../../core/services/report';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent implements OnInit {
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef;
  @ViewChild('performanceChart') performanceChartRef!: ElementRef;
  @ViewChild('statisticsChart') statisticsChartRef!: ElementRef;

  filterForm: FormGroup;
  loading = false;
  selectedTabIndex = 0;

  // Datos de reportes
  attendanceData: AttendanceRecord[] = [];
  performanceData: AcademicPerformanceRecord[] = [];
  statisticsData: StatisticsReport | null = null;

  // Configuración de tablas
  attendanceColumns = ['nombre', 'apellido', 'dni', 'fecha', 'estado', 'ingreso', 'egreso', 'acciones'];
  performanceColumns = ['nombre', 'apellido', 'dni', 'curso', 'promedio_general', 'total_notas', 'acciones'];

  // Opciones de filtros
  cursosOptions = [
    { id: 1, nombre: '1° A' },
    { id: 2, nombre: '1° B' },
    { id: 3, nombre: '2° A' },
    { id: 4, nombre: '2° B' },
    { id: 5, nombre: '3° A' },
    { id: 6, nombre: '3° B' }
  ];

  periodoOptions = [
    { label: 'Última semana', dias: 7 },
    { label: 'Último mes', dias: 30 },
    { label: 'Últimos 3 meses', dias: 90 },
    { label: 'Último año', dias: 365 }
  ];

  // Charts
  attendanceChart: Chart | null = null;
  performanceChart: Chart | null = null;
  statisticsChart: Chart | null = null;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      fecha_desde: ['', Validators.required],
      fecha_hasta: ['', Validators.required],
      curso_division_id: [''],
      usuario_id: ['']
    });
  }

  ngOnInit() {
    this.initializeDates();
    this.loadInitialData();
  }

  initializeDates() {
    const dateRange = this.reportService.getDateRange(30); // Último mes por defecto
    this.filterForm.patchValue({
      fecha_desde: dateRange.fecha_desde,
      fecha_hasta: dateRange.fecha_hasta
    });
  }

  loadInitialData() {
    this.loadAttendanceReport();
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    
    switch (index) {
      case 0:
        this.loadAttendanceReport();
        break;
      case 1:
        this.loadPerformanceReport();
        break;
      case 2:
        this.loadStatisticsReport();
        break;
    }
  }

  onPeriodoChange(dias: number) {
    const dateRange = this.reportService.getDateRange(dias);
    this.filterForm.patchValue({
      fecha_desde: dateRange.fecha_desde,
      fecha_hasta: dateRange.fecha_hasta
    });
    this.onFilterChange();
  }

  onFilterChange() {
    if (this.filterForm.valid) {
      switch (this.selectedTabIndex) {
        case 0:
          this.loadAttendanceReport();
          break;
        case 1:
          this.loadPerformanceReport();
          break;
        case 2:
          this.loadStatisticsReport();
          break;
      }
    }
  }

  // === CARGA DE DATOS ===

  loadAttendanceReport() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.getAttendanceReport(filters).subscribe({
      next: (response) => {
        this.attendanceData = response.datos;
        this.createAttendanceChart();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance report:', error);
        this.showError('Error al cargar el reporte de asistencia');
        this.loading = false;
      }
    });
  }

  loadPerformanceReport() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.getAcademicPerformanceReport(filters).subscribe({
      next: (response) => {
        this.performanceData = response.datos;
        this.createPerformanceChart();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading performance report:', error);
        this.showError('Error al cargar el reporte de rendimiento');
        this.loading = false;
      }
    });
  }

  loadStatisticsReport() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.getStatisticsReport(filters).subscribe({
      next: (response) => {
        this.statisticsData = response;
        this.createStatisticsChart();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading statistics report:', error);
        this.showError('Error al cargar el reporte de estadísticas');
        this.loading = false;
      }
    });
  }

  // === GRÁFICOS ===

  createAttendanceChart() {
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }

    setTimeout(() => {
      if (!this.attendanceChartRef?.nativeElement) return;

      const estadosCounts = {
        presente: this.attendanceData.filter(r => r.estado === 'presente').length,
        ausente: this.attendanceData.filter(r => r.estado === 'ausente').length,
        tardanza: this.attendanceData.filter(r => r.estado === 'tardanza').length,
        incompleto: this.attendanceData.filter(r => r.estado === 'incompleto').length
      };

      const config: ChartConfiguration = {
        type: 'doughnut',
        data: {
          labels: ['Presente', 'Ausente', 'Tardanza', 'Incompleto'],
          datasets: [{
            data: [estadosCounts.presente, estadosCounts.ausente, estadosCounts.tardanza, estadosCounts.incompleto],
            backgroundColor: ['#4CAF50', '#F44336', '#FF9800', '#2196F3'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Distribución de Asistencia'
            }
          }
        }
      };

      this.attendanceChart = new Chart(this.attendanceChartRef.nativeElement, config);
    }, 100);
  }

  createPerformanceChart() {
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    setTimeout(() => {
      if (!this.performanceChartRef?.nativeElement) return;

      const promedios = this.performanceData
        .filter(p => p.promedio_general > 0)
        .map(p => p.promedio_general);

      const rangos = {
        sobresaliente: promedios.filter(p => p >= 8).length,
        regular: promedios.filter(p => p >= 6 && p < 8).length,
        en_riesgo: promedios.filter(p => p < 6).length
      };

      const config: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: ['Sobresaliente (8-10)', 'Regular (6-8)', 'En Riesgo (<6)'],
          datasets: [{
            label: 'Cantidad de Estudiantes',
            data: [rangos.sobresaliente, rangos.regular, rangos.en_riesgo],
            backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Distribución de Rendimiento Académico'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      };

      this.performanceChart = new Chart(this.performanceChartRef.nativeElement, config);
    }, 100);
  }

  createStatisticsChart() {
    if (this.statisticsChart) {
      this.statisticsChart.destroy();
    }

    setTimeout(() => {
      if (!this.statisticsChartRef?.nativeElement || !this.statisticsData) return;

      const asistencia = this.statisticsData.asistencia;
      
      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: Object.keys(asistencia.por_dia),
          datasets: [{
            label: 'Presentes',
            data: Object.values(asistencia.por_dia).map((dia: any) => dia.presentes),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.1
          }, {
            label: 'Ausentes',
            data: Object.values(asistencia.por_dia).map((dia: any) => dia.ausentes),
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Tendencia de Asistencia por Día de la Semana'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };

      this.statisticsChart = new Chart(this.statisticsChartRef.nativeElement, config);
    }, 100);
  }

  // === EXPORTACIONES ===

  exportAttendanceExcel() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.exportAttendanceToExcel(filters).subscribe({
      next: (blob) => {
        const filename = `reporte-asistencia-${new Date().getTime()}.xlsx`;
        this.reportService.downloadFile(blob, filename);
        this.showSuccess('Reporte exportado exitosamente');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exporting to Excel:', error);
        this.showError('Error al exportar a Excel');
        this.loading = false;
      }
    });
  }

  exportAttendancePDF() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.exportAttendanceToPDF(filters).subscribe({
      next: (blob) => {
        const filename = `reporte-asistencia-${new Date().getTime()}.pdf`;
        this.reportService.downloadFile(blob, filename);
        this.showSuccess('Reporte exportado exitosamente');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exporting to PDF:', error);
        this.showError('Error al exportar a PDF');
        this.loading = false;
      }
    });
  }

  exportPerformanceExcel() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.exportPerformanceToExcel(filters).subscribe({
      next: (blob) => {
        const filename = `reporte-rendimiento-${new Date().getTime()}.xlsx`;
        this.reportService.downloadFile(blob, filename);
        this.showSuccess('Reporte exportado exitosamente');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exporting to Excel:', error);
        this.showError('Error al exportar a Excel');
        this.loading = false;
      }
    });
  }

  exportPerformancePDF() {
    if (!this.filterForm.valid) return;

    this.loading = true;
    const filters: ReportFilters = this.filterForm.value;

    this.reportService.exportPerformanceToPDF(filters).subscribe({
      next: (blob) => {
        const filename = `reporte-rendimiento-${new Date().getTime()}.pdf`;
        this.reportService.downloadFile(blob, filename);
        this.showSuccess('Reporte exportado exitosamente');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exporting to PDF:', error);
        this.showError('Error al exportar a PDF');
        this.loading = false;
      }
    });
  }

  // === UTILIDADES ===

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'presente': return 'estado-presente';
      case 'ausente': return 'estado-ausente';
      case 'tardanza': return 'estado-tardanza';
      case 'incompleto': return 'estado-incompleto';
      default: return '';
    }
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
