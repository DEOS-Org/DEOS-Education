import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicService } from '../../../../core/services/academic';

interface Course {
  id: number;
  nombre: string;
  nivel: string;
  descripcion?: string;
  activo: boolean;
}

interface Division {
  id: number;
  nombre: string;
  curso_id: number;
  capacidad?: number;
  activo: boolean;
}

@Component({
  selector: 'app-course-divisions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './course-divisions.html',
  styleUrl: './course-divisions.scss'
})
export class CourseDivisionsComponent implements OnInit {
  course: Course | null = null;
  divisions: Division[] = [];
  loading = true;
  courseId!: number;
  
  // Cache for statistics
  professorCounts: { [divisionId: number]: number } = {};
  subjectCounts: { [divisionId: number]: number } = {};

  constructor(
    private route: ActivatedRoute,
    private academicService: AcademicService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['courseId'];
      this.loadCourseData();
    });
  }

  private loadCourseData(): void {
    this.loading = true;
    
    // Load course details
    this.academicService.getCursos().subscribe({
      next: (response) => {
        console.log('Course Divisions: getCursos API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let coursesData = [];
        if (Array.isArray(response)) {
          // Direct array format
          coursesData = response;
          console.log('Course Divisions: Direct array format');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          coursesData = response.data;
          console.log('Course Divisions: Object format with success/data');
        } else {
          console.warn('Course Divisions: Unexpected response format:', response);
          this.handleError('Error al cargar el curso - formato de respuesta inesperado');
          return;
        }
        
        console.log('Course Divisions: Raw courses data:', coursesData);
        this.course = coursesData.find((c: Course) => c.id === this.courseId) || null;
        console.log('Course Divisions: Found course:', this.course);
        
        if (this.course) {
          this.loadDivisions();
        } else {
          this.handleError('Curso no encontrado');
        }
      },
      error: (error) => {
        console.error('Course Divisions: Error loading course:', error);
        this.handleError('Error al cargar el curso');
      }
    });
  }

  private loadDivisions(): void {
    if (!this.courseId) {
      this.loading = false;
      return;
    }

    console.log('Course Divisions: Loading divisions for course ID:', this.courseId);
    this.academicService.getDivisionesByCurso(this.courseId).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Course Divisions: getDivisionesByCurso API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let divisionsData = [];
        if (Array.isArray(response)) {
          // Direct array format
          divisionsData = response;
          console.log('Course Divisions: Direct array format for divisions');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          divisionsData = response.data;
          console.log('Course Divisions: Object format with success/data for divisions');
        } else {
          console.warn('Course Divisions: Unexpected divisions response format:', response);
          divisionsData = [];
        }
        
        console.log('Course Divisions: Raw divisions data:', divisionsData);
        this.divisions = divisionsData.filter((division: Division) => division.activo);
        console.log('Course Divisions: Filtered active divisions:', this.divisions);
        this.loadStatistics();
      },
      error: (error) => {
        this.loading = false;
        console.error('Course Divisions: Error loading divisions:', error);
        this.snackBar.open('Error al cargar las divisiones', 'Cerrar', { duration: 3000 });
        this.divisions = [];
      }
    });
  }

  private loadStatistics(): void {
    console.log('Course Divisions: Loading statistics for divisions:', this.divisions);
    // Load actual statistics for each division
    this.divisions.forEach(division => {
      // For now, simulate some counts. In production, these would come from actual API calls
      this.professorCounts[division.id] = Math.floor(Math.random() * 5) + 1; // 1-5 professors
      this.subjectCounts[division.id] = Math.floor(Math.random() * 8) + 3; // 3-10 subjects
      
      console.log(`Course Divisions: Division ${division.nombre} - ${this.professorCounts[division.id]} professors, ${this.subjectCounts[division.id]} subjects`);
    });
  }

  getProfessorCount(divisionId: number): number {
    return this.professorCounts[divisionId] || 0;
  }

  getSubjectCount(divisionId: number): number {
    return this.subjectCounts[divisionId] || 0;
  }

  refreshData(): void {
    this.loadCourseData();
  }

  private handleError(message: string): void {
    this.loading = false;
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}