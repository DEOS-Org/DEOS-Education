import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    FormsModule
  ],
  template: `
    <div class="parent-attendance">
      <!-- Header -->
      <div class="attendance-header">
        <div class="header-content">
          <h1>Control de Asistencia</h1>
          <p>Seguimiento detallado de asistencia de tus hijos</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-stroked-button (click)="exportData()" color="primary">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando información de asistencia...</p>
      </div>

      <!-- Attendance Content -->
      <div *ngIf="!isLoading" class="attendance-content">
        
        <!-- Filter Controls -->
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Seleccionar hijo</mat-label>
                <mat-select [(value)]="selectedChildId" (selectionChange)="onChildSelected()">
                  <mat-option value="">Todos los hijos</mat-option>
                  <mat-option *ngFor="let child of children" [value]="child.id">
                    {{ child.nombre }} {{ child.apellido }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha desde</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="filterData()">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha hasta</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="filterData()">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select [(value)]="selectedStatus" (selectionChange)="filterData()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="presente">Presente</mat-option>
                  <mat-option value="ausente">Ausente</mat-option>
                  <mat-option value="tardanza">Tardanza</mat-option>
                  <mat-option value="justificada">Justificada</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-raised-button color="accent" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Quick Stats -->
        <div class="stats-grid">
          <mat-card class="stat-card" *ngFor="let stat of attendanceStats">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
          <!-- Monthly Attendance Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                Tendencia Mensual
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas id="monthlyChart"></canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Attendance Distribution -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>pie_chart</mat-icon>
                Distribución de Asistencia
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas id="distributionChart"></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Detailed Attendance Records -->
        <mat-card class="records-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>list</mat-icon>
              Registro Detallado de Asistencia
            </mat-card-title>
            <div class="header-actions">
              <mat-chip-set>
                <mat-chip *ngIf="selectedChildId" color="primary">
                  {{ getSelectedChildName() }}
                </mat-chip>
                <mat-chip *ngIf="filteredRecords.length > 0">
                  {{ filteredRecords.length }} registros
                </mat-chip>
              </mat-chip-set>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="filteredRecords.length === 0" class="no-data">
              <mat-icon>event_available</mat-icon>
              <p>No se encontraron registros de asistencia</p>
            </div>

            <div *ngIf="filteredRecords.length > 0" class="table-container">
              <table mat-table [dataSource]="filteredRecords" class="attendance-table">
                
                <!-- Date Column -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let record">
                    <div class="date-cell">
                      <div class="date-day">{{ formatDay(record.fecha) }}</div>
                      <div class="date-info">{{ formatDate(record.fecha) }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Student Column -->
                <ng-container matColumnDef="estudiante">
                  <th mat-header-cell *matHeaderCellDef>Estudiante</th>
                  <td mat-cell *matCellDef="let record">
                    <div class="student-cell">
                      <mat-icon class="student-icon">face</mat-icon>
                      <div class="student-info">
                        <div class="student-name">{{ record.estudiante_nombre }}</div>
                        <div class="student-course">{{ record.curso }} - {{ record.division }}</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let record">
                    <mat-chip [class]="record.estado" class="status-chip">
                      <mat-icon>{{ getStatusIcon(record.estado) }}</mat-icon>
                      {{ getStatusText(record.estado) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Time Column -->
                <ng-container matColumnDef="hora">
                  <th mat-header-cell *matHeaderCellDef>Hora</th>
                  <td mat-cell *matCellDef="let record">
                    <div class="time-cell">
                      <div class="time-value">{{ record.hora_entrada || 'N/A' }}</div>
                      <div class="time-label" *ngIf="record.hora_salida">Salida: {{ record.hora_salida }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Subject Column -->
                <ng-container matColumnDef="materia">
                  <th mat-header-cell *matHeaderCellDef>Materia</th>
                  <td mat-cell *matCellDef="let record">
                    <div class="subject-cell">
                      <span class="subject-name">{{ record.materia || 'General' }}</span>
                      <span class="subject-teacher" *ngIf="record.profesor">{{ record.profesor }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Observations Column -->
                <ng-container matColumnDef="observaciones">
                  <th mat-header-cell *matHeaderCellDef>Observaciones</th>
                  <td mat-cell *matCellDef="let record">
                    <div class="observations-cell">
                      <span *ngIf="record.observaciones" class="observation-text">
                        {{ record.observaciones }}
                      </span>
                      <span *ngIf="!record.observaciones" class="no-observations">
                        Sin observaciones
                      </span>
                    </div>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let record">
                    <div class="actions-cell">
                      <button mat-icon-button matTooltip="Ver detalles" (click)="viewRecordDetails(record)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Justificar falta" 
                              *ngIf="record.estado === 'ausente' && !record.justificada"
                              (click)="justifyAbsence(record)">
                        <mat-icon>note_add</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>

              <mat-paginator 
                [pageSizeOptions]="[10, 20, 50]" 
                showFirstLastButtons
                aria-label="Seleccionar página de registros">
              </mat-paginator>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Weekly Summary -->
        <mat-card class="weekly-summary-card" *ngIf="weeklyData.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>calendar_view_week</mat-icon>
              Resumen Semanal
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="weekly-grid">
              <div *ngFor="let day of weeklyData" class="day-summary" [class]="day.status">
                <div class="day-header">
                  <div class="day-name">{{ day.nombre }}</div>
                  <div class="day-date">{{ day.fecha }}</div>
                </div>
                <div class="day-status">
                  <mat-icon [style.color]="getStatusColor(day.status)">
                    {{ getStatusIcon(day.status) }}
                  </mat-icon>
                  <span class="status-text">{{ getStatusText(day.status) }}</span>
                </div>
                <div class="day-details" *ngIf="day.observaciones">
                  <span class="detail-text">{{ day.observaciones }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrl: './attendance.scss'
})
export class ParentAttendanceComponent implements OnInit, OnDestroy {
  isLoading = true;
  children: any[] = [];
  selectedChildId: any = null;
  attendanceRecords: any[] = [];
  filteredRecords: any[] = [];
  
  // Filter controls
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedStatus: string = '';

  // Statistics
  attendanceStats: any[] = [];
  weeklyData: any[] = [];

  // Table configuration
  displayedColumns: string[] = ['fecha', 'estudiante', 'estado', 'hora', 'materia', 'observaciones', 'acciones'];

  // Charts
  private monthlyChart: Chart | null = null;
  private distributionChart: Chart | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    
    // Check if specific child was requested
    this.route.queryParams.subscribe(params => {
      if (params['childId']) {
        this.selectedChildId = parseInt(params['childId']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroyCharts();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Mock data - En producción esto vendría del backend
    setTimeout(() => {
      this.children = [
        {
          id: 1,
          nombre: 'Juan Carlos',
          apellido: 'Pérez González',
          curso: '4to Año',
          division: 'A'
        },
        {
          id: 2,
          nombre: 'María Elena',
          apellido: 'Pérez González',
          curso: '2do Año',
          division: 'B'
        }
      ];

      this.attendanceRecords = [
        {
          id: 1,
          fecha: '2024-12-05',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          curso: '4to Año',
          division: 'A',
          estado: 'presente',
          hora_entrada: '07:45',
          hora_salida: '17:30',
          materia: 'Matemática',
          profesor: 'Prof. García',
          observaciones: ''
        },
        {
          id: 2,
          fecha: '2024-12-05',
          estudiante_id: 2,
          estudiante_nombre: 'María Elena Pérez González',
          curso: '2do Año',
          division: 'B',
          estado: 'presente',
          hora_entrada: '07:50',
          hora_salida: '16:30',
          materia: 'Lengua',
          profesor: 'Prof. Martínez',
          observaciones: ''
        },
        {
          id: 3,
          fecha: '2024-12-04',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          curso: '4to Año',
          division: 'A',
          estado: 'tardanza',
          hora_entrada: '08:15',
          hora_salida: '17:30',
          materia: 'Historia',
          profesor: 'Prof. López',
          observaciones: 'Llegó tarde por problemas de transporte'
        },
        {
          id: 4,
          fecha: '2024-12-03',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          curso: '4to Año',
          division: 'A',
          estado: 'ausente',
          hora_entrada: null,
          hora_salida: null,
          materia: 'General',
          profesor: null,
          observaciones: 'Enfermedad',
          justificada: true
        },
        {
          id: 5,
          fecha: '2024-12-02',
          estudiante_id: 2,
          estudiante_nombre: 'María Elena Pérez González',
          curso: '2do Año',
          division: 'B',
          estado: 'presente',
          hora_entrada: '07:45',
          hora_salida: '16:30',
          materia: 'Ciencias',
          profesor: 'Prof. Rodríguez',
          observaciones: ''
        }
      ];

      this.calculateStatistics();
      this.generateWeeklyData();
      this.filterData();
      this.isLoading = false;
      this.createCharts();
    }, 1000);
  }

  private calculateStatistics(): void {
    const records = this.selectedChildId 
      ? this.attendanceRecords.filter(r => r.estudiante_id == this.selectedChildId)
      : this.attendanceRecords;

    const totalDays = records.length;
    const presentDays = records.filter(r => r.estado === 'presente').length;
    const lateDays = records.filter(r => r.estado === 'tardanza').length;
    const absentDays = records.filter(r => r.estado === 'ausente').length;
    const justifiedDays = records.filter(r => r.justificada).length;

    const attendancePercentage = totalDays > 0 ? Math.round((presentDays + lateDays) / totalDays * 100) : 0;

    this.attendanceStats = [
      {
        icon: 'how_to_reg',
        color: '#4caf50',
        value: `${attendancePercentage}%`,
        label: 'Asistencia Total'
      },
      {
        icon: 'check_circle',
        color: '#2196f3',
        value: presentDays,
        label: 'Días Presentes'
      },
      {
        icon: 'schedule',
        color: '#ff9800',
        value: lateDays,
        label: 'Tardanzas'
      },
      {
        icon: 'cancel',
        color: '#f44336',
        value: absentDays,
        label: 'Faltas'
      },
      {
        icon: 'verified',
        color: '#7b1fa2',
        value: justifiedDays,
        label: 'Justificadas'
      }
    ];
  }

  private generateWeeklyData(): void {
    const today = new Date();
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    
    this.weeklyData = dayNames.map((name, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + index);
      
      const record = this.attendanceRecords.find(r => 
        new Date(r.fecha).toDateString() === date.toDateString() &&
        (!this.selectedChildId || r.estudiante_id == this.selectedChildId)
      );

      return {
        nombre: name,
        fecha: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        status: record?.estado || 'sin-datos',
        observaciones: record?.observaciones || ''
      };
    });
  }

  onChildSelected(): void {
    this.calculateStatistics();
    this.generateWeeklyData();
    this.filterData();
    this.updateCharts();
  }

  filterData(): void {
    let filtered = [...this.attendanceRecords];

    // Filter by child
    if (this.selectedChildId) {
      filtered = filtered.filter(record => record.estudiante_id == this.selectedChildId);
    }

    // Filter by date range
    if (this.startDate) {
      filtered = filtered.filter(record => new Date(record.fecha) >= this.startDate!);
    }
    if (this.endDate) {
      filtered = filtered.filter(record => new Date(record.fecha) <= this.endDate!);
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(record => record.estado === this.selectedStatus);
    }

    this.filteredRecords = filtered.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedStatus = '';
    this.filterData();
  }

  private createCharts(): void {
    this.createMonthlyChart();
    this.createDistributionChart();
  }

  private createMonthlyChart(): void {
    const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!ctx) return;

    const months = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const attendanceData = [95, 92, 88, 90, 93];

    this.monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Porcentaje de Asistencia',
          data: attendanceData,
          borderColor: '#7b1fa2',
          backgroundColor: 'rgba(123, 31, 162, 0.1)',
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
        }
      }
    });
  }

  private createDistributionChart(): void {
    const ctx = document.getElementById('distributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    const presentCount = this.attendanceStats.find(s => s.label === 'Días Presentes')?.value || 0;
    const lateCount = this.attendanceStats.find(s => s.label === 'Tardanzas')?.value || 0;
    const absentCount = this.attendanceStats.find(s => s.label === 'Faltas')?.value || 0;

    this.distributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Presentes', 'Tardanzas', 'Faltas'],
        datasets: [{
          data: [presentCount, lateCount, absentCount],
          backgroundColor: ['#4caf50', '#ff9800', '#f44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  private updateCharts(): void {
    this.destroyCharts();
    setTimeout(() => this.createCharts(), 100);
  }

  private destroyCharts(): void {
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = null;
    }
    if (this.distributionChart) {
      this.distributionChart.destroy();
      this.distributionChart = null;
    }
  }

  getSelectedChildName(): string {
    const child = this.children.find(c => c.id == this.selectedChildId);
    return child ? `${child.nombre} ${child.apellido}` : '';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'presente': return 'check_circle';
      case 'ausente': return 'cancel';
      case 'tardanza': return 'schedule';
      case 'justificada': return 'verified';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'presente': return 'Presente';
      case 'ausente': return 'Ausente';
      case 'tardanza': return 'Tardanza';
      case 'justificada': return 'Justificada';
      default: return 'Sin datos';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'presente': return '#4caf50';
      case 'ausente': return '#f44336';
      case 'tardanza': return '#ff9800';
      case 'justificada': return '#7b1fa2';
      default: return '#9e9e9e';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDay(dateString: string): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[new Date(dateString).getDay()];
  }

  viewRecordDetails(record: any): void {
    // En producción aquí se abriría un diálogo con detalles completos
    this.snackBar.open(`Detalles del registro: ${record.fecha}`, 'Cerrar', { 
      duration: 3000 
    });
  }

  justifyAbsence(record: any): void {
    // En producción aquí se abriría un diálogo para justificar la falta
    this.snackBar.open('Función de justificación pendiente de implementar', 'Cerrar', { 
      duration: 3000 
    });
  }

  exportData(): void {
    // En producción aquí se exportarían los datos
    this.snackBar.open('Exportando datos de asistencia...', 'Cerrar', { 
      duration: 3000 
    });
  }

  refreshData(): void {
    this.loadInitialData();
    this.snackBar.open('Información actualizada', 'Cerrar', { duration: 3000 });
  }
}