import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { AcademicService } from '../../../core/services/academic';

interface Curso {
  id: number;
  nombre: string;
  nivel: string;
  activo: boolean;
  divisiones?: number;
}

interface CursoDivision {
  id: number;
  nombre: string;
  curso_id: number;
  estudiantes?: number;
  profesores?: number;
  materias?: number;
  Curso: {
    id: number;
    nombre: string;
    nivel: string;
  };
}

@Component({
  selector: 'app-academic-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './academic-management.html',
  styleUrl: './academic-management.scss'
})
export class AcademicManagementComponent implements OnInit {
  isLoading = true;
  cursos: Curso[] = [];
  cursosDivisiones: CursoDivision[] = [];
  selectedCurso: Curso | null = null;
  divisionesDelCurso: CursoDivision[] = [];

  constructor(
    private academicService: AcademicService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    console.log('=== AcademicManagementComponent CONSTRUCTOR ===');
    console.log('Componente creado en:', new Date().toLocaleTimeString());
  }

  ngOnInit(): void {
    console.log('=== AcademicManagementComponent LOADED ===');
    console.log('Component initialized at:', new Date().toISOString());
    console.log('AcademicManagementComponent: Iniciando carga de datos');
    
    // Add global click listener for debugging
    document.addEventListener('click', (e) => {
      console.log('Global click detected on element:', e.target);
      const element = e.target as HTMLElement;
      if (element.closest('.curso-card')) {
        console.log('Click was on a curso card!');
      }
    });
    
    this.loadCursos();
    this.loadCursosDivisiones();
  }

  loadCursos(): void {
    console.log('Cargando cursos...');
    this.academicService.getCursos().subscribe({
      next: (cursos) => {
        console.log('=== CURSOS CARGADOS DEL BACKEND ===');
        console.log('Cursos cargados:', cursos);
        console.log('Primer curso:', cursos[0]);
        console.log('¿Tiene divisiones?', cursos[0]?.divisiones);
        this.cursos = cursos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cursos:', error);
        this.snackBar.open('Error al cargar los cursos', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  loadCursosDivisiones(): void {
    // This will be loaded dynamically when a curso is selected
    this.cursosDivisiones = [];
  }

  selectCurso(curso: Curso): void {
    console.log('=== CLICK EN CURSO DETECTADO ===');
    console.log('Curso seleccionado:', curso);
    console.log('Evento click ejecutado a las:', new Date().toLocaleTimeString());
    
    this.selectedCurso = curso;
    
    // Show immediate feedback
    this.snackBar.open(`Cargando divisiones del ${curso.nombre}...`, '', {
      duration: 2000
    });
    
    // Load divisions for the selected curso
    this.academicService.getDivisionesByCurso(curso.id!).subscribe({
      next: (divisiones) => {
        console.log('=== DIVISIONES CARGADAS ===');
        console.log('Divisiones cargadas:', divisiones);
        console.log('Primera división:', divisiones[0]);
        console.log('Estudiantes:', divisiones[0]?.estudiantes);
        console.log('Profesores:', divisiones[0]?.profesores);
        console.log('Materias:', divisiones[0]?.materias);
        this.divisionesDelCurso = divisiones;
      },
      error: (error) => {
        console.error('=== ERROR CARGANDO DIVISIONES ===');
        console.error('Error loading divisiones for curso:', error);
        this.snackBar.open('Error al cargar las divisiones del curso', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.divisionesDelCurso = [];
      }
    });
  }

  backToMain(): void {
    this.selectedCurso = null;
    this.divisionesDelCurso = [];
  }

  openCursoDivisionDetails(cursoDivision: CursoDivision): void {
    // Navigate to division detail page
    this.router.navigate(['/admin/academic/division', cursoDivision.id]);
  }

  getCursoColor(index: number): string {
    const colors = ['primary', 'accent', 'warn'];
    return colors[index % colors.length];
  }

  getDivisionColor(index: number): string {
    const colors = ['accent', 'warn', 'primary'];
    return colors[index % colors.length];
  }


  testClick(): void {
    console.log('TEST CLICK FUNCIONANDO!');
    alert('Click test funcionando!');
  }
}
