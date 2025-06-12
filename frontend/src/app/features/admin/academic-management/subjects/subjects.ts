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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AcademicService } from '../../../../core/services/academic';

@Component({
  selector: 'app-subjects',
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
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Materias</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openSubjectDialog()">
            <mat-icon>add</mat-icon>
            Nueva Materia
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Search form -->
        <form [formGroup]="searchForm" class="search-form">
          <mat-form-field appearance="outline">
            <mat-label>Buscar materia</mat-label>
            <input matInput formControlName="search" placeholder="Nombre o código">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </form>

        <!-- Loading spinner -->
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner></mat-spinner>
        </div>

        <!-- Subjects table -->
        <table mat-table [dataSource]="materias" class="subjects-table" *ngIf="!isLoading">
          
          <!-- Name Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre </th>
            <td mat-cell *matCellDef="let materia"> {{ materia.nombre }} </td>
          </ng-container>

          <!-- Code Column -->
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef> Código </th>
            <td mat-cell *matCellDef="let materia"> {{ materia.codigo }} </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="descripcion">
            <th mat-header-cell *matHeaderCellDef> Descripción </th>
            <td mat-cell *matCellDef="let materia"> {{ materia.descripcion || 'Sin descripción' }} </td>
          </ng-container>

          <!-- Credits Column -->
          <ng-container matColumnDef="creditos">
            <th mat-header-cell *matHeaderCellDef> Créditos </th>
            <td mat-cell *matCellDef="let materia"> {{ materia.creditos }} hs </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="activo">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let materia">
              <mat-chip [color]="materia.activo ? 'primary' : 'warn'">
                {{ materia.activo ? 'Activa' : 'Inactiva' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let materia">
              <button mat-icon-button [matMenuTriggerFor]="subjectMenu" aria-label="Más acciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #subjectMenu="matMenu">
                <button mat-menu-item (click)="openSubjectDialog(materia)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <button mat-menu-item (click)="viewAssignments(materia)">
                  <mat-icon>people</mat-icon>
                  <span>Ver Profesores</span>
                </button>
                <button mat-menu-item (click)="deleteSubject(materia)">
                  <mat-icon>delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- No subjects message -->
        <div *ngIf="!isLoading && materias.length === 0" class="no-data">
          <mat-icon>book</mat-icon>
          <p>No se encontraron materias</p>
          <button mat-raised-button color="primary" (click)="openSubjectDialog()">
            <mat-icon>add</mat-icon>
            Crear Primera Materia
          </button>
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
    .search-form {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .search-form mat-form-field {
      min-width: 300px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .subjects-table {
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
  `]
})
export class SubjectsComponent implements OnInit {
  materias: any[] = [];
  displayedColumns: string[] = ['nombre', 'codigo', 'descripcion', 'creditos', 'activo', 'actions'];
  isLoading = true;
  searchForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadSubjects();
    
    this.searchForm.valueChanges.subscribe(() => {
      this.filterSubjects();
    });
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.academicService.getMaterias().subscribe({
      next: (response: any) => {
        this.materias = Array.isArray(response) ? response : (response.data || []);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading subjects:', error);
        this.snackBar.open('Error al cargar materias', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  filterSubjects(): void {
    const { search } = this.searchForm.value;
    
    this.academicService.getMaterias().subscribe({
      next: (response: any) => {
        let filteredSubjects = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredSubjects = filteredSubjects.filter((materia: any) => 
            materia.nombre.toLowerCase().includes(searchLower) ||
            materia.codigo.toLowerCase().includes(searchLower) ||
            (materia.descripcion && materia.descripcion.toLowerCase().includes(searchLower))
          );
        }
        
        this.materias = filteredSubjects;
      }
    });
  }

  openSubjectDialog(subject?: any): void {
    const dialogData = {
      title: subject ? 'Editar Materia' : 'Nueva Materia',
      data: subject || {},
      isEdit: !!subject
    };
    
    // TODO: Implement dialog component
    this.snackBar.open(`${dialogData.title} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  deleteSubject(subject: any): void {
    if (confirm(`¿Está seguro de eliminar la materia ${subject.nombre}?`)) {
      this.academicService.deleteMateria(subject.id).subscribe({
        next: () => {
          this.snackBar.open('Materia eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadSubjects();
        },
        error: (error) => {
          console.error('Error deleting subject:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar materia', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  viewAssignments(subject: any): void {
    this.snackBar.open(`Mostrando profesores asignados a ${subject.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
    // TODO: Navigate to assignments view filtered by this subject
  }
}