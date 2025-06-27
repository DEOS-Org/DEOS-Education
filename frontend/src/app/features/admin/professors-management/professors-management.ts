import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicService } from '../../../core/services/academic';

interface Course {
  id: number;
  nombre: string;
  nivel: string;
  descripcion?: string;
  activo: boolean;
}

@Component({
  selector: 'app-professors-management',
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
  templateUrl: './professors-management.html',
  styleUrl: './professors-management.scss'
})
export class ProfessorsManagementComponent implements OnInit {
  courses: Course[] = [];
  loading = true;
  
  // Cache for statistics
  divisionCounts: { [courseId: number]: number } = {};
  professorCounts: { [courseId: number]: number } = {};

  constructor(
    private academicService: AcademicService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  private loadCourses(): void {
    this.loading = true;
    
    this.academicService.getCursos().subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Professors: API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let coursesData = [];
        if (Array.isArray(response)) {
          // Direct array format
          coursesData = response;
          console.log('Professors: Direct array format');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          coursesData = response.data;
          console.log('Professors: Object format with success/data');
        }
        
        console.log('Professors: Raw courses data:', coursesData);
        this.courses = coursesData.filter((course: Course) => course.activo);
        console.log('Professors: Filtered active courses:', this.courses);
        this.loadStatistics();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading courses:', error);
        this.snackBar.open('Error al cargar los cursos', 'Cerrar', { duration: 3000 });
        this.courses = [];
      }
    });
  }

  private loadStatistics(): void {
    // Load division counts for each course
    this.courses.forEach(course => {
      this.academicService.getDivisionesByCurso(course.id).subscribe({
        next: (response) => {
          console.log(`Professors: getDivisionesByCurso API response for course ${course.id}:`, response);
          
          // Handle both formats: direct array or {success: true, data: array}
          let divisionsData = [];
          if (Array.isArray(response)) {
            // Direct array format
            divisionsData = response;
            console.log(`Professors: Direct array format for course ${course.id} divisions`);
          } else if (response?.success && response?.data) {
            // Object format with success/data
            divisionsData = response.data;
            console.log(`Professors: Object format with success/data for course ${course.id} divisions`);
          } else {
            console.warn(`Professors: Unexpected divisions response format for course ${course.id}:`, response);
            divisionsData = [];
          }
          
          this.divisionCounts[course.id] = divisionsData.length;
          console.log(`Professors: Course ${course.id} has ${divisionsData.length} divisions`);
        },
        error: (error) => {
          console.error(`Professors: Error loading divisions for course ${course.id}:`, error);
          this.divisionCounts[course.id] = 0;
        }
      });

      // For now, set professor count to 0, will be calculated later
      this.professorCounts[course.id] = 0;
    });
  }

  getDivisionCount(courseId: number): number {
    return this.divisionCounts[courseId] || 0;
  }

  getProfessorCount(courseId: number): number {
    return this.professorCounts[courseId] || 0;
  }

  refreshData(): void {
    this.loadCourses();
  }
}