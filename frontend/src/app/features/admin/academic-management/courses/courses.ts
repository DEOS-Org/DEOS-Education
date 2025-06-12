import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { AcademicService } from '../../../../core/services/academic';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Cursos y Divisiones</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openCourseDialog()">
            <mat-icon>add</mat-icon>
            Nuevo Curso
          </button>
          <button mat-raised-button color="accent" (click)="openDivisionDialog()" [disabled]="cursos.length === 0">
            <mat-icon>class</mat-icon>
            Nueva División
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <mat-tab-group>
          <!-- Tab de Cursos -->
          <mat-tab label="Cursos">
            <!-- Search form for courses -->
            <form [formGroup]="searchForm" class="search-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar curso</mat-label>
                <input matInput formControlName="search" placeholder="Nombre o nivel">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoadingCourses" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Courses table -->
            <table mat-table [dataSource]="cursos" class="courses-table" *ngIf="!isLoadingCourses">
              
              <!-- Name Column -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef> Nombre </th>
                <td mat-cell *matCellDef="let curso"> {{ curso.nombre }} </td>
              </ng-container>

              <!-- Level Column -->
              <ng-container matColumnDef="nivel">
                <th mat-header-cell *matHeaderCellDef> Nivel </th>
                <td mat-cell *matCellDef="let curso"> {{ curso.nivel }} </td>
              </ng-container>

              <!-- Description Column -->
              <ng-container matColumnDef="descripcion">
                <th mat-header-cell *matHeaderCellDef> Descripción </th>
                <td mat-cell *matCellDef="let curso"> {{ curso.descripcion || 'Sin descripción' }} </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="activo">
                <th mat-header-cell *matHeaderCellDef> Estado </th>
                <td mat-cell *matCellDef="let curso">
                  <mat-chip [color]="curso.activo ? 'primary' : 'warn'">
                    {{ curso.activo ? 'Activo' : 'Inactivo' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let curso">
                  <button mat-icon-button [matMenuTriggerFor]="courseMenu" aria-label="Más acciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #courseMenu="matMenu">
                    <button mat-menu-item (click)="openCourseDialog(curso)">
                      <mat-icon>edit</mat-icon>
                      <span>Editar</span>
                    </button>
                    <button mat-menu-item (click)="viewDivisions(curso)">
                      <mat-icon>class</mat-icon>
                      <span>Ver Divisiones</span>
                    </button>
                    <button mat-menu-item (click)="deleteCourse(curso)">
                      <mat-icon>delete</mat-icon>
                      <span>Eliminar</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="courseColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: courseColumns;"></tr>
            </table>

            <!-- No courses message -->
            <div *ngIf="!isLoadingCourses && cursos.length === 0" class="no-data">
              <mat-icon>school</mat-icon>
              <p>No se encontraron cursos</p>
            </div>
          </mat-tab>

          <!-- Tab de Divisiones -->
          <mat-tab label="Divisiones">
            <!-- Search form for divisions -->
            <form [formGroup]="divisionSearchForm" class="search-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar división</mat-label>
                <input matInput formControlName="search" placeholder="Nombre de la división">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Filtrar por curso</mat-label>
                <mat-select formControlName="curso">
                  <mat-option value="">Todos los cursos</mat-option>
                  <mat-option *ngFor="let curso of cursos" [value]="curso.id">
                    {{ curso.nombre }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoadingDivisions" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Divisions table -->
            <table mat-table [dataSource]="divisiones" class="divisions-table" *ngIf="!isLoadingDivisions">
              
              <!-- Name Column -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef> División </th>
                <td mat-cell *matCellDef="let division"> {{ division.nombre }} </td>
              </ng-container>

              <!-- Course Column -->
              <ng-container matColumnDef="curso">
                <th mat-header-cell *matHeaderCellDef> Curso </th>
                <td mat-cell *matCellDef="let division"> {{ division.Curso?.nombre || 'Sin curso' }} </td>
              </ng-container>

              <!-- Capacity Column -->
              <ng-container matColumnDef="capacidad">
                <th mat-header-cell *matHeaderCellDef> Capacidad </th>
                <td mat-cell *matCellDef="let division"> {{ division.capacidad }} estudiantes </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="activo">
                <th mat-header-cell *matHeaderCellDef> Estado </th>
                <td mat-cell *matCellDef="let division">
                  <mat-chip [color]="division.activo ? 'primary' : 'warn'">
                    {{ division.activo ? 'Activa' : 'Inactiva' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let division">
                  <button mat-icon-button [matMenuTriggerFor]="divisionMenu" aria-label="Más acciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #divisionMenu="matMenu">
                    <button mat-menu-item (click)="openDivisionDialog(division)">
                      <mat-icon>edit</mat-icon>
                      <span>Editar</span>
                    </button>
                    <button mat-menu-item (click)="deleteDivision(division)">
                      <mat-icon>delete</mat-icon>
                      <span>Eliminar</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="divisionColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: divisionColumns;"></tr>
            </table>

            <!-- No divisions message -->
            <div *ngIf="!isLoadingDivisions && divisiones.length === 0" class="no-data">
              <mat-icon>class</mat-icon>
              <p>No se encontraron divisiones</p>
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
    .courses-table, .divisions-table {
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
  `]
})
export class CoursesComponent implements OnInit {
  cursos: any[] = [];
  divisiones: any[] = [];
  courseColumns: string[] = ['nombre', 'nivel', 'descripcion', 'activo', 'actions'];
  divisionColumns: string[] = ['nombre', 'curso', 'capacidad', 'activo', 'actions'];
  isLoadingCourses = true;
  isLoadingDivisions = true;
  searchForm: FormGroup;
  divisionSearchForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.divisionSearchForm = this.fb.group({
      search: [''],
      curso: ['']
    });
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadDivisions();
    
    this.searchForm.valueChanges.subscribe(() => {
      this.filterCourses();
    });

    this.divisionSearchForm.valueChanges.subscribe(() => {
      this.filterDivisions();
    });
  }

  loadCourses(): void {
    this.isLoadingCourses = true;
    this.academicService.getCursos().subscribe({
      next: (response: any) => {
        this.cursos = Array.isArray(response) ? response : (response.data || []);
        this.isLoadingCourses = false;
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
        this.snackBar.open('Error al cargar cursos', 'Cerrar', { duration: 5000 });
        this.isLoadingCourses = false;
      }
    });
  }

  loadDivisions(): void {
    this.isLoadingDivisions = true;
    this.academicService.getDivisiones().subscribe({
      next: (response: any) => {
        this.divisiones = Array.isArray(response) ? response : (response.data || []);
        this.isLoadingDivisions = false;
      },
      error: (error: any) => {
        console.error('Error loading divisions:', error);
        this.snackBar.open('Error al cargar divisiones', 'Cerrar', { duration: 5000 });
        this.isLoadingDivisions = false;
      }
    });
  }

  filterCourses(): void {
    const { search } = this.searchForm.value;
    
    this.academicService.getCursos().subscribe({
      next: (response: any) => {
        let filteredCourses = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredCourses = filteredCourses.filter((curso: any) => 
            curso.nombre.toLowerCase().includes(searchLower) ||
            curso.nivel.toLowerCase().includes(searchLower)
          );
        }
        
        this.cursos = filteredCourses;
      }
    });
  }

  filterDivisions(): void {
    const { search, curso } = this.divisionSearchForm.value;
    
    this.academicService.getDivisiones().subscribe({
      next: (response: any) => {
        let filteredDivisions = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredDivisions = filteredDivisions.filter((division: any) => 
            division.nombre.toLowerCase().includes(searchLower)
          );
        }

        if (curso) {
          filteredDivisions = filteredDivisions.filter((division: any) => 
            division.curso_id === Number(curso)
          );
        }
        
        this.divisiones = filteredDivisions;
      }
    });
  }

  openCourseDialog(course?: any): void {
    const dialogData = {
      title: course ? 'Editar Curso' : 'Nuevo Curso',
      data: course || {},
      isEdit: !!course
    };
    
    // TODO: Implement dialog component
    this.snackBar.open(`${dialogData.title} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  openDivisionDialog(division?: any): void {
    if (this.cursos.length === 0) {
      this.snackBar.open('Debe crear al menos un curso antes de agregar divisiones', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const dialogData = {
      title: division ? 'Editar División' : 'Nueva División',
      data: division || {},
      isEdit: !!division,
      cursos: this.cursos
    };
    
    // TODO: Implement dialog component
    this.snackBar.open(`${dialogData.title} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  deleteCourse(course: any): void {
    if (confirm(`¿Está seguro de eliminar el curso ${course.nombre}?`)) {
      this.academicService.deleteCurso(course.id).subscribe({
        next: () => {
          this.snackBar.open('Curso eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadCourses();
          this.loadDivisions(); // Recargar divisiones por si había alguna del curso eliminado
        },
        error: (error) => {
          console.error('Error deleting course:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar curso', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  deleteDivision(division: any): void {
    if (confirm(`¿Está seguro de eliminar la división ${division.nombre}?`)) {
      this.academicService.deleteDivision(division.id).subscribe({
        next: () => {
          this.snackBar.open('División eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadDivisions();
        },
        error: (error) => {
          console.error('Error deleting division:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar división', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  viewDivisions(course: any): void {
    this.divisionSearchForm.patchValue({ curso: course.id });
    this.filterDivisions();
    this.snackBar.open(`Mostrando divisiones del curso ${course.nombre}`, 'Cerrar', { duration: 3000 });
  }
}