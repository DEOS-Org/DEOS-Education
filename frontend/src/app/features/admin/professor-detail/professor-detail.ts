import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user';

interface ProfessorDetail {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string;
  activo: boolean;
  materias: Array<{
    id: number;
    nombre: string;
    carga_horaria: number;
    cursos: Array<{
      id: number;
      curso_nombre: string;
      division_nombre: string;
    }>;
  }>;
  horarios: Array<{
    id: number;
    dia: string;
    hora_inicio: string;
    hora_fin: string;
    materia_nombre: string;
    curso_nombre: string;
    aula?: string;
  }>;
  estadisticas: {
    total_materias: number;
    total_cursos: number;
    total_horas_semana: number;
    cursos_activos: number;
  };
}

@Component({
  selector: 'app-professor-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './professor-detail.html',
  styleUrl: './professor-detail.scss'
})
export class ProfessorDetailComponent implements OnInit {
  isLoading = true;
  professorId!: number;
  professorDetail!: ProfessorDetail;

  // Table columns
  materiasColumns: string[] = ['nombre', 'carga_horaria', 'cursos', 'acciones'];
  horariosColumns: string[] = ['dia', 'hora', 'materia', 'curso', 'aula'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.professorId = +params['id'];
      this.loadProfessorDetail();
    });
  }

  loadProfessorDetail(): void {
    this.isLoading = true;
    this.userService.getProfessorDetail(this.professorId).subscribe({
      next: (detail) => {
        this.professorDetail = detail;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading professor detail:', error);
        this.snackBar.open('Error al cargar los detalles del profesor', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/admin/users']);
  }

  editProfessor(): void {
    this.snackBar.open('Editar profesor - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  viewSubjectDetail(materia: any): void {
    this.snackBar.open(`Ver detalle de materia: ${materia.nombre}`, 'Cerrar', {
      duration: 3000
    });
  }

  viewCourseDetail(curso: any): void {
    this.router.navigate(['/admin/academic/division', curso.id]);
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // Remove seconds
  }

  getDayName(day: string): string {
    const days: { [key: string]: string } = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[day.toLowerCase()] || day;
  }

  exportSchedule(): void {
    this.snackBar.open('Exportar horario - Funcionalidad en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  getScheduleByDay(): any {
    const schedule: any = {};
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    
    days.forEach(day => {
      schedule[day] = this.professorDetail.horarios
        .filter(h => h.dia.toLowerCase() === day)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    });
    
    return schedule;
  }

  getTotalWeeklyHours(): number {
    return this.professorDetail.horarios.reduce((total, horario) => {
      const inicio = new Date(`1970-01-01T${horario.hora_inicio}`);
      const fin = new Date(`1970-01-01T${horario.hora_fin}`);
      const diff = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60); // Convert to hours
      return total + diff;
    }, 0);
  }
}