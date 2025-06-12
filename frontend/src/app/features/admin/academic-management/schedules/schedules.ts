import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AcademicService } from '../../../../core/services/academic';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Horarios</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openScheduleDialog()">
            <mat-icon>add</mat-icon>
            Nuevo Horario
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Filters form -->
        <form [formGroup]="filtersForm" class="filters-form">
          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <input matInput formControlName="search" placeholder="Materia o profesor">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Día de la semana</mat-label>
            <mat-select formControlName="diaSemana">
              <mat-option value="">Todos los días</mat-option>
              <mat-option value="1">Lunes</mat-option>
              <mat-option value="2">Martes</mat-option>
              <mat-option value="3">Miércoles</mat-option>
              <mat-option value="4">Jueves</mat-option>
              <mat-option value="5">Viernes</mat-option>
              <mat-option value="6">Sábado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Curso</mat-label>
            <mat-select formControlName="cursoId">
              <mat-option value="">Todos los cursos</mat-option>
              <mat-option *ngFor="let curso of cursos" [value]="curso.id">
                {{ curso.nombre }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </form>

        <!-- Loading spinner -->
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner></mat-spinner>
        </div>

        <!-- Schedules table -->
        <table mat-table [dataSource]="horarios" class="schedules-table" *ngIf="!isLoading">
          
          <!-- Day Column -->
          <ng-container matColumnDef="dia">
            <th mat-header-cell *matHeaderCellDef> Día </th>
            <td mat-cell *matCellDef="let horario"> {{ getDayName(horario.dia_semana) }} </td>
          </ng-container>

          <!-- Time Column -->
          <ng-container matColumnDef="horario">
            <th mat-header-cell *matHeaderCellDef> Horario </th>
            <td mat-cell *matCellDef="let horario"> 
              {{ horario.hora_inicio }} - {{ horario.hora_fin }}
            </td>
          </ng-container>

          <!-- Subject Column -->
          <ng-container matColumnDef="materia">
            <th mat-header-cell *matHeaderCellDef> Materia </th>
            <td mat-cell *matCellDef="let horario"> {{ horario.Materia?.nombre || 'Sin asignar' }} </td>
          </ng-container>

          <!-- Professor Column -->
          <ng-container matColumnDef="profesor">
            <th mat-header-cell *matHeaderCellDef> Profesor </th>
            <td mat-cell *matCellDef="let horario"> 
              {{ horario.Profesor ? (horario.Profesor.nombre + ' ' + horario.Profesor.apellido) : 'Sin asignar' }}
            </td>
          </ng-container>

          <!-- Course Column -->
          <ng-container matColumnDef="curso">
            <th mat-header-cell *matHeaderCellDef> Curso </th>
            <td mat-cell *matCellDef="let horario"> {{ horario.Curso?.nombre || 'Sin asignar' }} </td>
          </ng-container>

          <!-- Classroom Column -->
          <ng-container matColumnDef="aula">
            <th mat-header-cell *matHeaderCellDef> Aula </th>
            <td mat-cell *matCellDef="let horario"> {{ horario.aula || 'Sin asignar' }} </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="activo">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let horario">
              <mat-chip [color]="horario.activo ? 'primary' : 'warn'">
                {{ horario.activo ? 'Activo' : 'Inactivo' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let horario">
              <button mat-icon-button [matMenuTriggerFor]="scheduleMenu" aria-label="Más acciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #scheduleMenu="matMenu">
                <button mat-menu-item (click)="openScheduleDialog(horario)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <button mat-menu-item (click)="deleteSchedule(horario)">
                  <mat-icon>delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- No schedules message -->
        <div *ngIf="!isLoading && horarios.length === 0" class="no-data">
          <mat-icon>schedule</mat-icon>
          <p>No se encontraron horarios</p>
          <button mat-raised-button color="primary" (click)="openScheduleDialog()">
            <mat-icon>add</mat-icon>
            Crear Primer Horario
          </button>
        </div>

        <!-- Schedule grid view (optional) -->
        <div class="schedule-grid" *ngIf="!isLoading && horarios.length > 0" style="margin-top: 40px;">
          <h3>Vista de Cuadricula Semanal</h3>
          <div class="grid-container">
            <div class="time-slots">
              <div class="time-header"></div>
              <div *ngFor="let time of timeSlots" class="time-slot">{{ time }}</div>
            </div>
            <div *ngFor="let day of weekDays" class="day-column">
              <div class="day-header">{{ day.name }}</div>
              <div *ngFor="let time of timeSlots" class="time-cell">
                <div *ngFor="let horario of getScheduleForDayAndTime(day.value, time)" 
                     class="schedule-item">
                  <div class="subject">{{ horario.Materia?.nombre }}</div>
                  <div class="professor">{{ horario.Profesor?.nombre }} {{ horario.Profesor?.apellido }}</div>
                  <div class="room">{{ horario.aula }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
    .filters-form {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .filters-form mat-form-field {
      min-width: 200px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .schedules-table {
      width: 100%;
      margin-top: 20px;
    }
    .no-data {
      text-align: center;
      padding: 40px;
      color: rgba(0,0,0,0.6);
    }
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .no-data button {
      margin-top: 16px;
    }
    .schedule-grid {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    .grid-container {
      display: grid;
      grid-template-columns: 80px repeat(6, 1fr);
      min-height: 600px;
    }
    .time-slots {
      display: flex;
      flex-direction: column;
    }
    .time-header {
      height: 50px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .time-slot {
      height: 60px;
      background: #f9f9f9;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .day-column {
      border-left: 1px solid #ddd;
      display: flex;
      flex-direction: column;
    }
    .day-header {
      height: 50px;
      background: #e3f2fd;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .time-cell {
      height: 60px;
      border-bottom: 1px solid #eee;
      padding: 4px;
      overflow: hidden;
    }
    .schedule-item {
      background: #bbdefb;
      border-radius: 4px;
      padding: 2px 4px;
      margin-bottom: 2px;
      font-size: 10px;
      line-height: 1.2;
    }
    .schedule-item .subject {
      font-weight: bold;
    }
    .schedule-item .professor, .schedule-item .room {
      font-size: 9px;
      color: #666;
    }
  `]
})
export class SchedulesComponent implements OnInit {
  horarios: any[] = [];
  cursos: any[] = [];
  displayedColumns: string[] = ['dia', 'horario', 'materia', 'profesor', 'curso', 'aula', 'activo', 'actions'];
  isLoading = true;
  filtersForm: FormGroup;

  weekDays = [
    { value: 1, name: 'Lunes' },
    { value: 2, name: 'Martes' },
    { value: 3, name: 'Miércoles' },
    { value: 4, name: 'Jueves' },
    { value: 5, name: 'Viernes' },
    { value: 6, name: 'Sábado' }
  ];

  timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      search: [''],
      diaSemana: [''],
      cursoId: ['']
    });
  }

  ngOnInit(): void {
    this.loadSchedules();
    this.loadCourses();
    
    this.filtersForm.valueChanges.subscribe(() => {
      this.filterSchedules();
    });
  }

  loadSchedules(): void {
    this.isLoading = true;
    this.academicService.getHorarios().subscribe({
      next: (response: any) => {
        this.horarios = Array.isArray(response) ? response : (response.data || []);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading schedules:', error);
        this.snackBar.open('Error al cargar horarios', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  loadCourses(): void {
    this.academicService.getCursos().subscribe({
      next: (response: any) => {
        this.cursos = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  filterSchedules(): void {
    const { search, diaSemana, cursoId } = this.filtersForm.value;
    
    this.academicService.getHorarios().subscribe({
      next: (response: any) => {
        let filteredSchedules = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredSchedules = filteredSchedules.filter((horario: any) => 
            (horario.Materia?.nombre && horario.Materia.nombre.toLowerCase().includes(searchLower)) ||
            (horario.Profesor?.nombre && horario.Profesor.nombre.toLowerCase().includes(searchLower)) ||
            (horario.Profesor?.apellido && horario.Profesor.apellido.toLowerCase().includes(searchLower))
          );
        }

        if (diaSemana) {
          filteredSchedules = filteredSchedules.filter((horario: any) => 
            horario.dia_semana === Number(diaSemana)
          );
        }

        if (cursoId) {
          filteredSchedules = filteredSchedules.filter((horario: any) => 
            horario.curso_id === Number(cursoId)
          );
        }
        
        this.horarios = filteredSchedules;
      }
    });
  }

  getDayName(dayNumber: number): string {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber] || 'Sin asignar';
  }

  getScheduleForDayAndTime(day: number, time: string): any[] {
    return this.horarios.filter(horario => 
      horario.dia_semana === day && 
      horario.hora_inicio === time
    );
  }

  openScheduleDialog(schedule?: any): void {
    const dialogData = {
      title: schedule ? 'Editar Horario' : 'Nuevo Horario',
      data: schedule || {},
      isEdit: !!schedule,
      cursos: this.cursos
    };
    
    // TODO: Implement dialog component
    this.snackBar.open(`${dialogData.title} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  deleteSchedule(schedule: any): void {
    if (confirm(`¿Está seguro de eliminar este horario?`)) {
      this.academicService.deleteHorario(schedule.id).subscribe({
        next: () => {
          this.snackBar.open('Horario eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadSchedules();
        },
        error: (error) => {
          console.error('Error deleting schedule:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar horario', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
}