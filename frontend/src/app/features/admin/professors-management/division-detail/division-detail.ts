import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AcademicService } from '../../../../core/services/academic';
import { UserService } from '../../../../core/services/user';

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

interface Professor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
}

interface Subject {
  id: number;
  nombre: string;
  descripcion?: string;
  curso_id: number;
}

interface ProfessorSubjectAssignment {
  profesor_id: number;
  materia_id: number;
  curso_division_id: number;
}

@Component({
  selector: 'app-division-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './division-detail.html',
  styleUrl: './division-detail.scss'
})
export class DivisionDetailComponent implements OnInit {
  course: Course | null = null;
  division: Division | null = null;
  courseId!: number;
  divisionId!: number;
  
  assignedProfessors: Professor[] = [];
  availableSubjects: Subject[] = [];
  professorSubjectAssignments: ProfessorSubjectAssignment[] = [];
  
  loadingProfessors = true;
  loadingSubjects = true;

  constructor(
    private route: ActivatedRoute,
    private academicService: AcademicService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['courseId'];
      this.divisionId = +params['divisionId'];
      this.loadData();
    });
  }

  private loadData(): void {
    console.log('Division Detail: Loading all data for division:', this.divisionId, 'course:', this.courseId);
    this.loadCourseAndDivision();
    this.loadAvailableSubjects();
    this.loadAssignedProfessors();
    // loadProfessorSubjectAssignments will be called after professors and subjects are loaded
  }

  private loadCourseAndDivision(): void {
    // Load course details
    this.academicService.getCursos().subscribe({
      next: (response) => {
        console.log('Division Detail: getCursos API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let coursesData = [];
        if (Array.isArray(response)) {
          // Direct array format
          coursesData = response;
          console.log('Division Detail: Direct array format for courses');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          coursesData = response.data;
          console.log('Division Detail: Object format with success/data for courses');
        } else {
          console.warn('Division Detail: Unexpected courses response format:', response);
          coursesData = [];
        }
        
        console.log('Division Detail: Raw courses data:', coursesData);
        this.course = coursesData.find((c: Course) => c.id === this.courseId) || null;
        console.log('Division Detail: Found course:', this.course);
      },
      error: (error) => {
        console.error('Division Detail: Error loading course:', error);
      }
    });

    // Load division details
    console.log('Division Detail: Loading divisions for course ID:', this.courseId);
    this.academicService.getDivisionesByCurso(this.courseId).subscribe({
      next: (response) => {
        console.log('Division Detail: getDivisionesByCurso API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let divisionsData = [];
        if (Array.isArray(response)) {
          // Direct array format
          divisionsData = response;
          console.log('Division Detail: Direct array format for divisions');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          divisionsData = response.data;
          console.log('Division Detail: Object format with success/data for divisions');
        } else {
          console.warn('Division Detail: Unexpected divisions response format:', response);
          divisionsData = [];
        }
        
        console.log('Division Detail: Raw divisions data:', divisionsData);
        this.division = divisionsData.find((d: Division) => d.id === this.divisionId) || null;
        console.log('Division Detail: Found division:', this.division);
      },
      error: (error) => {
        console.error('Division Detail: Error loading division:', error);
      }
    });
  }

  private loadAssignedProfessors(): void {
    this.loadingProfessors = true;
    
    console.log('Division Detail: Loading professors for division ID:', this.divisionId);
    
    // Load all professors first - in the future we'll have specific endpoint for division professors
    this.userService.getUsersByRole('profesor').subscribe({
      next: (response: any) => {
        this.loadingProfessors = false;
        console.log('Division Detail: getUsersByRole(profesor) API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let professorsData = [];
        if (Array.isArray(response)) {
          // Direct array format
          professorsData = response;
          console.log('Division Detail: Direct array format for professors');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          professorsData = response.data;
          console.log('Division Detail: Object format with success/data for professors');
        } else {
          console.warn('Division Detail: Unexpected professors response format:', response);
          professorsData = [];
        }
        
        console.log('Division Detail: Raw professors data:', professorsData);
        
        // For now, show first 3 professors as assigned (simulation)
        // In production, this would be filtered by actual assignments to this division
        this.assignedProfessors = professorsData.slice(0, 3);
        console.log('Division Detail: Assigned professors (simulated):', this.assignedProfessors);
        
        // Load assignments after professors are loaded
        this.loadProfessorSubjectAssignments();
      },
      error: (error) => {
        this.loadingProfessors = false;
        console.error('Division Detail: Error loading professors:', error);
        this.assignedProfessors = [];
      }
    });
  }

  private loadAvailableSubjects(): void {
    this.loadingSubjects = true;
    
    console.log('Division Detail: Loading subjects...');
    this.academicService.getMaterias().subscribe({
      next: (response: any) => {
        this.loadingSubjects = false;
        console.log('Division Detail: getMaterias API response:', response);
        
        // Handle both formats: direct array or {success: true, data: array}
        let subjectsData = [];
        if (Array.isArray(response)) {
          // Direct array format
          subjectsData = response;
          console.log('Division Detail: Direct array format for subjects');
        } else if (response?.success && response?.data) {
          // Object format with success/data
          subjectsData = response.data;
          console.log('Division Detail: Object format with success/data for subjects');
        } else {
          console.warn('Division Detail: Unexpected subjects response format:', response);
          subjectsData = [];
        }
        
        console.log('Division Detail: Raw subjects data:', subjectsData);
        // Filter subjects by course_id if available, otherwise show all
        if (this.courseId) {
          // In future, we can filter by course_id when this field is available in subjects
          // For now, show first 5 subjects as available for this course
          this.availableSubjects = subjectsData.slice(0, 5);
        } else {
          this.availableSubjects = subjectsData;
        }
        console.log('Division Detail: Available subjects:', this.availableSubjects);
      },
      error: (error: any) => {
        this.loadingSubjects = false;
        console.error('Division Detail: Error loading subjects:', error);
        this.availableSubjects = [];
      }
    });
  }

  private loadProfessorSubjectAssignments(): void {
    console.log('Division Detail: Loading professor-subject assignments...');
    
    // Simulation of assignments - in production this would come from the backend
    // Create some mock assignments for demonstration
    if (this.assignedProfessors.length > 0 && this.availableSubjects.length > 0) {
      this.professorSubjectAssignments = [
        {
          profesor_id: this.assignedProfessors[0]?.id || 1,
          materia_id: this.availableSubjects[0]?.id || 1,
          curso_division_id: this.divisionId
        },
        {
          profesor_id: this.assignedProfessors[1]?.id || 2,
          materia_id: this.availableSubjects[1]?.id || 2,
          curso_division_id: this.divisionId
        }
      ];
    } else {
      this.professorSubjectAssignments = [];
    }
    
    console.log('Division Detail: Professor-subject assignments (simulated):', this.professorSubjectAssignments);
  }

  getProfessorSubjects(professorId: number): Subject[] {
    const assignedSubjectIds = this.professorSubjectAssignments
      .filter(assignment => assignment.profesor_id === professorId)
      .map(assignment => assignment.materia_id);
    
    return this.availableSubjects.filter(subject => 
      assignedSubjectIds.includes(subject.id)
    );
  }

  getSubjectProfessor(subjectId: number): Professor | null {
    const assignment = this.professorSubjectAssignments
      .find(assignment => assignment.materia_id === subjectId);
    
    if (!assignment) return null;
    
    return this.assignedProfessors.find(professor => 
      professor.id === assignment.profesor_id
    ) || null;
  }

  openAssignProfessorDialog(): void {
    console.log('Division Detail: Opening assign professor dialog for division:', this.divisionId);
    // TODO: Implement assign professor dialog
    this.snackBar.open('Funcionalidad de asignación de profesores próximamente. División: ' + this.division?.nombre, 'Cerrar', { 
      duration: 3000 
    });
  }

  openAssignSubjectDialog(professor: Professor): void {
    console.log('Division Detail: Opening assign subject dialog for professor:', professor);
    // TODO: Implement assign subject dialog
    this.snackBar.open(`Asignar materia a ${professor.nombre} ${professor.apellido} - División ${this.division?.nombre} - Próximamente`, 'Cerrar', { 
      duration: 3000 
    });
  }

  removeSubjectFromProfessor(professorId: number, subjectId: number): void {
    console.log('Division Detail: Removing subject', subjectId, 'from professor', professorId);
    // TODO: Implement remove subject from professor
    const professor = this.assignedProfessors.find(p => p.id === professorId);
    const subject = this.availableSubjects.find(s => s.id === subjectId);
    this.snackBar.open(`Remover ${subject?.nombre || 'materia'} de ${professor?.nombre || 'profesor'} - Próximamente`, 'Cerrar', { 
      duration: 3000 
    });
  }

  removeProfessorFromDivision(professorId: number): void {
    console.log('Division Detail: Removing professor', professorId, 'from division', this.divisionId);
    // TODO: Implement remove professor from division
    const professor = this.assignedProfessors.find(p => p.id === professorId);
    this.snackBar.open(`Remover ${professor?.nombre} ${professor?.apellido} de División ${this.division?.nombre} - Próximamente`, 'Cerrar', { 
      duration: 3000 
    });
  }

  refreshData(): void {
    this.loadData();
  }
}