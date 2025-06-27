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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-parent-assignments',
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
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatDividerModule,
    FormsModule
  ],
  template: `
    <div class="parent-assignments">
      <!-- Header -->
      <div class="assignments-header">
        <div class="header-content">
          <h1>Tareas y Asignaciones</h1>
          <p>Seguimiento de las tareas académicas de tus hijos</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-stroked-button (click)="viewCalendar()" color="primary">
            <mat-icon>calendar_month</mat-icon>
            Ver Calendario
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando tareas...</p>
      </div>

      <!-- Assignments Content -->
      <div *ngIf="!isLoading" class="assignments-content">
        
        <!-- Filter Controls -->
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Seleccionar hijo</mat-label>
                <mat-select [(value)]="selectedChildId" (selectionChange)="onChildSelected()">
                  <mat-option value="">Todos los hijos</mat-option>
                  <mat-option *ngFor="let child of children" [value]="child.alumno_id">
                    {{ child.alumno_nombre }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select [(value)]="selectedStatus" (selectionChange)="filterAssignments()">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="pendiente">Pendientes</mat-option>
                  <mat-option value="en-progreso">En Progreso</mat-option>
                  <mat-option value="completada">Completadas</mat-option>
                  <mat-option value="vencida">Vencidas</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Materia</mat-label>
                <mat-select [(value)]="selectedMateriaId" (selectionChange)="filterAssignments()">
                  <mat-option value="">Todas las materias</mat-option>
                  <mat-option *ngFor="let materia of materias" [value]="materia">
                    {{ materia }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha límite desde</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="filterAssignments()">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha límite hasta</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="filterAssignments()">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <button mat-raised-button color="accent" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Summary Cards -->
        <div class="summary-grid">
          <mat-card class="summary-card urgent">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #f44336">assignment_late</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ getAssignmentCountByStatus('vencida') }}</div>
                  <div class="summary-label">Tareas Vencidas</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card warning">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #ff9800">schedule</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ getUrgentAssignments() }}</div>
                  <div class="summary-label">Próximas a Vencer</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card info">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #2196f3">assignment</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ getAssignmentCountByStatus('pendiente') }}</div>
                  <div class="summary-label">Pendientes</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card success">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #4caf50">assignment_turned_in</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ getAssignmentCountByStatus('completada') }}</div>
                  <div class="summary-label">Completadas</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Actions -->
        <mat-card class="quick-actions-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>flash_on</mat-icon>
              Acciones Rápidas
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quick-actions">
              <button mat-raised-button color="warn" (click)="showOverdueTasks()" 
                      [disabled]="getAssignmentCountByStatus('vencida') === 0">
                <mat-icon>priority_high</mat-icon>
                Ver Tareas Vencidas
              </button>
              <button mat-raised-button color="accent" (click)="showUpcomingTasks()">
                <mat-icon>today</mat-icon>
                Tareas de Esta Semana
              </button>
              <button mat-raised-button (click)="showProgressReport()">
                <mat-icon>analytics</mat-icon>
                Reporte de Progreso
              </button>
              <button mat-stroked-button (click)="exportAssignments()">
                <mat-icon>download</mat-icon>
                Exportar Tareas
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Progress Chart -->
        <mat-card class="chart-card" *ngIf="selectedChildId">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>timeline</mat-icon>
              Progreso de Tareas - {{ getSelectedChildName() }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas id="progressChart"></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Assignments by Status -->
        <mat-card class="status-assignments-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>view_module</mat-icon>
              Tareas por Estado
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <mat-tab label="Urgentes">
                <div class="tab-content">
                  <div class="assignments-grid">
                    <div *ngFor="let assignment of getUrgentAssignmentsList()" class="assignment-card urgent">
                      <div class="assignment-header">
                        <div class="assignment-meta">
                          <mat-chip class="subject-chip">{{ assignment.materia }}</mat-chip>
                          <mat-chip [class]="assignment.estado" class="status-chip">
                            <mat-icon>{{ getStatusIcon(assignment.estado) }}</mat-icon>
                            {{ getStatusText(assignment.estado) }}
                          </mat-chip>
                        </div>
                        <div class="due-date" [class]="getDueDateClass(assignment.fecha_vencimiento)">
                          <mat-icon>schedule</mat-icon>
                          {{ formatDueDate(assignment.fecha_vencimiento) }}
                        </div>
                      </div>
                      
                      <div class="assignment-content">
                        <h3 class="assignment-title">{{ assignment.titulo }}</h3>
                        <p class="assignment-description">{{ assignment.descripcion }}</p>
                        
                        <div class="assignment-details">
                          <div class="detail-item">
                            <mat-icon>person</mat-icon>
                            <span>{{ assignment.estudiante_nombre }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>school</mat-icon>
                            <span>{{ assignment.profesor }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>event</mat-icon>
                            <span>Asignada: {{ formatDate(assignment.fecha_asignacion) }}</span>
                          </div>
                        </div>

                        <div class="assignment-progress" *ngIf="assignment.progreso !== undefined">
                          <div class="progress-header">
                            <span>Progreso: {{ assignment.progreso }}%</span>
                            <span class="progress-status" [class]="getProgressStatusClass(assignment.progreso)">
                              {{ getProgressStatusText(assignment.progreso) }}
                            </span>
                          </div>
                          <mat-progress-bar 
                            mode="determinate" 
                            [value]="assignment.progreso"
                            [color]="getProgressColor(assignment.progreso)">
                          </mat-progress-bar>
                        </div>
                      </div>

                      <div class="assignment-actions">
                        <button mat-button (click)="viewAssignmentDetails(assignment)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                        <button mat-button color="primary" (click)="contactTeacher(assignment)">
                          <mat-icon>email</mat-icon>
                          Contactar Profesor
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="getUrgentAssignmentsList().length === 0" class="no-assignments">
                    <mat-icon>check_circle</mat-icon>
                    <p>¡Excelente! No hay tareas urgentes</p>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Pendientes">
                <div class="tab-content">
                  <div class="assignments-grid">
                    <div *ngFor="let assignment of getAssignmentsByStatus('pendiente')" class="assignment-card pending">
                      <div class="assignment-header">
                        <div class="assignment-meta">
                          <mat-chip class="subject-chip">{{ assignment.materia }}</mat-chip>
                          <mat-chip [class]="assignment.estado" class="status-chip">
                            <mat-icon>{{ getStatusIcon(assignment.estado) }}</mat-icon>
                            {{ getStatusText(assignment.estado) }}
                          </mat-chip>
                        </div>
                        <div class="due-date" [class]="getDueDateClass(assignment.fecha_vencimiento)">
                          <mat-icon>schedule</mat-icon>
                          {{ formatDueDate(assignment.fecha_vencimiento) }}
                        </div>
                      </div>
                      
                      <div class="assignment-content">
                        <h3 class="assignment-title">{{ assignment.titulo }}</h3>
                        <p class="assignment-description">{{ assignment.descripcion }}</p>
                        
                        <div class="assignment-details">
                          <div class="detail-item" *ngIf="!selectedChildId">
                            <mat-icon>person</mat-icon>
                            <span>{{ assignment.estudiante_nombre }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>school</mat-icon>
                            <span>{{ assignment.profesor }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>event</mat-icon>
                            <span>Asignada: {{ formatDate(assignment.fecha_asignacion) }}</span>
                          </div>
                        </div>

                        <div class="assignment-progress" *ngIf="assignment.progreso !== undefined">
                          <div class="progress-header">
                            <span>Progreso: {{ assignment.progreso }}%</span>
                            <span class="progress-status" [class]="getProgressStatusClass(assignment.progreso)">
                              {{ getProgressStatusText(assignment.progreso) }}
                            </span>
                          </div>
                          <mat-progress-bar 
                            mode="determinate" 
                            [value]="assignment.progreso"
                            [color]="getProgressColor(assignment.progreso)">
                          </mat-progress-bar>
                        </div>
                      </div>

                      <div class="assignment-actions">
                        <button mat-button (click)="viewAssignmentDetails(assignment)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                        <button mat-button color="primary" (click)="contactTeacher(assignment)">
                          <mat-icon>email</mat-icon>
                          Contactar Profesor
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="getAssignmentsByStatus('pendiente').length === 0" class="no-assignments">
                    <mat-icon>assignment_turned_in</mat-icon>
                    <p>No hay tareas pendientes</p>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="En Progreso">
                <div class="tab-content">
                  <div class="assignments-grid">
                    <div *ngFor="let assignment of getAssignmentsByStatus('en-progreso')" class="assignment-card in-progress">
                      <div class="assignment-header">
                        <div class="assignment-meta">
                          <mat-chip class="subject-chip">{{ assignment.materia }}</mat-chip>
                          <mat-chip [class]="assignment.estado" class="status-chip">
                            <mat-icon>{{ getStatusIcon(assignment.estado) }}</mat-icon>
                            {{ getStatusText(assignment.estado) }}
                          </mat-chip>
                        </div>
                        <div class="due-date" [class]="getDueDateClass(assignment.fecha_vencimiento)">
                          <mat-icon>schedule</mat-icon>
                          {{ formatDueDate(assignment.fecha_vencimiento) }}
                        </div>
                      </div>
                      
                      <div class="assignment-content">
                        <h3 class="assignment-title">{{ assignment.titulo }}</h3>
                        <p class="assignment-description">{{ assignment.descripcion }}</p>
                        
                        <div class="assignment-details">
                          <div class="detail-item" *ngIf="!selectedChildId">
                            <mat-icon>person</mat-icon>
                            <span>{{ assignment.estudiante_nombre }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>school</mat-icon>
                            <span>{{ assignment.profesor }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>event</mat-icon>
                            <span>Asignada: {{ formatDate(assignment.fecha_asignacion) }}</span>
                          </div>
                        </div>

                        <div class="assignment-progress">
                          <div class="progress-header">
                            <span>Progreso: {{ assignment.progreso }}%</span>
                            <span class="progress-status" [class]="getProgressStatusClass(assignment.progreso)">
                              {{ getProgressStatusText(assignment.progreso) }}
                            </span>
                          </div>
                          <mat-progress-bar 
                            mode="determinate" 
                            [value]="assignment.progreso"
                            [color]="getProgressColor(assignment.progreso)">
                          </mat-progress-bar>
                        </div>
                      </div>

                      <div class="assignment-actions">
                        <button mat-button (click)="viewAssignmentDetails(assignment)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                        <button mat-button color="primary" (click)="contactTeacher(assignment)">
                          <mat-icon>email</mat-icon>
                          Contactar Profesor
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="getAssignmentsByStatus('en-progreso').length === 0" class="no-assignments">
                    <mat-icon>hourglass_empty</mat-icon>
                    <p>No hay tareas en progreso</p>
                  </div>
                </div>
              </mat-tab>

              <mat-tab label="Completadas">
                <div class="tab-content">
                  <div class="assignments-grid">
                    <div *ngFor="let assignment of getAssignmentsByStatus('completada')" class="assignment-card completed">
                      <div class="assignment-header">
                        <div class="assignment-meta">
                          <mat-chip class="subject-chip">{{ assignment.materia }}</mat-chip>
                          <mat-chip [class]="assignment.estado" class="status-chip">
                            <mat-icon>{{ getStatusIcon(assignment.estado) }}</mat-icon>
                            {{ getStatusText(assignment.estado) }}
                          </mat-chip>
                        </div>
                        <div class="completion-date">
                          <mat-icon>check_circle</mat-icon>
                          Completada: {{ formatDate(assignment.fecha_completada) }}
                        </div>
                      </div>
                      
                      <div class="assignment-content">
                        <h3 class="assignment-title">{{ assignment.titulo }}</h3>
                        <p class="assignment-description">{{ assignment.descripcion }}</p>
                        
                        <div class="assignment-details">
                          <div class="detail-item" *ngIf="!selectedChildId">
                            <mat-icon>person</mat-icon>
                            <span>{{ assignment.estudiante_nombre }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>school</mat-icon>
                            <span>{{ assignment.profesor }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>grade</mat-icon>
                            <span *ngIf="assignment.calificacion">Nota: {{ assignment.calificacion }}</span>
                            <span *ngIf="!assignment.calificacion">Sin calificar</span>
                          </div>
                        </div>

                        <div class="assignment-progress">
                          <div class="progress-header">
                            <span>Progreso: 100%</span>
                            <span class="progress-status completed">Completada</span>
                          </div>
                          <mat-progress-bar mode="determinate" [value]="100" color="primary"></mat-progress-bar>
                        </div>
                      </div>

                      <div class="assignment-actions">
                        <button mat-button (click)="viewAssignmentDetails(assignment)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                        <button mat-button *ngIf="assignment.calificacion" (click)="viewGrade(assignment)">
                          <mat-icon>grade</mat-icon>
                          Ver Calificación
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="getAssignmentsByStatus('completada').length === 0" class="no-assignments">
                    <mat-icon>assignment</mat-icon>
                    <p>No hay tareas completadas</p>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrl: './assignments.scss'
})
export class ParentAssignmentsComponent implements OnInit, OnDestroy {
  isLoading = true;
  children: any[] = [];
  allAssignments: any[] = [];
  filteredAssignments: any[] = [];
  materias: string[] = [];
  
  // Filter controls
  selectedChildId: any = null;
  selectedStatus: string = '';
  selectedMateriaId: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Charts
  private progressChart: Chart | null = null;

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
          alumno_id: 1,
          alumno_nombre: 'Juan Carlos Pérez González'
        },
        {
          alumno_id: 2,
          alumno_nombre: 'María Elena Pérez González'
        }
      ];

      this.allAssignments = [
        {
          id: 1,
          titulo: 'Ensayo sobre Revolución Industrial',
          descripcion: 'Escribir un ensayo de 1000 palabras sobre las causas y consecuencias de la Revolución Industrial.',
          materia: 'Historia',
          profesor: 'Prof. López',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          fecha_asignacion: '2024-11-20',
          fecha_vencimiento: '2024-12-08',
          fecha_completada: null,
          estado: 'pendiente',
          progreso: 0,
          calificacion: null,
          prioridad: 'media',
          instrucciones: 'Consultar bibliografía recomendada. Mínimo 3 fuentes académicas.'
        },
        {
          id: 2,
          titulo: 'Ejercicios de Derivadas',
          descripcion: 'Resolver ejercicios 1-20 del capítulo 5 sobre derivadas y aplicaciones.',
          materia: 'Matemática',
          profesor: 'Prof. García',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          fecha_asignacion: '2024-11-25',
          fecha_vencimiento: '2024-12-10',
          fecha_completada: null,
          estado: 'en-progreso',
          progreso: 65,
          calificacion: null,
          prioridad: 'alta',
          instrucciones: 'Revisar teoría antes de resolver. Mostrar todos los pasos.'
        },
        {
          id: 3,
          titulo: 'Proyecto de Ciencias - Sistema Solar',
          descripcion: 'Crear una maqueta del sistema solar con materiales reciclables.',
          materia: 'Ciencias Naturales',
          profesor: 'Prof. Rodríguez',
          estudiante_id: 2,
          estudiante_nombre: 'María Elena Pérez González',
          fecha_asignacion: '2024-11-15',
          fecha_vencimiento: '2024-12-05',
          fecha_completada: '2024-12-04',
          estado: 'completada',
          progreso: 100,
          calificacion: 9.5,
          prioridad: 'alta',
          instrucciones: 'Incluir información sobre cada planeta. Presentación oral de 5 minutos.'
        },
        {
          id: 4,
          titulo: 'Informe de Laboratorio - Química',
          descripcion: 'Escribir informe sobre el experimento de reacciones químicas realizado en clase.',
          materia: 'Química',
          profesor: 'Prof. Morales',
          estudiante_id: 2,
          estudiante_nombre: 'María Elena Pérez González',
          fecha_asignacion: '2024-12-01',
          fecha_vencimiento: '2024-12-15',
          fecha_completada: null,
          estado: 'pendiente',
          progreso: 0,
          calificacion: null,
          prioridad: 'media',
          instrucciones: 'Seguir formato de informe científico. Incluir conclusiones personales.'
        },
        {
          id: 5,
          titulo: 'Lectura Comprensiva - Don Quijote',
          descripcion: 'Leer capítulos 1-5 de Don Quijote y responder cuestionario.',
          materia: 'Lengua y Literatura',
          profesor: 'Prof. Martínez',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          fecha_asignacion: '2024-11-18',
          fecha_vencimiento: '2024-12-06',
          fecha_completada: null,
          estado: 'vencida',
          progreso: 30,
          calificacion: null,
          prioridad: 'alta',
          instrucciones: 'Tomar notas durante la lectura. Prestar atención a los personajes principales.'
        },
        {
          id: 6,
          titulo: 'Ejercicios de Programación - Arrays',
          descripcion: 'Implementar 5 algoritmos de ordenamiento usando arrays en Python.',
          materia: 'Programación',
          profesor: 'Prof. Sánchez',
          estudiante_id: 1,
          estudiante_nombre: 'Juan Carlos Pérez González',
          fecha_asignacion: '2024-12-02',
          fecha_vencimiento: '2024-12-09',
          fecha_completada: null,
          estado: 'en-progreso',
          progreso: 40,
          calificacion: null,
          prioridad: 'alta',
          instrucciones: 'Documentar cada algoritmo. Incluir análisis de complejidad temporal.'
        }
      ];

      this.extractMaterias();
      this.filterAssignments();
      
      this.isLoading = false;
      
      if (this.selectedChildId) {
        setTimeout(() => this.createProgressChart(), 100);
      }
    }, 1000);
  }

  private extractMaterias(): void {
    const materiasSet = new Set(this.allAssignments.map(assignment => assignment.materia));
    this.materias = Array.from(materiasSet).sort();
  }

  onChildSelected(): void {
    this.filterAssignments();
    this.updateProgressChart();
  }

  filterAssignments(): void {
    let filtered = [...this.allAssignments];

    // Filter by child
    if (this.selectedChildId) {
      filtered = filtered.filter(assignment => assignment.estudiante_id == this.selectedChildId);
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(assignment => assignment.estado === this.selectedStatus);
    }

    // Filter by subject
    if (this.selectedMateriaId) {
      filtered = filtered.filter(assignment => assignment.materia === this.selectedMateriaId);
    }

    // Filter by date range
    if (this.startDate) {
      filtered = filtered.filter(assignment => new Date(assignment.fecha_vencimiento) >= this.startDate!);
    }
    if (this.endDate) {
      filtered = filtered.filter(assignment => new Date(assignment.fecha_vencimiento) <= this.endDate!);
    }

    this.filteredAssignments = filtered.sort((a, b) => {
      // Sort by priority and due date
      const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
      const aPriority = priorityOrder[a.prioridad as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.prioridad as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime();
    });
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.selectedMateriaId = '';
    this.startDate = null;
    this.endDate = null;
    this.filterAssignments();
  }

  private createProgressChart(): void {
    if (!this.selectedChildId) return;
    
    const ctx = document.getElementById('progressChart') as HTMLCanvasElement;
    if (!ctx) return;

    const childAssignments = this.filteredAssignments.filter(a => a.estudiante_id == this.selectedChildId);
    
    // Group by subject and calculate completion rates
    const subjectStats = new Map();
    childAssignments.forEach(assignment => {
      if (!subjectStats.has(assignment.materia)) {
        subjectStats.set(assignment.materia, { total: 0, completed: 0, avgProgress: 0 });
      }
      const stats = subjectStats.get(assignment.materia);
      stats.total++;
      if (assignment.estado === 'completada') stats.completed++;
      stats.avgProgress += assignment.progreso;
    });

    const labels: string[] = [];
    const completionData: number[] = [];
    const progressData: number[] = [];

    subjectStats.forEach((stats, subject) => {
      labels.push(subject);
      completionData.push((stats.completed / stats.total) * 100);
      progressData.push(stats.avgProgress / stats.total);
    });

    this.progressChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Tareas Completadas (%)',
            data: completionData,
            backgroundColor: 'rgba(123, 31, 162, 0.7)',
            borderColor: '#7b1fa2',
            borderWidth: 1
          },
          {
            label: 'Progreso Promedio (%)',
            data: progressData,
            backgroundColor: 'rgba(156, 39, 176, 0.5)',
            borderColor: '#9c27b0',
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

  private updateProgressChart(): void {
    this.destroyCharts();
    if (this.selectedChildId) {
      setTimeout(() => this.createProgressChart(), 100);
    }
  }

  private destroyCharts(): void {
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
    }
  }

  getSelectedChildName(): string {
    const child = this.children.find(c => c.alumno_id == this.selectedChildId);
    return child ? child.alumno_nombre : '';
  }

  getAssignmentCountByStatus(status: string): number {
    return this.filteredAssignments.filter(assignment => assignment.estado === status).length;
  }

  getAssignmentsByStatus(status: string): any[] {
    return this.filteredAssignments.filter(assignment => assignment.estado === status);
  }

  getUrgentAssignments(): number {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    return this.filteredAssignments.filter(assignment => {
      const dueDate = new Date(assignment.fecha_vencimiento);
      return assignment.estado !== 'completada' && 
             assignment.estado !== 'vencida' && 
             dueDate <= threeDaysFromNow;
    }).length;
  }

  getUrgentAssignmentsList(): any[] {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    return this.filteredAssignments.filter(assignment => {
      const dueDate = new Date(assignment.fecha_vencimiento);
      return assignment.estado !== 'completada' && 
             assignment.estado !== 'vencida' && 
             dueDate <= threeDaysFromNow;
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pendiente': return 'assignment';
      case 'en-progreso': return 'hourglass_empty';
      case 'completada': return 'assignment_turned_in';
      case 'vencida': return 'assignment_late';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en-progreso': return 'En Progreso';
      case 'completada': return 'Completada';
      case 'vencida': return 'Vencida';
      default: return 'Desconocido';
    }
  }

  getDueDateClass(dueDate: string): string {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'warning';
    return 'normal';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'primary';
    if (progress >= 50) return 'accent';
    return 'warn';
  }

  getProgressStatusClass(progress: number): string {
    if (progress >= 80) return 'high-progress';
    if (progress >= 50) return 'medium-progress';
    if (progress > 0) return 'low-progress';
    return 'no-progress';
  }

  getProgressStatusText(progress: number): string {
    if (progress >= 80) return 'Casi terminada';
    if (progress >= 50) return 'Avanzando bien';
    if (progress > 0) return 'Comenzada';
    return 'Sin comenzar';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDueDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Vencida hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Vence mañana';
    return `Vence en ${diffDays} días`;
  }

  // Action methods
  showOverdueTasks(): void {
    this.selectedStatus = 'vencida';
    this.filterAssignments();
    this.snackBar.open('Mostrando tareas vencidas', 'Cerrar', { duration: 3000 });
  }

  showUpcomingTasks(): void {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    this.startDate = today;
    this.endDate = weekFromNow;
    this.selectedStatus = '';
    this.filterAssignments();
    this.snackBar.open('Mostrando tareas de esta semana', 'Cerrar', { duration: 3000 });
  }

  showProgressReport(): void {
    // En producción esto abriría un diálogo con reporte detallado
    this.snackBar.open('Generando reporte de progreso...', 'Cerrar', { duration: 3000 });
  }

  viewCalendar(): void {
    this.router.navigate(['/parent/calendar']);
  }

  exportAssignments(): void {
    this.snackBar.open('Exportando tareas...', 'Cerrar', { duration: 3000 });
  }

  viewAssignmentDetails(assignment: any): void {
    this.snackBar.open(`Ver detalles: ${assignment.titulo}`, 'Cerrar', { duration: 3000 });
  }

  contactTeacher(assignment: any): void {
    this.snackBar.open(`Contactar a ${assignment.profesor}`, 'Cerrar', { duration: 3000 });
  }

  viewGrade(assignment: any): void {
    this.router.navigate(['/parent/grades'], { 
      queryParams: { 
        childId: assignment.estudiante_id,
        assignment: assignment.id 
      } 
    });
  }

  refreshData(): void {
    this.loadInitialData();
    this.snackBar.open('Información actualizada', 'Cerrar', { duration: 3000 });
  }
}