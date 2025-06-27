import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProfessorService } from '../../../core/services/professor';

@Component({
  selector: 'app-professor-classes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './classes.html',
  styleUrl: './classes.scss'
})
export class ClassesComponent implements OnInit {
  // Reactive state with signals
  loading = signal(false);
  clases = signal<any[]>([]);

  // Computed properties
  totalClases = computed(() => this.clases().length);
  totalEstudiantes = computed(() => 
    this.clases().reduce((total, clase) => total + (clase.total_estudiantes || 0), 0)
  );

  constructor(
    private professorService: ProfessorService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClases();
  }

  private loadClases(): void {
    this.loading.set(true);
    
    this.professorService.getClases().pipe(
      catchError((error) => {
        console.error('Error loading classes:', error);
        this.snackBar.open('Error al cargar las clases', 'Cerrar', { duration: 5000 });
        // Usar datos mock como fallback
        return of([
          {
            id: 1,
            materia: 'Matemática',
            curso_division: '3° A',
            dia: 'lunes',
            hora_inicio: '08:00',
            hora_fin: '09:30',
            aula: 'A101',
            total_estudiantes: 25
          },
          {
            id: 2,
            materia: 'Física',
            curso_division: '4° B',
            dia: 'martes',
            hora_inicio: '10:00',
            hora_fin: '11:30',
            aula: 'Lab1',
            total_estudiantes: 22
          }
        ]);
      })
    ).subscribe(data => {
      this.clases.set(data);
      this.loading.set(false);
    });
  }

  // Navigation methods
  verDetalleClase(clase: any): void {
    // Navegar al detalle de la clase
    this.router.navigate(['/professor/classes', clase.id]);
  }

  verEstudiantes(clase: any): void {
    // Navegar a estudiantes de la clase
    this.router.navigate(['/professor/students'], { queryParams: { claseId: clase.id } });
  }

  verAsistencia(clase: any): void {
    // Navegar a asistencia de la clase
    this.router.navigate(['/professor/attendance'], { queryParams: { claseId: clase.id } });
  }

  verCalificaciones(clase: any): void {
    // Navegar a calificaciones de la clase
    this.router.navigate(['/professor/grades'], { queryParams: { claseId: clase.id } });
  }

  // Helper methods
  getScheduleTimeRange(clase: any): string {
    if (!clase?.hora_inicio || !clase?.hora_fin) return 'Sin horario';
    return `${clase.hora_inicio} - ${clase.hora_fin}`;
  }

  getDayName(dia: string): string {
    const days = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[dia as keyof typeof days] || dia;
  }

  refreshClases(): void {
    this.loadClases();
    this.snackBar.open('Clases actualizadas', 'Cerrar', { duration: 3000 });
  }

  trackByClaseId(index: number, clase: any): any {
    return clase?.id || index;
  }
}