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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import Chart from 'chart.js/auto';

// Meeting interfaces
interface Meeting {
  id: number;
  title: string;
  purpose: string;
  description: string;
  date: string;
  time: string;
  duration: number; // in minutes
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  student_id: number;
  student_name: string;
  meeting_type: 'virtual' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  meeting_link?: string;
  notes?: string;
  follow_up_actions?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_reason?: string;
  reminder_sent: boolean;
  can_reschedule: boolean;
  can_cancel: boolean;
}

interface MeetingSummary {
  total_meetings: number;
  scheduled_meetings: number;
  completed_meetings: number;
  cancelled_meetings: number;
  upcoming_meetings: number;
  virtual_meetings: number;
  in_person_meetings: number;
  average_duration: number;
}

@Component({
  selector: 'app-parent-meetings',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    FormsModule
  ],
  template: `
    <div class="parent-meetings">
      <!-- Header -->
      <div class="meetings-header">
        <div class="header-content">
          <h1>Reuniones y Conferencias</h1>
          <p>Gestiona reuniones con profesores y personal educativo</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-raised-button color="primary" (click)="scheduleMeeting()">
            <mat-icon>add</mat-icon>
            Programar Reunión
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando reuniones...</p>
      </div>

      <!-- Meetings Content -->
      <div *ngIf="!isLoading" class="meetings-content">
        
        <!-- Filter Controls -->
        <mat-card class="filters-card">
          <mat-card-content>
            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Seleccionar hijo</mat-label>
                <mat-select [(value)]="selectedChildId" (selectionChange)="onChildSelected()">
                  <mat-option value="">Todos los hijos</mat-option>
                  <mat-option *ngFor="let child of children" [value]="child.student_id">
                    {{ child.student_name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select [(value)]="selectedStatus" (selectionChange)="filterMeetings()">
                  <mat-option value="">Todos los estados</mat-option>
                  <mat-option value="scheduled">Programadas</mat-option>
                  <mat-option value="completed">Completadas</mat-option>
                  <mat-option value="cancelled">Canceladas</mat-option>
                  <mat-option value="rescheduled">Reprogramadas</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Profesor</mat-label>
                <mat-select [(value)]="selectedTeacherId" (selectionChange)="filterMeetings()">
                  <mat-option value="">Todos los profesores</mat-option>
                  <mat-option *ngFor="let teacher of teachers" [value]="teacher.teacher_id">
                    {{ teacher.teacher_name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de reunión</mat-label>
                <mat-select [(value)]="selectedMeetingType" (selectionChange)="filterMeetings()">
                  <mat-option value="">Todos los tipos</mat-option>
                  <mat-option value="virtual">Virtual</mat-option>
                  <mat-option value="in-person">Presencial</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Desde fecha</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="filterMeetings()">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hasta fecha</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="filterMeetings()">
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
        <div class="summary-grid" *ngIf="meetingSummary">
          <mat-card class="summary-card upcoming">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #2196f3">schedule</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ meetingSummary.upcoming_meetings }}</div>
                  <div class="summary-label">Próximas Reuniones</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card scheduled">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #ff9800">event</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ meetingSummary.scheduled_meetings }}</div>
                  <div class="summary-label">Programadas</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card completed">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #4caf50">check_circle</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ meetingSummary.completed_meetings }}</div>
                  <div class="summary-label">Completadas</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card virtual">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon style="color: #9c27b0">videocam</mat-icon>
                <div class="summary-info">
                  <div class="summary-value">{{ meetingSummary.virtual_meetings }}</div>
                  <div class="summary-label">Reuniones Virtuales</div>
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
              <button mat-raised-button color="primary" (click)="scheduleMeeting()">
                <mat-icon>add</mat-icon>
                Nueva Reunión
              </button>
              <button mat-raised-button color="accent" (click)="showUpcomingMeetings()" 
                      [disabled]="meetingSummary?.upcoming_meetings === 0">
                <mat-icon>today</mat-icon>
                Próximas Reuniones
              </button>
              <button mat-raised-button (click)="viewMeetingHistory()">
                <mat-icon>history</mat-icon>
                Historial
              </button>
              <button mat-stroked-button (click)="exportMeetings()">
                <mat-icon>download</mat-icon>
                Exportar
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Meetings Statistics Chart -->
        <mat-card class="chart-card" *ngIf="selectedChildId">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Estadísticas de Reuniones - {{ getSelectedChildName() }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas id="meetingsChart"></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Meetings by Status -->
        <mat-card class="status-meetings-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>view_module</mat-icon>
              Reuniones por Estado
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-tab-group>
              <!-- Upcoming Tab -->
              <mat-tab label="Próximas">
                <div class="tab-content">
                  <div class="meetings-grid">
                    <div *ngFor="let meeting of getUpcomingMeetings()" class="meeting-card upcoming">
                      <div class="meeting-header">
                        <div class="meeting-meta">
                          <mat-chip class="type-chip" [class]="meeting.meeting_type">
                            <mat-icon>{{ getMeetingTypeIcon(meeting.meeting_type) }}</mat-icon>
                            {{ getMeetingTypeText(meeting.meeting_type) }}
                          </mat-chip>
                          <mat-chip [class]="meeting.status" class="status-chip">
                            <mat-icon>{{ getStatusIcon(meeting.status) }}</mat-icon>
                            {{ getStatusText(meeting.status) }}
                          </mat-chip>
                        </div>
                        <div class="meeting-date" [class]="getDateClass(meeting.date)">
                          <mat-icon>schedule</mat-icon>
                          {{ formatDateTime(meeting.date, meeting.time) }}
                        </div>
                      </div>
                      
                      <div class="meeting-content">
                        <h3 class="meeting-title">{{ meeting.title }}</h3>
                        <p class="meeting-purpose">{{ meeting.purpose }}</p>
                        <p class="meeting-description" *ngIf="meeting.description">{{ meeting.description }}</p>
                        
                        <div class="meeting-details">
                          <div class="detail-item">
                            <mat-icon>person</mat-icon>
                            <span>{{ meeting.student_name }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>school</mat-icon>
                            <span>{{ meeting.teacher_name }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>schedule</mat-icon>
                            <span>{{ meeting.duration }} minutos</span>
                          </div>
                          <div class="detail-item" *ngIf="meeting.location">
                            <mat-icon>place</mat-icon>
                            <span>{{ meeting.location }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="meeting-actions">
                        <button mat-button (click)="viewMeetingDetails(meeting)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                        <button mat-button color="primary" *ngIf="meeting.meeting_link" (click)="joinMeeting(meeting)">
                          <mat-icon>videocam</mat-icon>
                          Unirse
                        </button>
                        <button mat-button *ngIf="meeting.can_reschedule" (click)="rescheduleMeeting(meeting)">
                          <mat-icon>schedule</mat-icon>
                          Reprogramar
                        </button>
                        <button mat-button color="warn" *ngIf="meeting.can_cancel" (click)="cancelMeeting(meeting)">
                          <mat-icon>cancel</mat-icon>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="getUpcomingMeetings().length === 0" class="no-meetings">
                    <mat-icon>event_available</mat-icon>
                    <p>No hay reuniones próximas programadas</p>
                    <button mat-raised-button color="primary" (click)="scheduleMeeting()">
                      <mat-icon>add</mat-icon>
                      Programar Nueva Reunión
                    </button>
                  </div>
                </div>
              </mat-tab>

              <!-- Completed Tab -->
              <mat-tab label="Completadas">
                <div class="tab-content">
                  <div class="meetings-grid">
                    <div *ngFor="let meeting of getMeetingsByStatus('completed')" class="meeting-card completed">
                      <div class="meeting-header">
                        <div class="meeting-meta">
                          <mat-chip class="type-chip completed">
                            <mat-icon>{{ getMeetingTypeIcon(meeting.meeting_type) }}</mat-icon>
                            {{ getMeetingTypeText(meeting.meeting_type) }}
                          </mat-chip>
                          <mat-chip class="status-chip completed">
                            <mat-icon>check_circle</mat-icon>
                            Completada
                          </mat-chip>
                        </div>
                        <div class="meeting-date completed">
                          <mat-icon>event_available</mat-icon>
                          {{ formatDate(meeting.completed_at || meeting.date) }}
                        </div>
                      </div>
                      
                      <div class="meeting-content">
                        <h3 class="meeting-title">{{ meeting.title }}</h3>
                        <p class="meeting-purpose">{{ meeting.purpose }}</p>
                        
                        <div class="meeting-details">
                          <div class="detail-item">
                            <mat-icon>person</mat-icon>
                            <span>{{ meeting.student_name }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>school</mat-icon>
                            <span>{{ meeting.teacher_name }}</span>
                          </div>
                          <div class="detail-item">
                            <mat-icon>schedule</mat-icon>
                            <span>{{ meeting.duration }} minutos</span>
                          </div>
                        </div>

                        <div class="meeting-notes" *ngIf="meeting.notes">
                          <h4>
                            <mat-icon>note</mat-icon>
                            Notas de la Reunión
                          </h4>
                          <p>{{ meeting.notes }}</p>
                        </div>

                        <div class="follow-up-actions" *ngIf="meeting.follow_up_actions && meeting.follow_up_actions.length > 0">
                          <h4>
                            <mat-icon>assignment</mat-icon>
                            Acciones de Seguimiento
                          </h4>
                          <ul>
                            <li *ngFor="let action of meeting.follow_up_actions">{{ action }}</li>
                          </ul>
                        </div>
                      </div>

                      <div class="meeting-actions">
                        <button mat-button (click)="viewMeetingDetails(meeting)">
                          <mat-icon>visibility</mat-icon>
                          Ver Detalles
                        </button>
                        <button mat-button color="primary" (click)="contactTeacher(meeting)">
                          <mat-icon>email</mat-icon>
                          Contactar Profesor
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="getMeetingsByStatus('completed').length === 0" class="no-meetings">
                    <mat-icon>assignment_turned_in</mat-icon>
                    <p>No hay reuniones completadas</p>
                  </div>
                </div>
              </mat-tab>

              <!-- All Meetings Tab -->
              <mat-tab label="Todas">
                <div class="tab-content">
                  <!-- Detailed Meetings Table -->
                  <div class="table-container">
                    <table mat-table [dataSource]="filteredMeetings" class="meetings-table">
                      
                      <!-- Date Column -->
                      <ng-container matColumnDef="fecha">
                        <th mat-header-cell *matHeaderCellDef>Fecha y Hora</th>
                        <td mat-cell *matCellDef="let meeting">
                          <div class="date-cell">
                            <div class="date-value">{{ formatDate(meeting.date) }}</div>
                            <div class="time-value">{{ meeting.time }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Student Column -->
                      <ng-container matColumnDef="estudiante" *ngIf="!selectedChildId">
                        <th mat-header-cell *matHeaderCellDef>Estudiante</th>
                        <td mat-cell *matCellDef="let meeting">
                          <div class="student-cell">
                            <mat-icon class="student-icon">face</mat-icon>
                            <span class="student-name">{{ meeting.student_name }}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Title Column -->
                      <ng-container matColumnDef="titulo">
                        <th mat-header-cell *matHeaderCellDef>Reunión</th>
                        <td mat-cell *matCellDef="let meeting">
                          <div class="title-cell">
                            <span class="meeting-title">{{ meeting.title }}</span>
                            <span class="meeting-purpose">{{ meeting.purpose }}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Teacher Column -->
                      <ng-container matColumnDef="profesor">
                        <th mat-header-cell *matHeaderCellDef>Profesor</th>
                        <td mat-cell *matCellDef="let meeting">
                          <div class="teacher-cell">
                            <span class="teacher-name">{{ meeting.teacher_name }}</span>
                            <span class="teacher-email">{{ meeting.teacher_email }}</span>
                          </div>
                        </td>
                      </ng-container>

                      <!-- Type Column -->
                      <ng-container matColumnDef="tipo">
                        <th mat-header-cell *matHeaderCellDef>Tipo</th>
                        <td mat-cell *matCellDef="let meeting">
                          <mat-chip class="type-chip" [class]="meeting.meeting_type">
                            <mat-icon>{{ getMeetingTypeIcon(meeting.meeting_type) }}</mat-icon>
                            {{ getMeetingTypeText(meeting.meeting_type) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <!-- Status Column -->
                      <ng-container matColumnDef="estado">
                        <th mat-header-cell *matHeaderCellDef>Estado</th>
                        <td mat-cell *matCellDef="let meeting">
                          <mat-chip [class]="meeting.status" class="status-chip">
                            <mat-icon>{{ getStatusIcon(meeting.status) }}</mat-icon>
                            {{ getStatusText(meeting.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <!-- Actions Column -->
                      <ng-container matColumnDef="acciones">
                        <th mat-header-cell *matHeaderCellDef>Acciones</th>
                        <td mat-cell *matCellDef="let meeting">
                          <div class="actions-cell">
                            <button mat-icon-button [matMenuTriggerFor]="meetingMenu" matTooltip="Más opciones">
                              <mat-icon>more_vert</mat-icon>
                            </button>
                            <mat-menu #meetingMenu="matMenu">
                              <button mat-menu-item (click)="viewMeetingDetails(meeting)">
                                <mat-icon>visibility</mat-icon>
                                Ver Detalles
                              </button>
                              <button mat-menu-item *ngIf="meeting.meeting_link && meeting.status === 'scheduled'" (click)="joinMeeting(meeting)">
                                <mat-icon>videocam</mat-icon>
                                Unirse
                              </button>
                              <button mat-menu-item *ngIf="meeting.can_reschedule" (click)="rescheduleMeeting(meeting)">
                                <mat-icon>schedule</mat-icon>
                                Reprogramar
                              </button>
                              <button mat-menu-item *ngIf="meeting.can_cancel" (click)="cancelMeeting(meeting)">
                                <mat-icon>cancel</mat-icon>
                                Cancelar
                              </button>
                              <button mat-menu-item (click)="contactTeacher(meeting)">
                                <mat-icon>email</mat-icon>
                                Contactar Profesor
                              </button>
                            </mat-menu>
                          </div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                    </table>

                    <mat-paginator 
                      [pageSizeOptions]="[10, 20, 50]" 
                      showFirstLastButtons
                      aria-label="Seleccionar página de reuniones">
                    </mat-paginator>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrl: './meetings.scss'
})
export class ParentMeetingsComponent implements OnInit, OnDestroy {
  isLoading = true;
  children: any[] = [];
  allMeetings: Meeting[] = [];
  filteredMeetings: Meeting[] = [];
  teachers: any[] = [];
  
  // Filter controls
  selectedChildId: any = null;
  selectedStatus: string = '';
  selectedTeacherId: any = null;
  selectedMeetingType: string = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Summary data
  meetingSummary: MeetingSummary | null = null;

  // Table configuration
  displayedColumns: string[] = ['fecha', 'titulo', 'profesor', 'tipo', 'estado', 'acciones'];

  // Charts
  private meetingsChart: Chart | null = null;

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
          student_id: 1,
          student_name: 'Juan Carlos Pérez González'
        },
        {
          student_id: 2,
          student_name: 'María Elena Pérez González'
        }
      ];

      this.allMeetings = [
        {
          id: 1,
          title: 'Conferencia de Padres - Trimestre 1',
          purpose: 'Revisión del rendimiento académico del primer trimestre',
          description: 'Discutir el progreso académico, áreas de mejora y establecer metas para el siguiente periodo.',
          date: '2024-12-15',
          time: '14:30',
          duration: 45,
          teacher_id: 1,
          teacher_name: 'Prof. María García',
          teacher_email: 'maria.garcia@colegio.edu',
          student_id: 1,
          student_name: 'Juan Carlos Pérez González',
          meeting_type: 'virtual',
          status: 'scheduled',
          meeting_link: 'https://meet.google.com/abc-defg-hij',
          notes: '',
          follow_up_actions: [],
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z',
          reminder_sent: false,
          can_reschedule: true,
          can_cancel: true
        },
        {
          id: 2,
          title: 'Reunión sobre Comportamiento',
          purpose: 'Discutir incidentes de comportamiento en clase',
          description: 'Revisar los episodios de comportamiento disruptivo y establecer estrategias de mejora.',
          date: '2024-12-20',
          time: '16:00',
          duration: 30,
          teacher_id: 2,
          teacher_name: 'Prof. Carlos Rodríguez',
          teacher_email: 'carlos.rodriguez@colegio.edu',
          student_id: 1,
          student_name: 'Juan Carlos Pérez González',
          meeting_type: 'in-person',
          status: 'scheduled',
          location: 'Oficina de Coordinación Académica - Piso 2',
          notes: '',
          follow_up_actions: [],
          created_at: '2024-12-05T14:30:00Z',
          updated_at: '2024-12-05T14:30:00Z',
          reminder_sent: true,
          can_reschedule: true,
          can_cancel: true
        },
        {
          id: 3,
          title: 'Reunión de Orientación Vocacional',
          purpose: 'Orientación sobre opciones de carrera universitaria',
          description: 'Discutir intereses, aptitudes y opciones de carrera para el futuro universitario.',
          date: '2024-11-28',
          time: '10:00',
          duration: 60,
          teacher_id: 3,
          teacher_name: 'Psicóloga Ana Martínez',
          teacher_email: 'ana.martinez@colegio.edu',
          student_id: 2,
          student_name: 'María Elena Pérez González',
          meeting_type: 'virtual',
          status: 'completed',
          meeting_link: 'https://meet.google.com/xyz-uvwt-rst',
          notes: 'La estudiante muestra gran interés en carreras relacionadas con ciencias de la salud. Se recomendó investigar programas de medicina y enfermería. Excelente desempeño académico que la posiciona bien para carreras competitivas.',
          follow_up_actions: [
            'Investigar programas universitarios de medicina',
            'Considerar actividades de voluntariado en hospitales',
            'Mantener promedio académico alto',
            'Prepararse para exámenes de admisión universitaria'
          ],
          created_at: '2024-11-15T09:00:00Z',
          updated_at: '2024-11-28T11:00:00Z',
          completed_at: '2024-11-28T11:00:00Z',
          reminder_sent: true,
          can_reschedule: false,
          can_cancel: false
        },
        {
          id: 4,
          title: 'Conferencia Académica - Matemáticas',
          purpose: 'Revisión del desempeño en matemáticas',
          description: 'Analizar las dificultades en álgebra y establecer plan de apoyo.',
          date: '2024-11-15',
          time: '15:30',
          duration: 40,
          teacher_id: 4,
          teacher_name: 'Prof. Daniel Quinteros',
          teacher_email: 'daniel.quinteros@colegio.edu',
          student_id: 1,
          student_name: 'Juan Carlos Pérez González',
          meeting_type: 'in-person',
          status: 'completed',
          location: 'Aula de Matemáticas - Edificio Principal',
          notes: 'El estudiante muestra dificultades en conceptos de álgebra avanzada. Se estableció un plan de tutoría adicional dos veces por semana. Los padres se comprometieron a supervisar las tareas de matemáticas en casa.',
          follow_up_actions: [
            'Asistir a tutorías los martes y jueves',
            'Completar ejercicios adicionales en casa',
            'Revisar conceptos básicos de álgebra',
            'Reunión de seguimiento en 3 semanas'
          ],
          created_at: '2024-11-01T10:00:00Z',
          updated_at: '2024-11-15T16:10:00Z',
          completed_at: '2024-11-15T16:10:00Z',
          reminder_sent: true,
          can_reschedule: false,
          can_cancel: false
        },
        {
          id: 5,
          title: 'Reunión de Seguimiento - Proyecto de Ciencias',
          purpose: 'Revisión del progreso en proyecto de feria de ciencias',
          description: 'Evaluar el avance del proyecto y proporcionar orientación adicional.',
          date: '2024-12-18',
          time: '11:00',
          duration: 30,
          teacher_id: 5,
          teacher_name: 'Prof. Laura Morales',
          teacher_email: 'laura.morales@colegio.edu',
          student_id: 2,
          student_name: 'María Elena Pérez González',
          meeting_type: 'virtual',
          status: 'scheduled',
          meeting_link: 'https://zoom.us/j/123456789',
          notes: '',
          follow_up_actions: [],
          created_at: '2024-12-08T13:20:00Z',
          updated_at: '2024-12-08T13:20:00Z',
          reminder_sent: false,
          can_reschedule: true,
          can_cancel: true
        },
        {
          id: 6,
          title: 'Conferencia Cancelada - Eventos Escolares',
          purpose: 'Discusión sobre participación en eventos escolares',
          description: 'Reunión cancelada debido a enfermedad del profesor.',
          date: '2024-12-10',
          time: '13:00',
          duration: 30,
          teacher_id: 6,
          teacher_name: 'Prof. Roberto Sánchez',
          teacher_email: 'roberto.sanchez@colegio.edu',
          student_id: 2,
          student_name: 'María Elena Pérez González',
          meeting_type: 'in-person',
          status: 'cancelled',
          location: 'Sala de Profesores',
          cancelled_reason: 'Profesor enfermo - se reprogramará próxima semana',
          notes: '',
          follow_up_actions: [],
          created_at: '2024-12-01T11:00:00Z',
          updated_at: '2024-12-10T08:00:00Z',
          reminder_sent: true,
          can_reschedule: false,
          can_cancel: false
        }
      ];

      this.extractTeachers();
      this.calculateSummary();
      this.filterMeetings();
      this.updateDisplayedColumns();
      
      this.isLoading = false;
      
      if (this.selectedChildId) {
        setTimeout(() => this.createMeetingsChart(), 100);
      }
    }, 1000);
  }

  private extractTeachers(): void {
    const teachersMap = new Map();
    this.allMeetings.forEach(meeting => {
      if (!teachersMap.has(meeting.teacher_id)) {
        teachersMap.set(meeting.teacher_id, {
          teacher_id: meeting.teacher_id,
          teacher_name: meeting.teacher_name,
          teacher_email: meeting.teacher_email
        });
      }
    });
    this.teachers = Array.from(teachersMap.values());
  }

  private calculateSummary(): void {
    const filteredForSummary = this.getFilteredMeetingsForSummary();
    
    if (filteredForSummary.length === 0) {
      this.meetingSummary = null;
      return;
    }

    const now = new Date();
    const totalMeetings = filteredForSummary.length;
    const scheduledMeetings = filteredForSummary.filter(m => m.status === 'scheduled').length;
    const completedMeetings = filteredForSummary.filter(m => m.status === 'completed').length;
    const cancelledMeetings = filteredForSummary.filter(m => m.status === 'cancelled').length;
    const virtualMeetings = filteredForSummary.filter(m => m.meeting_type === 'virtual').length;
    const inPersonMeetings = filteredForSummary.filter(m => m.meeting_type === 'in-person').length;
    
    const upcomingMeetings = filteredForSummary.filter(meeting => {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
      return meeting.status === 'scheduled' && meetingDateTime > now;
    }).length;

    const totalDuration = filteredForSummary.reduce((sum, meeting) => sum + meeting.duration, 0);
    const averageDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;

    this.meetingSummary = {
      total_meetings: totalMeetings,
      scheduled_meetings: scheduledMeetings,
      completed_meetings: completedMeetings,
      cancelled_meetings: cancelledMeetings,
      upcoming_meetings: upcomingMeetings,
      virtual_meetings: virtualMeetings,
      in_person_meetings: inPersonMeetings,
      average_duration: averageDuration
    };
  }

  private getFilteredMeetingsForSummary(): Meeting[] {
    let filtered = [...this.allMeetings];
    
    if (this.selectedChildId) {
      filtered = filtered.filter(meeting => meeting.student_id == this.selectedChildId);
    }
    
    return filtered;
  }

  onChildSelected(): void {
    this.filterMeetings();
    this.calculateSummary();
    this.updateDisplayedColumns();
    this.updateMeetingsChart();
  }

  filterMeetings(): void {
    let filtered = [...this.allMeetings];

    // Filter by child
    if (this.selectedChildId) {
      filtered = filtered.filter(meeting => meeting.student_id == this.selectedChildId);
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(meeting => meeting.status === this.selectedStatus);
    }

    // Filter by teacher
    if (this.selectedTeacherId) {
      filtered = filtered.filter(meeting => meeting.teacher_id == this.selectedTeacherId);
    }

    // Filter by meeting type
    if (this.selectedMeetingType) {
      filtered = filtered.filter(meeting => meeting.meeting_type === this.selectedMeetingType);
    }

    // Filter by date range
    if (this.startDate) {
      filtered = filtered.filter(meeting => new Date(meeting.date) >= this.startDate!);
    }
    if (this.endDate) {
      filtered = filtered.filter(meeting => new Date(meeting.date) <= this.endDate!);
    }

    this.filteredMeetings = filtered.sort((a, b) => {
      // Sort by date, most recent first
      return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
    });

    this.calculateSummary();
  }

  private updateDisplayedColumns(): void {
    if (this.selectedChildId) {
      this.displayedColumns = ['fecha', 'titulo', 'profesor', 'tipo', 'estado', 'acciones'];
    } else {
      this.displayedColumns = ['fecha', 'estudiante', 'titulo', 'profesor', 'tipo', 'estado', 'acciones'];
    }
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.selectedTeacherId = null;
    this.selectedMeetingType = '';
    this.startDate = null;
    this.endDate = null;
    this.filterMeetings();
  }

  private createMeetingsChart(): void {
    if (!this.selectedChildId) return;
    
    const ctx = document.getElementById('meetingsChart') as HTMLCanvasElement;
    if (!ctx) return;

    const childMeetings = this.allMeetings.filter(meeting => 
      meeting.student_id == this.selectedChildId
    );

    // Group by month and status
    const monthlyStats = new Map();
    childMeetings.forEach(meeting => {
      const month = new Date(meeting.date).toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { completed: 0, scheduled: 0, cancelled: 0 });
      }
      const stats = monthlyStats.get(month);
      stats[meeting.status] = (stats[meeting.status] || 0) + 1;
    });

    const labels: string[] = [];
    const completedData: number[] = [];
    const scheduledData: number[] = [];
    const cancelledData: number[] = [];
    
    monthlyStats.forEach((stats, month) => {
      labels.push(month);
      completedData.push(stats.completed || 0);
      scheduledData.push(stats.scheduled || 0);
      cancelledData.push(stats.cancelled || 0);
    });

    this.meetingsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completadas',
            data: completedData,
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderColor: '#4caf50',
            borderWidth: 1
          },
          {
            label: 'Programadas',
            data: scheduledData,
            backgroundColor: 'rgba(255, 152, 0, 0.7)',
            borderColor: '#ff9800',
            borderWidth: 1
          },
          {
            label: 'Canceladas',
            data: cancelledData,
            backgroundColor: 'rgba(244, 67, 54, 0.7)',
            borderColor: '#f44336',
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
        }
      }
    });
  }

  private updateMeetingsChart(): void {
    this.destroyCharts();
    if (this.selectedChildId) {
      setTimeout(() => this.createMeetingsChart(), 100);
    }
  }

  private destroyCharts(): void {
    if (this.meetingsChart) {
      this.meetingsChart.destroy();
      this.meetingsChart = null;
    }
  }

  getSelectedChildName(): string {
    const child = this.children.find(c => c.student_id == this.selectedChildId);
    return child ? child.student_name : '';
  }

  getMeetingsByStatus(status: string): Meeting[] {
    return this.filteredMeetings.filter(meeting => meeting.status === status);
  }

  getUpcomingMeetings(): Meeting[] {
    const now = new Date();
    return this.filteredMeetings.filter(meeting => {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
      return meeting.status === 'scheduled' && meetingDateTime > now;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }

  getMeetingTypeIcon(type: string): string {
    switch (type) {
      case 'virtual': return 'videocam';
      case 'in-person': return 'meeting_room';
      default: return 'help';
    }
  }

  getMeetingTypeText(type: string): string {
    switch (type) {
      case 'virtual': return 'Virtual';
      case 'in-person': return 'Presencial';
      default: return 'Desconocido';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'scheduled': return 'schedule';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      case 'rescheduled': return 'update';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'rescheduled': return 'Reprogramada';
      default: return 'Desconocido';
    }
  }

  getDateClass(date: string): string {
    const today = new Date();
    const meetingDate = new Date(date);
    const diffDays = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'past';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 7) return 'soon';
    return 'normal';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDateTime(dateString: string, timeString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let dateText = '';
    if (diffDays === 0) {
      dateText = 'Hoy';
    } else if (diffDays === 1) {
      dateText = 'Mañana';
    } else if (diffDays === -1) {
      dateText = 'Ayer';
    } else {
      dateText = this.formatDate(dateString);
    }
    
    return `${dateText} a las ${timeString}`;
  }

  // Action methods
  scheduleMeeting(): void {
    // En producción esto abriría un diálogo para programar nueva reunión
    this.snackBar.open('Abriendo formulario para programar reunión...', 'Cerrar', { duration: 3000 });
  }

  showUpcomingMeetings(): void {
    this.selectedStatus = 'scheduled';
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    this.startDate = today;
    this.endDate = weekFromNow;
    this.filterMeetings();
    this.snackBar.open('Mostrando próximas reuniones', 'Cerrar', { duration: 3000 });
  }

  viewMeetingHistory(): void {
    this.selectedStatus = 'completed';
    this.filterMeetings();
    this.snackBar.open('Mostrando historial de reuniones', 'Cerrar', { duration: 3000 });
  }

  exportMeetings(): void {
    this.snackBar.open('Exportando reuniones...', 'Cerrar', { duration: 3000 });
  }

  viewMeetingDetails(meeting: Meeting): void {
    // En producción esto abriría un diálogo con detalles completos
    this.snackBar.open(`Ver detalles: ${meeting.title}`, 'Cerrar', { duration: 3000 });
  }

  joinMeeting(meeting: Meeting): void {
    if (meeting.meeting_link) {
      window.open(meeting.meeting_link, '_blank');
      this.snackBar.open(`Uniéndose a: ${meeting.title}`, 'Cerrar', { duration: 3000 });
    }
  }

  rescheduleMeeting(meeting: Meeting): void {
    // En producción esto abriría un diálogo para reprogramar
    this.snackBar.open(`Reprogramar: ${meeting.title}`, 'Cerrar', { duration: 3000 });
  }

  cancelMeeting(meeting: Meeting): void {
    // En producción esto abriría un diálogo de confirmación
    this.snackBar.open(`Cancelar: ${meeting.title}`, 'Cerrar', { duration: 3000 });
  }

  contactTeacher(meeting: Meeting): void {
    // En producción esto abriría el cliente de email o un diálogo de contacto
    this.snackBar.open(`Contactar a ${meeting.teacher_name}`, 'Cerrar', { duration: 3000 });
  }

  refreshData(): void {
    this.loadInitialData();
    this.snackBar.open('Información actualizada', 'Cerrar', { duration: 3000 });
  }
}