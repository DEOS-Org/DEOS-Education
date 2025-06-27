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
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { StudentService } from '../../../core/services/student.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-student-grades',
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
    MatInputModule,
    MatTabsModule,
    FormsModule
  ],
  template: `
    <div class="student-grades">
      <!-- Header -->
      <div class="grades-header">
        <div class="header-content">
          <h1>Mis Calificaciones</h1>
          <p>Historial académico y estadísticas de rendimiento</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshGrades()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-raised-button color="primary" (click)="exportGrades()" matTooltip="Exportar calificaciones">
            <mat-icon>file_download</mat-icon>
            Exportar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando calificaciones...</p>
      </div>

      <!-- Grades Content -->
      <div *ngIf="!isLoading" class="grades-content">
        <!-- Statistics Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card primary">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>trending_up</mat-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ gradeStats.average }}</div>
                  <div class="stat-label">Promedio General</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card success">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>school</mat-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ gradeStats.totalSubjects }}</div>
                  <div class="stat-label">Materias</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card accent">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>emoji_events</mat-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ gradeStats.bestGrade }}</div>
                  <div class="stat-label">Mejor Nota</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card info">
            <mat-card-content>
              <div class="stat-content">
                <mat-icon>assignment</mat-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ gradeStats.totalEvaluations }}</div>
                  <div class="stat-label">Evaluaciones</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Grades Evolution Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>timeline</mat-icon>
                Evolución de Notas
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas id="gradesEvolutionChart"></canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Subject Performance Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>bar_chart</mat-icon>
                Rendimiento por Materia
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas id="subjectPerformanceChart"></canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Tabs for different views -->
        <mat-tab-group>
          <!-- Subject Grades Tab -->
          <mat-tab label="Por Materia">
            <div class="tab-content">
              <!-- Subject Selection -->
              <mat-card class="filter-card">
                <mat-card-content>
                  <div class="filter-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Seleccionar Materia</mat-label>
                      <mat-select [(value)]="selectedSubjectId" (selectionChange)="loadSubjectGrades()">
                        <mat-option *ngFor="let subject of subjects" [value]="subject.id">
                          {{ subject.nombre }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Subject Grades Detail -->
              <mat-card *ngIf="selectedSubjectId" class="subject-detail-card">
                <mat-card-header>
                  <mat-card-title>
                    {{ getSelectedSubjectName() }}
                  </mat-card-title>
                  <mat-card-subtitle>
                    Promedio: {{ getSubjectAverage() }}
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="currentSubjectGrades.length === 0" class="no-data">
                    <mat-icon>grade</mat-icon>
                    <p>No hay calificaciones registradas para esta materia</p>
                  </div>

                  <div *ngIf="currentSubjectGrades.length > 0" class="grades-grid">
                    <div *ngFor="let grade of currentSubjectGrades" class="grade-card">
                      <div class="grade-header">
                        <div class="grade-type">
                          <mat-icon>{{ getGradeTypeIcon(grade.tipo) }}</mat-icon>
                          {{ grade.tipo | titlecase }}
                        </div>
                        <div class="grade-value" [class]="getGradeClass(grade.calificacion)">
                          {{ grade.calificacion }}
                        </div>
                      </div>
                      <div class="grade-details">
                        <div class="grade-evaluation">{{ grade.evaluacion }}</div>
                        <div class="grade-date">{{ formatDate(grade.fecha) }}</div>
                        <div *ngIf="grade.observaciones" class="grade-notes">
                          <mat-icon>note</mat-icon>
                          {{ grade.observaciones }}
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- All Grades Tab -->
          <mat-tab label="Todas las Calificaciones">
            <div class="tab-content">
              <!-- Filters -->
              <mat-card class="filter-card">
                <mat-card-content>
                  <div class="filter-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Materia</mat-label>
                      <mat-select [(value)]="filterSubject" (selectionChange)="applyFilters()">
                        <mat-option value="">Todas las materias</mat-option>
                        <mat-option *ngFor="let subject of subjects" [value]="subject.id">
                          {{ subject.nombre }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de Evaluación</mat-label>
                      <mat-select [(value)]="filterType" (selectionChange)="applyFilters()">
                        <mat-option value="">Todos los tipos</mat-option>
                        <mat-option value="examen">Examen</mat-option>
                        <mat-option value="parcial">Parcial</mat-option>
                        <mat-option value="trabajo-practico">Trabajo Práctico</mat-option>
                        <mat-option value="oral">Evaluación Oral</mat-option>
                        <mat-option value="proyecto">Proyecto</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Período</mat-label>
                      <mat-select [(value)]="filterPeriod" (selectionChange)="applyFilters()">
                        <mat-option value="">Todos los períodos</mat-option>
                        <mat-option value="1">1er Trimestre</mat-option>
                        <mat-option value="2">2do Trimestre</mat-option>
                        <mat-option value="3">3er Trimestre</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <button mat-raised-button (click)="clearFilters()" matTooltip="Limpiar filtros">
                      <mat-icon>clear</mat-icon>
                      Limpiar
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- All Grades Table -->
              <mat-card class="table-card">
                <mat-card-content>
                  <div *ngIf="filteredGrades.length === 0" class="no-data">
                    <mat-icon>grade</mat-icon>
                    <p>No hay calificaciones para mostrar</p>
                  </div>

                  <div *ngIf="filteredGrades.length > 0" class="table-container">
                    <table mat-table [dataSource]="filteredGrades" class="grades-table">
                      <!-- Date Column -->
                      <ng-container matColumnDef="fecha">
                        <th mat-header-cell *matHeaderCellDef>Fecha</th>
                        <td mat-cell *matCellDef="let grade">
                          {{ formatDate(grade.fecha) }}
                        </td>
                      </ng-container>

                      <!-- Subject Column -->
                      <ng-container matColumnDef="materia">
                        <th mat-header-cell *matHeaderCellDef>Materia</th>
                        <td mat-cell *matCellDef="let grade">{{ grade.materia }}</td>
                      </ng-container>

                      <!-- Type Column -->
                      <ng-container matColumnDef="tipo">
                        <th mat-header-cell *matHeaderCellDef>Tipo</th>
                        <td mat-cell *matCellDef="let grade">
                          <mat-chip [color]="getTypeColor(grade.tipo)">
                            <mat-icon>{{ getGradeTypeIcon(grade.tipo) }}</mat-icon>
                            {{ grade.tipo | titlecase }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <!-- Evaluation Column -->
                      <ng-container matColumnDef="evaluacion">
                        <th mat-header-cell *matHeaderCellDef>Evaluación</th>
                        <td mat-cell *matCellDef="let grade">{{ grade.evaluacion }}</td>
                      </ng-container>

                      <!-- Grade Column -->
                      <ng-container matColumnDef="calificacion">
                        <th mat-header-cell *matHeaderCellDef>Calificación</th>
                        <td mat-cell *matCellDef="let grade">
                          <div class="grade-display" [class]="getGradeClass(grade.calificacion)">
                            {{ grade.calificacion }}
                          </div>
                        </td>
                      </ng-container>

                      <!-- Notes Column -->
                      <ng-container matColumnDef="observaciones">
                        <th mat-header-cell *matHeaderCellDef>Observaciones</th>
                        <td mat-cell *matCellDef="let grade">
                          <span *ngIf="grade.observaciones" matTooltip="{{ grade.observaciones }}">
                            <mat-icon>note</mat-icon>
                          </span>
                          <span *ngIf="!grade.observaciones">-</span>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Performance Analysis Tab -->
          <mat-tab label="Análisis de Rendimiento">
            <div class="tab-content">
              <mat-card class="analysis-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>analytics</mat-icon>
                    Análisis de Rendimiento Académico
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="analysis-grid">
                    <div class="performance-item">
                      <div class="performance-header">
                        <mat-icon>trending_up</mat-icon>
                        <span>Materias con mejor rendimiento</span>
                      </div>
                      <div class="performance-list">
                        <div *ngFor="let item of bestPerformingSubjects" class="performance-entry">
                          <span class="subject-name">{{ item.materia }}</span>
                          <span class="subject-average good">{{ item.promedio }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="performance-item">
                      <div class="performance-header">
                        <mat-icon>trending_down</mat-icon>
                        <span>Materias que necesitan atención</span>
                      </div>
                      <div class="performance-list">
                        <div *ngFor="let item of needsImprovementSubjects" class="performance-entry">
                          <span class="subject-name">{{ item.materia }}</span>
                          <span class="subject-average needs-improvement">{{ item.promedio }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="performance-item">
                      <div class="performance-header">
                        <mat-icon>timeline</mat-icon>
                        <span>Tendencia general</span>
                      </div>
                      <div class="trend-info">
                        <div class="trend-indicator" [class]="generalTrend.direction">
                          <mat-icon>{{ generalTrend.icon }}</mat-icon>
                          <span>{{ generalTrend.text }}</span>
                        </div>
                        <p class="trend-description">{{ generalTrend.description }}</p>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styleUrl: './grades.scss'
})
export class StudentGradesComponent implements OnInit, OnDestroy {
  isLoading = true;
  currentUser: any = null;

  // Statistics
  gradeStats = {
    average: 0,
    totalSubjects: 0,
    bestGrade: 0,
    totalEvaluations: 0
  };

  // Data
  subjects: any[] = [];
  allGrades: any[] = [];
  filteredGrades: any[] = [];
  currentSubjectGrades: any[] = [];

  // Filters and selection
  selectedSubjectId: number | null = null;
  filterSubject: string = '';
  filterType: string = '';
  filterPeriod: string = '';

  // Table
  displayedColumns: string[] = ['fecha', 'materia', 'tipo', 'evaluacion', 'calificacion', 'observaciones'];

  // Performance analysis
  bestPerformingSubjects: any[] = [];
  needsImprovementSubjects: any[] = [];
  generalTrend: any = {};

  // Charts
  private evolutionChart: Chart | null = null;
  private performanceChart: Chart | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadGradesData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroyCharts();
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadGradesData(): void {
    this.isLoading = true;
    
    // Cargar estadísticas
    this.studentService.getStatistics().subscribe({
      next: (stats) => {
        this.processStatistics(stats);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.snackBar.open('Error al cargar estadísticas', 'Cerrar', { duration: 3000 });
      }
    });

    // Cargar calificaciones
    this.studentService.getGrades().subscribe({
      next: (grades) => {
        this.allGrades = this.processGradesData(grades);
        this.filteredGrades = [...this.allGrades];
        this.calculateStatistics();
        this.performAnalysis();
        this.isLoading = false;
        
        // Create charts after data is loaded
        setTimeout(() => {
          this.createCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.snackBar.open('Error al cargar calificaciones', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
        // Fallback a datos mock
        this.loadMockData();
      }
    });

    // Cargar materias
    this.loadSubjects();
  }

  private loadMockData(): void {
    // Mantener datos mock como fallback
    this.loadAllGrades();
    this.calculateStatistics();
    this.performAnalysis();
    this.isLoading = false;
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  private processGradesData(apiGrades: any[]): any[] {
    return apiGrades.map(grade => ({
      id: grade.id,
      materia: grade.materia_nombre,
      tipo: grade.tipo_evaluacion,
      evaluacion: grade.tipo_evaluacion,
      calificacion: grade.calificacion,
      fecha: grade.fecha,
      trimestre: grade.trimestre,
      observaciones: grade.observaciones
    }));
  }

  private processStatistics(stats: any[]): void {
    if (stats && stats.length > 0) {
      const currentStats = stats.find(s => s.trimestre === 3) || stats[0];
      this.gradeStats = {
        average: currentStats.promedio_general || 0,
        total: currentStats.total_notas || 0,
        passed: currentStats.notas_aprobadas || 0,
        failed: currentStats.notas_desaprobadas || 0,
        pending: currentStats.notas_pendientes || 0,
        bestGrade: currentStats.mejor_nota || 0,
        worstGrade: currentStats.peor_nota || 0,
        totalSubjects: currentStats.materias_con_notas || 0
      };
    }
  }

  private loadSubjects(): void {
    // Mock data
    this.subjects = [
      { id: 1, nombre: 'Matemática' },
      { id: 2, nombre: 'Lengua y Literatura' },
      { id: 3, nombre: 'Historia' },
      { id: 4, nombre: 'Ciencias Naturales' },
      { id: 5, nombre: 'Educación Física' }
    ];
  }

  private loadAllGrades(): void {
    // Mock data
    this.allGrades = [
      {
        id: 1,
        materia: 'Matemática',
        tipo: 'examen',
        evaluacion: 'Primer Parcial',
        calificacion: 8.5,
        fecha: '2024-11-15',
        trimestre: 3,
        observaciones: 'Excelente resolución de problemas'
      },
      {
        id: 2,
        materia: 'Matemática',
        tipo: 'trabajo-practico',
        evaluacion: 'TP Ecuaciones',
        calificacion: 9.0,
        fecha: '2024-11-20',
        trimestre: 3,
        observaciones: null
      },
      {
        id: 3,
        materia: 'Lengua y Literatura',
        tipo: 'oral',
        evaluacion: 'Análisis de texto',
        calificacion: 7.5,
        fecha: '2024-11-18',
        trimestre: 3,
        observaciones: 'Buena interpretación pero falta profundidad'
      },
      {
        id: 4,
        materia: 'Historia',
        tipo: 'examen',
        evaluacion: 'Revolución Industrial',
        calificacion: 6.5,
        fecha: '2024-11-22',
        trimestre: 3,
        observaciones: 'Estudiar más las fechas importantes'
      },
      {
        id: 5,
        materia: 'Ciencias Naturales',
        tipo: 'proyecto',
        evaluacion: 'Sistema Solar',
        calificacion: 9.5,
        fecha: '2024-11-25',
        trimestre: 3,
        observaciones: 'Presentación muy completa y creativa'
      }
    ];
  }

  private calculateStatistics(): void {
    const grades = this.allGrades.map(g => g.calificacion);
    this.gradeStats = {
      average: parseFloat((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)),
      totalSubjects: this.subjects.length,
      bestGrade: Math.max(...grades),
      totalEvaluations: this.allGrades.length
    };
  }

  private performAnalysis(): void {
    // Calculate averages by subject
    const subjectAverages = this.subjects.map(subject => {
      const subjectGrades = this.allGrades.filter(g => g.materia === subject.nombre);
      const average = subjectGrades.length > 0 
        ? parseFloat((subjectGrades.reduce((sum, g) => sum + g.calificacion, 0) / subjectGrades.length).toFixed(1))
        : 0;
      return { materia: subject.nombre, promedio: average };
    }).filter(s => s.promedio > 0);

    // Best performing subjects
    this.bestPerformingSubjects = subjectAverages
      .filter(s => s.promedio >= 8)
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 3);

    // Subjects needing improvement
    this.needsImprovementSubjects = subjectAverages
      .filter(s => s.promedio < 7)
      .sort((a, b) => a.promedio - b.promedio)
      .slice(0, 3);

    // General trend
    this.generalTrend = {
      direction: this.gradeStats.average >= 7 ? 'positive' : 'negative',
      icon: this.gradeStats.average >= 7 ? 'trending_up' : 'trending_down',
      text: this.gradeStats.average >= 7 ? 'Rendimiento positivo' : 'Necesita mejorar',
      description: this.gradeStats.average >= 7 
        ? 'Tu rendimiento académico está por encima del promedio esperado.'
        : 'Te recomendamos dedicar más tiempo al estudio y consultar con tus profesores.'
    };
  }

  loadSubjectGrades(): void {
    if (!this.selectedSubjectId) {
      this.currentSubjectGrades = [];
      return;
    }

    const selectedSubject = this.subjects.find(s => s.id === this.selectedSubjectId);
    if (selectedSubject) {
      this.currentSubjectGrades = this.allGrades.filter(g => g.materia === selectedSubject.nombre);
    }
  }

  getSelectedSubjectName(): string {
    if (!this.selectedSubjectId) return '';
    const subject = this.subjects.find(s => s.id === this.selectedSubjectId);
    return subject ? subject.nombre : '';
  }

  getSubjectAverage(): number {
    if (this.currentSubjectGrades.length === 0) return 0;
    const sum = this.currentSubjectGrades.reduce((total, grade) => total + grade.calificacion, 0);
    return parseFloat((sum / this.currentSubjectGrades.length).toFixed(1));
  }

  applyFilters(): void {
    this.filteredGrades = this.allGrades.filter(grade => {
      let matchesSubject = true;
      let matchesType = true;
      let matchesPeriod = true;

      if (this.filterSubject) {
        const subject = this.subjects.find(s => s.id.toString() === this.filterSubject);
        matchesSubject = subject ? grade.materia === subject.nombre : false;
      }

      if (this.filterType) {
        matchesType = grade.tipo === this.filterType;
      }

      if (this.filterPeriod) {
        matchesPeriod = grade.trimestre.toString() === this.filterPeriod;
      }

      return matchesSubject && matchesType && matchesPeriod;
    });
  }

  clearFilters(): void {
    this.filterSubject = '';
    this.filterType = '';
    this.filterPeriod = '';
    this.applyFilters();
  }

  getGradeClass(grade: number): string {
    if (grade >= 8) return 'excellent';
    if (grade >= 7) return 'good';
    if (grade >= 6) return 'satisfactory';
    return 'needs-improvement';
  }

  getGradeTypeIcon(type: string): string {
    switch (type) {
      case 'examen': return 'quiz';
      case 'parcial': return 'assignment';
      case 'trabajo-practico': return 'build';
      case 'oral': return 'record_voice_over';
      case 'proyecto': return 'science';
      default: return 'grade';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'examen': return 'warn';
      case 'parcial': return 'primary';
      case 'trabajo-practico': return 'accent';
      case 'oral': return '';
      case 'proyecto': return 'primary';
      default: return '';
    }
  }

  private createCharts(): void {
    this.createEvolutionChart();
    this.createPerformanceChart();
  }

  private createEvolutionChart(): void {
    const ctx = document.getElementById('gradesEvolutionChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Mock data for evolution
    const months = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'];
    const averages = [7.2, 7.5, 7.8, 8.1, 7.9, 8.3, 8.0, 8.2, 8.1];

    this.evolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Promedio Mensual',
          data: averages,
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
            max: 10
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

  private createPerformanceChart(): void {
    const ctx = document.getElementById('subjectPerformanceChart') as HTMLCanvasElement;
    if (!ctx) return;

    const subjectNames = this.subjects.map(s => s.nombre);
    const subjectAverages = [8.5, 7.5, 6.5, 9.0, 8.0]; // Mock data

    this.performanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: subjectNames,
        datasets: [{
          label: 'Promedio',
          data: subjectAverages,
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
        scales: {
          y: {
            beginAtZero: true,
            max: 10
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

  private destroyCharts(): void {
    if (this.evolutionChart) {
      this.evolutionChart.destroy();
      this.evolutionChart = null;
    }
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = null;
    }
  }

  refreshGrades(): void {
    this.loadGradesData();
    this.snackBar.open('Calificaciones actualizadas', 'Cerrar', { duration: 3000 });
  }

  exportGrades(): void {
    this.snackBar.open('Exportando calificaciones - En desarrollo', 'Cerrar', { duration: 3000 });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }
}