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
import { MatTabsModule } from '@angular/material/tabs';
import { AcademicService } from '../../../../core/services/academic';
import { UserService } from '../../../../core/services/user';

@Component({
  selector: 'app-assignments',
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
    MatDialogModule,
    MatTabsModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Asignaciones</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openAssignmentDialog()">
            <mat-icon>add</mat-icon>
            Nueva Asignación
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <mat-tab-group>
          <!-- Tab de Asignaciones Profesor-Materia -->
          <mat-tab label="Profesor - Materia">
            <!-- Search form -->
            <form [formGroup]="searchForm" class="search-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar</mat-label>
                <input matInput formControlName="search" placeholder="Profesor o materia">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Filtrar por materia</mat-label>
                <mat-select formControlName="materiaId">
                  <mat-option value="">Todas las materias</mat-option>
                  <mat-option *ngFor="let materia of materias" [value]="materia.id">
                    {{ materia.nombre }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoadingAssignments" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Assignments table -->
            <table mat-table [dataSource]="asignaciones" class="assignments-table" *ngIf="!isLoadingAssignments">
              
              <!-- Professor Column -->
              <ng-container matColumnDef="profesor">
                <th mat-header-cell *matHeaderCellDef> Profesor </th>
                <td mat-cell *matCellDef="let asignacion"> 
                  {{ asignacion.Profesor ? (asignacion.Profesor.nombre + ' ' + asignacion.Profesor.apellido) : 'Sin asignar' }}
                </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef> Email </th>
                <td mat-cell *matCellDef="let asignacion"> {{ asignacion.Profesor?.email || 'Sin email' }} </td>
              </ng-container>

              <!-- Subject Column -->
              <ng-container matColumnDef="materia">
                <th mat-header-cell *matHeaderCellDef> Materia </th>
                <td mat-cell *matCellDef="let asignacion"> {{ asignacion.Materia?.nombre || 'Sin asignar' }} </td>
              </ng-container>

              <!-- Credits Column -->
              <ng-container matColumnDef="creditos">
                <th mat-header-cell *matHeaderCellDef> Carga Horaria </th>
                <td mat-cell *matCellDef="let asignacion"> {{ asignacion.Materia?.carga_horaria || 0 }} hs </td>
              </ng-container>

              <!-- Assignment Date Column -->
              <ng-container matColumnDef="fechaAsignacion">
                <th mat-header-cell *matHeaderCellDef> Fecha Asignación </th>
                <td mat-cell *matCellDef="let asignacion"> 
                  {{ (asignacion.createdAt | date:'dd/MM/yyyy') || 'Sin fecha' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let asignacion">
                  <button mat-icon-button [matMenuTriggerFor]="assignmentMenu" aria-label="Más acciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #assignmentMenu="matMenu">
                    <button mat-menu-item (click)="viewSchedules(asignacion)">
                      <mat-icon>schedule</mat-icon>
                      <span>Ver Horarios</span>
                    </button>
                    <button mat-menu-item (click)="removeAssignment(asignacion)">
                      <mat-icon>delete</mat-icon>
                      <span>Quitar Asignación</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="assignmentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: assignmentColumns;"></tr>
            </table>

            <!-- No assignments message -->
            <div *ngIf="!isLoadingAssignments && asignaciones.length === 0" class="no-data">
              <mat-icon>assignment_ind</mat-icon>
              <p>No se encontraron asignaciones</p>
              <button mat-raised-button color="primary" (click)="openAssignmentDialog()">
                <mat-icon>add</mat-icon>
                Crear Primera Asignación
              </button>
            </div>
          </mat-tab>

          <!-- Tab de Vista por Profesor -->
          <mat-tab label="Por Profesor">
            <!-- Teachers search -->
            <form [formGroup]="teacherSearchForm" class="search-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar profesor</mat-label>
                <input matInput formControlName="search" placeholder="Nombre o apellido">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoadingTeachers" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Teachers table -->
            <table mat-table [dataSource]="profesores" class="teachers-table" *ngIf="!isLoadingTeachers">
              
              <!-- Name Column -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef> Profesor </th>
                <td mat-cell *matCellDef="let profesor"> {{ profesor.nombre }} {{ profesor.apellido }} </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef> Email </th>
                <td mat-cell *matCellDef="let profesor"> {{ profesor.email }} </td>
              </ng-container>

              <!-- Subjects Column -->
              <ng-container matColumnDef="materias">
                <th mat-header-cell *matHeaderCellDef> Materias Asignadas </th>
                <td mat-cell *matCellDef="let profesor">
                  <div class="materias-chips">
                    <mat-chip *ngFor="let materia of profesor.materiasAsignadas">
                      {{ materia.nombre }}
                    </mat-chip>
                    <span *ngIf="!profesor.materiasAsignadas || profesor.materiasAsignadas.length === 0" class="no-subjects">
                      Sin materias asignadas
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Total Hours Column -->
              <ng-container matColumnDef="totalHoras">
                <th mat-header-cell *matHeaderCellDef> Total Horas </th>
                <td mat-cell *matCellDef="let profesor"> {{ getTotalHours(profesor) }} hs </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actionsTeacher">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let profesor">
                  <button mat-icon-button [matMenuTriggerFor]="teacherMenu" aria-label="Más acciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #teacherMenu="matMenu">
                    <button mat-menu-item (click)="assignSubjectToTeacher(profesor)">
                      <mat-icon>add</mat-icon>
                      <span>Asignar Materia</span>
                    </button>
                    <button mat-menu-item (click)="viewTeacherSchedule(profesor)">
                      <mat-icon>schedule</mat-icon>
                      <span>Ver Horarios</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="teacherColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: teacherColumns;"></tr>
            </table>

            <!-- No teachers message -->
            <div *ngIf="!isLoadingTeachers && profesores.length === 0" class="no-data">
              <mat-icon>person</mat-icon>
              <p>No se encontraron profesores</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
    .search-form {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .search-form mat-form-field {
      min-width: 250px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .assignments-table, .teachers-table {
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
    .materias-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .materias-chips mat-chip {
      font-size: 12px;
    }
    .no-subjects {
      color: rgba(0,0,0,0.6);
      font-style: italic;
    }
  `]
})
export class AssignmentsComponent implements OnInit {
  asignaciones: any[] = [];
  profesores: any[] = [];
  materias: any[] = [];
  assignmentColumns: string[] = ['profesor', 'email', 'materia', 'creditos', 'fechaAsignacion', 'actions'];
  teacherColumns: string[] = ['nombre', 'email', 'materias', 'totalHoras', 'actionsTeacher'];
  isLoadingAssignments = true;
  isLoadingTeachers = true;
  searchForm: FormGroup;
  teacherSearchForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      materiaId: ['']
    });

    this.teacherSearchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadAssignments();
    this.loadTeachers();
    this.loadSubjects();
    
    this.searchForm.valueChanges.subscribe(() => {
      this.filterAssignments();
    });

    this.teacherSearchForm.valueChanges.subscribe(() => {
      this.filterTeachers();
    });
  }

  loadAssignments(): void {
    this.isLoadingAssignments = true;
    this.academicService.getAsignaciones().subscribe({
      next: (response: any) => {
        this.asignaciones = Array.isArray(response) ? response : (response.data || []);
        this.isLoadingAssignments = false;
      },
      error: (error: any) => {
        console.error('Error loading assignments:', error);
        this.snackBar.open('Error al cargar asignaciones', 'Cerrar', { duration: 5000 });
        this.isLoadingAssignments = false;
      }
    });
  }

  loadTeachers(): void {
    this.isLoadingTeachers = true;
    this.userService.getUsersByRole('profesor').subscribe({
      next: (response: any) => {
        this.profesores = Array.isArray(response) ? response : (response.data || []);
        // Add assigned subjects to each teacher
        this.profesores.forEach(profesor => {
          profesor.materiasAsignadas = this.asignaciones
            .filter(asignacion => asignacion.profesor_usuario_id === profesor.id)
            .map(asignacion => asignacion.Materia);
        });
        this.isLoadingTeachers = false;
      },
      error: (error: any) => {
        console.error('Error loading teachers:', error);
        this.snackBar.open('Error al cargar profesores', 'Cerrar', { duration: 5000 });
        this.isLoadingTeachers = false;
      }
    });
  }

  loadSubjects(): void {
    this.academicService.getMaterias().subscribe({
      next: (response: any) => {
        this.materias = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error: any) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  filterAssignments(): void {
    const { search, materiaId } = this.searchForm.value;
    
    this.academicService.getAsignaciones().subscribe({
      next: (response: any) => {
        let filteredAssignments = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredAssignments = filteredAssignments.filter((asignacion: any) => 
            (asignacion.Profesor?.nombre && asignacion.Profesor.nombre.toLowerCase().includes(searchLower)) ||
            (asignacion.Profesor?.apellido && asignacion.Profesor.apellido.toLowerCase().includes(searchLower)) ||
            (asignacion.Materia?.nombre && asignacion.Materia.nombre.toLowerCase().includes(searchLower))
          );
        }

        if (materiaId) {
          filteredAssignments = filteredAssignments.filter((asignacion: any) => 
            asignacion.materia_id === Number(materiaId)
          );
        }
        
        this.asignaciones = filteredAssignments;
      }
    });
  }

  filterTeachers(): void {
    const { search } = this.teacherSearchForm.value;
    
    this.userService.getUsersByRole('profesor').subscribe({
      next: (response: any) => {
        let filteredTeachers = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredTeachers = filteredTeachers.filter((profesor: any) => 
            profesor.nombre.toLowerCase().includes(searchLower) ||
            profesor.apellido.toLowerCase().includes(searchLower) ||
            profesor.email.toLowerCase().includes(searchLower)
          );
        }
        
        // Add assigned subjects to each teacher
        filteredTeachers.forEach((profesor: any) => {
          profesor.materiasAsignadas = this.asignaciones
            .filter(asignacion => asignacion.profesor_usuario_id === profesor.id)
            .map(asignacion => asignacion.Materia);
        });
        
        this.profesores = filteredTeachers;
      }
    });
  }

  getTotalHours(profesor: any): number {
    if (!profesor.materiasAsignadas) return 0;
    return profesor.materiasAsignadas.reduce((total: number, materia: any) => 
      total + (materia.carga_horaria || 0), 0
    );
  }

  openAssignmentDialog(): void {
    const dialogData = {
      title: 'Nueva Asignación Profesor-Materia',
      profesores: this.profesores,
      materias: this.materias
    };
    
    // TODO: Implement dialog component
    this.snackBar.open('Nueva Asignación - Próximamente', 'Cerrar', { duration: 3000 });
  }

  assignSubjectToTeacher(profesor: any): void {
    const dialogData = {
      title: `Asignar Materia a ${profesor.nombre} ${profesor.apellido}`,
      profesor: profesor,
      materias: this.materias,
      materiasAsignadas: profesor.materiasAsignadas || []
    };
    
    // TODO: Implement dialog component
    this.snackBar.open(`Asignar materia a ${profesor.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  removeAssignment(asignacion: any): void {
    const profesorNombre = asignacion.Profesor ? 
      `${asignacion.Profesor.nombre} ${asignacion.Profesor.apellido}` : 'Profesor';
    const materiaNombre = asignacion.Materia?.nombre || 'Materia';
    
    if (confirm(`¿Está seguro de quitar la asignación de ${materiaNombre} a ${profesorNombre}?`)) {
      this.academicService.removeProfesorFromMateria(
        asignacion.profesor_usuario_id, 
        asignacion.materia_id
      ).subscribe({
        next: () => {
          this.snackBar.open('Asignación eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadAssignments();
          this.loadTeachers();
        },
        error: (error) => {
          console.error('Error removing assignment:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar asignación', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  viewSchedules(asignacion: any): void {
    this.snackBar.open(`Ver horarios de ${asignacion.Materia?.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
    // TODO: Navigate to schedules filtered by this assignment
  }

  viewTeacherSchedule(profesor: any): void {
    this.snackBar.open(`Ver horarios de ${profesor.nombre} ${profesor.apellido} - Próximamente`, 'Cerrar', { duration: 3000 });
    // TODO: Navigate to schedules filtered by this teacher
  }
}