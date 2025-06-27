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
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-parent-grades',
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
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './grades.html',
  styleUrl: './grades.scss'
})
export class ParentGradesComponent implements OnInit, OnDestroy {
  isLoading = true;
  children: any[] = [];
  allGrades: any[] = [];
  filteredGrades: any[] = [];
  groupedGrades: any[] = [];
  materias: any[] = [];
  
  // Filter controls
  selectedChildId: any = null;
  selectedMateriaId: any = null;
  selectedTrimestre: any = null;
  selectedPeriodo: number = new Date().getFullYear();
  periodosLectivos: number[] = [];

  // Summary data
  gradeSummary: any = null;

  // Table configuration
  displayedColumns: string[] = ['fecha', 'materia', 'evaluacion', 'calificacion', 'acciones'];

  // Charts
  private performanceChart: Chart | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializePeriods();
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

  private initializePeriods(): void {
    const currentYear = new Date().getFullYear();
    this.periodosLectivos = [currentYear, currentYear - 1, currentYear - 2];
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Mock data - En producción esto vendría del backend
    setTimeout(() => {
      this.children = [
        {
          alumno_id: 1,
          alumno_nombre: 'Juan Carlos Pérez González'
        },
        {
          alumno_id: 2,
          alumno_nombre: 'María Elena Pérez González'
        }
      ];

      this.allGrades = [
        {
          nota_id: 1,
          calificacion: 8.50,
          calificacion_concepto: 'Muy Bueno',
          titulo: 'Examen Primer Trimestre - Protocolos de Red',
          descripcion: 'Evaluación sobre TCP/IP y protocolos de comunicación',
          fecha_evaluacion: '2024-04-15',
          observaciones: 'Buen manejo de conceptos teóricos',
          trimestre: 1,
          periodo_lectivo: 2024,
          alumno_id: 1,
          alumno_nombre_completo: 'Juan Carlos Pérez González',
          materia_id: 1,
          materia_nombre: 'Comunicación de Datos',
          profesor_nombre_completo: 'Hector Correa',
          tipo_evaluacion_nombre: 'Examen'
        },
        {
          nota_id: 2,
          calificacion: 9.00,
          calificacion_concepto: 'Excelente',
          titulo: 'TP1 - Configuración de Red',
          descripcion: 'Trabajo práctico sobre configuración de switches',
          fecha_evaluacion: '2024-05-10',
          observaciones: 'Excelente implementación práctica',
          trimestre: 1,
          periodo_lectivo: 2024,
          alumno_id: 1,
          alumno_nombre_completo: 'Juan Carlos Pérez González',
          materia_id: 1,
          materia_nombre: 'Comunicación de Datos',
          profesor_nombre_completo: 'Hector Correa',
          tipo_evaluacion_nombre: 'Trabajo Práctico'
        },
        {
          nota_id: 3,
          calificacion: 7.75,
          calificacion_concepto: 'Bueno',
          titulo: 'Evaluación Oral - Modelo OSI',
          descripcion: 'Exposición sobre las capas del modelo OSI',
          fecha_evaluacion: '2024-05-20',
          observaciones: 'Buena explicación, faltó profundizar en capa física',
          trimestre: 1,
          periodo_lectivo: 2024,
          alumno_id: 1,
          alumno_nombre_completo: 'Juan Carlos Pérez González',
          materia_id: 1,
          materia_nombre: 'Comunicación de Datos',
          profesor_nombre_completo: 'Hector Correa',
          tipo_evaluacion_nombre: 'Oral'
        },
        {
          nota_id: 4,
          calificacion: 8.25,
          calificacion_concepto: 'Muy Bueno',
          titulo: 'Ensayo - Metodologías Ágiles',
          descripcion: 'Investigación sobre SCRUM y Kanban',
          fecha_evaluacion: '2024-04-20',
          observaciones: 'Análisis completo y bien estructurado',
          trimestre: 1,
          periodo_lectivo: 2024,
          alumno_id: 2,
          alumno_nombre_completo: 'María Elena Pérez González',
          materia_id: 2,
          materia_nombre: 'Lab de Software',
          profesor_nombre_completo: 'Daniel Quinteros',
          tipo_evaluacion_nombre: 'Ensayo'
        },
        {
          nota_id: 5,
          calificacion: 9.50,
          calificacion_concepto: 'Excelente',
          titulo: 'Proyecto - Sistema de Gestión',
          descripcion: 'Desarrollo de aplicación web con Node.js',
          fecha_evaluacion: '2024-06-01',
          observaciones: 'Código limpio y documentación excelente',
          trimestre: 2,
          periodo_lectivo: 2024,
          alumno_id: 2,
          alumno_nombre_completo: 'María Elena Pérez González',
          materia_id: 2,
          materia_nombre: 'Lab de Software',
          profesor_nombre_completo: 'Daniel Quinteros',
          tipo_evaluacion_nombre: 'Proyecto'
        }
      ];

      this.extractMaterias();
      this.calculateSummary();
      this.filterGrades();
      this.updateDisplayedColumns();
      
      this.isLoading = false;
      
      if (this.selectedChildId) {
        setTimeout(() => this.createPerformanceChart(), 100);
      }
    }, 1000);
  }

  private extractMaterias(): void {
    const materiasMap = new Map();
    this.allGrades.forEach(grade => {
      if (!materiasMap.has(grade.materia_id)) {
        materiasMap.set(grade.materia_id, {
          materia_id: grade.materia_id,
          materia_nombre: grade.materia_nombre
        });
      }
    });
    this.materias = Array.from(materiasMap.values());
  }

  private calculateSummary(): void {
    const filteredForSummary = this.getFilteredGradesForSummary();
    
    if (filteredForSummary.length === 0) {
      this.gradeSummary = null;
      return;
    }

    const totalGrades = filteredForSummary.length;
    const averageGrade = filteredForSummary.reduce((sum, grade) => sum + grade.calificacion, 0) / totalGrades;
    
    // Group by subject to count approved/at-risk subjects
    const subjectGroups = new Map();
    filteredForSummary.forEach(grade => {
      const key = `${grade.alumno_id}_${grade.materia_id}`;
      if (!subjectGroups.has(key)) {
        subjectGroups.set(key, []);
      }
      subjectGroups.get(key).push(grade);
    });

    let approvedSubjects = 0;
    let atRiskSubjects = 0;
    
    subjectGroups.forEach(grades => {
      const subjectAverage = grades.reduce((sum: number, grade: any) => sum + grade.calificacion, 0) / grades.length;
      if (subjectAverage >= 6.0) {
        approvedSubjects++;
      } else if (subjectAverage >= 4.0) {
        atRiskSubjects++;
      }
    });

    this.gradeSummary = {
      promedio_general: averageGrade,
      materias_aprobadas: approvedSubjects,
      materias_en_riesgo: atRiskSubjects,
      total_evaluaciones: totalGrades
    };
  }

  private getFilteredGradesForSummary(): any[] {
    let filtered = [...this.allGrades];
    
    if (this.selectedChildId) {
      filtered = filtered.filter(grade => grade.alumno_id == this.selectedChildId);
    }
    
    if (this.selectedPeriodo) {
      filtered = filtered.filter(grade => grade.periodo_lectivo == this.selectedPeriodo);
    }
    
    return filtered;
  }

  onChildSelected(): void {
    this.filterGrades();
    this.calculateSummary();
    this.updateDisplayedColumns();
    this.updatePerformanceChart();
  }

  filterGrades(): void {
    let filtered = [...this.allGrades];

    // Filter by child
    if (this.selectedChildId) {
      filtered = filtered.filter(grade => grade.alumno_id == this.selectedChildId);
    }

    // Filter by subject
    if (this.selectedMateriaId) {
      filtered = filtered.filter(grade => grade.materia_id == this.selectedMateriaId);
    }

    // Filter by trimester
    if (this.selectedTrimestre) {
      filtered = filtered.filter(grade => grade.trimestre == this.selectedTrimestre);
    }

    // Filter by period
    if (this.selectedPeriodo) {
      filtered = filtered.filter(grade => grade.periodo_lectivo == this.selectedPeriodo);
    }

    this.filteredGrades = filtered.sort((a, b) => 
      new Date(b.fecha_evaluacion).getTime() - new Date(a.fecha_evaluacion).getTime()
    );

    this.groupGradesBySubject();
    this.calculateSummary();
  }

  private groupGradesBySubject(): void {
    const groups = new Map();
    
    this.filteredGrades.forEach(grade => {
      const key = `${grade.materia_id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          materia_id: grade.materia_id,
          materia_nombre: grade.materia_nombre,
          profesor_nombre: grade.profesor_nombre_completo,
          calificaciones: [],
          promedio: 0,
          nota_maxima: 0,
          nota_minima: 10,
          tendencia: 'stable'
        });
      }
      groups.get(key).calificaciones.push(grade);
    });

    // Calculate statistics for each subject
    groups.forEach(subject => {
      const grades = subject.calificaciones.map((g: any) => g.calificacion);
      subject.promedio = grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length;
      subject.nota_maxima = Math.max(...grades);
      subject.nota_minima = Math.min(...grades);
      
      // Calculate trend (simplified)
      if (grades.length >= 2) {
        const recent = grades.slice(-2);
        if (recent[1] > recent[0]) {
          subject.tendencia = 'up';
        } else if (recent[1] < recent[0]) {
          subject.tendencia = 'down';
        }
      }
      
      // Sort grades by date
      subject.calificaciones.sort((a: any, b: any) => 
        new Date(b.fecha_evaluacion).getTime() - new Date(a.fecha_evaluacion).getTime()
      );
    });

    this.groupedGrades = Array.from(groups.values()).sort((a, b) => 
      a.materia_nombre.localeCompare(b.materia_nombre)
    );
  }

  private updateDisplayedColumns(): void {
    if (this.selectedChildId) {
      this.displayedColumns = ['fecha', 'materia', 'evaluacion', 'calificacion', 'acciones'];
    } else {
      this.displayedColumns = ['fecha', 'estudiante', 'materia', 'evaluacion', 'calificacion', 'acciones'];
    }
  }

  clearFilters(): void {
    this.selectedMateriaId = null;
    this.selectedTrimestre = null;
    this.filterGrades();
  }

  private createPerformanceChart(): void {
    if (!this.selectedChildId) return;
    
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Get grades for selected child grouped by month
    const childGrades = this.allGrades.filter(grade => 
      grade.alumno_id == this.selectedChildId && 
      grade.periodo_lectivo == this.selectedPeriodo
    );

    // Group by month and calculate averages
    const monthlyAverages = new Map();
    childGrades.forEach(grade => {
      const month = new Date(grade.fecha_evaluacion).toLocaleString('es-ES', { month: 'short' });
      if (!monthlyAverages.has(month)) {
        monthlyAverages.set(month, []);
      }
      monthlyAverages.get(month).push(grade.calificacion);
    });

    const labels: string[] = [];
    const data: number[] = [];
    
    monthlyAverages.forEach((grades, month) => {
      const average = grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length;
      labels.push(month);
      data.push(average);
    });

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Promedio Mensual',
          data,
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
            max: 10,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private updatePerformanceChart(): void {
    this.destroyCharts();
    if (this.selectedChildId) {
      setTimeout(() => this.createPerformanceChart(), 100);
    }
  }

  private destroyCharts(): void {
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = null;
    }
  }

  getSelectedChildName(): string {
    const child = this.children.find(c => c.alumno_id == this.selectedChildId);
    return child ? child.alumno_nombre : '';
  }

  getGradeClass(grade: number): string {
    if (grade >= 9) return 'excellent';
    if (grade >= 7) return 'good';
    if (grade >= 6) return 'satisfactory';
    return 'needs-improvement';
  }

  getProgressColor(grade: number): string {
    if (grade >= 8) return 'primary';
    if (grade >= 7) return 'accent';
    return 'warn';
  }

  getTrendClass(trend: string): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendText(trend: string): string {
    switch (trend) {
      case 'up': return 'Mejorando';
      case 'down': return 'Descendiendo';
      default: return 'Estable';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  viewGradeDetails(grade: any): void {
    // En producción aquí se abriría un diálogo con detalles completos
    this.snackBar.open(`Detalles de ${grade.titulo}`, 'Cerrar', { 
      duration: 3000 
    });
  }

  exportGrades(): void {
    // En producción aquí se exportarían las calificaciones
    this.snackBar.open('Exportando calificaciones...', 'Cerrar', { 
      duration: 3000 
    });
  }

  refreshData(): void {
    this.loadInitialData();
    this.snackBar.open('Información actualizada', 'Cerrar', { duration: 3000 });
  }
}