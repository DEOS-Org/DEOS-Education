import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../../../core/services/academic';

interface CursoDivisionDetails {
  id: number;
  curso: {
    id: number;
    año: number;
    nombre: string;
  };
  division: {
    id: number;
    nombre: string;
  };
  nombre_completo: string;
  estudiantes: any[];
  profesores: any[];
  materias: any[];
  registros_asistencia: any[];
  estadisticas: {
    total_estudiantes: number;
    total_profesores: number;
    total_materias: number;
    registros_recientes: number;
  };
}

@Component({
  selector: 'app-course-division-details',
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
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    FormsModule
  ],
  templateUrl: './course-division-details.html',
  styleUrl: './course-division-details.scss'
})
export class CourseDivisionDetailsComponent implements OnInit {
  isLoading = true;
  cursoDivisionId!: number;
  details: CursoDivisionDetails | null = null;
  
  // For attendance filtering
  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;

  // Table columns
  estudiantesColumns: string[] = ['dni', 'nombre', 'apellido', 'email', 'activo'];
  profesoresColumns: string[] = ['dni', 'nombre', 'apellido', 'email', 'materia_nombre'];
  asistenciaColumns: string[] = ['fecha', 'hora', 'nombre', 'dni', 'tipo', 'dispositivo'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academicService: AcademicService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cursoDivisionId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.cursoDivisionId) {
      this.loadDetails();
    } else {
      this.snackBar.open('ID de curso-división no válido', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.goBack();
    }
  }

  loadDetails(): void {
    this.isLoading = true;
    this.academicService.getCursoDivisionDetails(this.cursoDivisionId).subscribe({
      next: (details) => {
        this.details = details;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course division details:', error);
        this.snackBar.open('Error al cargar los detalles', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  filterAttendance(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      this.snackBar.open('Selecciona ambas fechas para filtrar', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const fechaDesdeStr = this.fechaDesde.toISOString().split('T')[0];
    const fechaHastaStr = this.fechaHasta.toISOString().split('T')[0];

    this.academicService.getRegistrosAsistenciaByCursoDivision(
      this.cursoDivisionId,
      fechaDesdeStr,
      fechaHastaStr
    ).subscribe({
      next: (registros) => {
        if (this.details) {
          this.details.registros_asistencia = registros;
        }
      },
      error: (error) => {
        console.error('Error filtering attendance:', error);
        this.snackBar.open('Error al filtrar la asistencia', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  clearAttendanceFilter(): void {
    this.fechaDesde = null;
    this.fechaHasta = null;
    this.loadDetails(); // Reload without filters
  }

  goBack(): void {
    this.router.navigate(['/admin/academic']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR');
  }

  formatTime(timeString: string): string {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypeColor(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'ingreso':
        return 'primary';
      case 'egreso':
        return 'accent';
      default:
        return 'warn';
    }
  }

  getActiveStatusColor(activo: boolean): string {
    return activo ? 'primary' : 'warn';
  }

  getActiveStatusText(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}