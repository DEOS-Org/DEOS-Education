import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AcademicService } from '../../../core/services/academic';
import { BiometricService } from '../../../core/services/biometric';

@Component({
  selector: 'app-preceptor-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.scss'
})
export class PreceptorAttendanceComponent implements OnInit, OnDestroy {
  isLoading = true;
  filtersForm: FormGroup;
  
  // Data
  attendanceRecords: any[] = [];
  divisions: any[] = [];
  students: any[] = [];
  
  // Table configuration
  displayedColumns: string[] = ['student', 'division', 'time', 'type', 'status', 'device', 'actions'];
  
  // Summary stats
  summaryStats = {
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    attendanceRate: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private biometricService: BiometricService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      selectedDate: [new Date()],
      division: [''],
      student: [''],
      attendanceType: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadInitialData(): void {
    this.isLoading = true;
    
    // Load divisions
    this.subscriptions.push(
      this.academicService.getDivisiones().subscribe({
        next: (response) => {
          this.divisions = Array.isArray(response) ? response : (response.data || []);
          this.loadAttendanceData();
        },
        error: (error) => {
          console.error('Error loading divisions:', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar divisiones', 'Cerrar', { duration: 5000 });
        }
      })
    );
  }

  setupFormSubscriptions(): void {
    this.subscriptions.push(
      this.filtersForm.valueChanges.subscribe(() => {
        this.loadAttendanceData();
      })
    );
  }

  loadAttendanceData(): void {
    const selectedDate = this.filtersForm.get('selectedDate')?.value;
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    this.subscriptions.push(
      this.biometricService.getRegistrosByFecha(dateStr, dateStr).subscribe({
        next: (response) => {
          const allRecords = Array.isArray(response) ? response : (response.data || []);
          this.processAttendanceRecords(allRecords);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading attendance data:', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar datos de asistencia', 'Cerrar', { duration: 5000 });
        }
      })
    );
  }

  processAttendanceRecords(records: any[]): void {
    // Apply filters
    let filteredRecords = records;

    const filters = this.filtersForm.value;
    
    if (filters.division) {
      // Filter by division (would need proper division mapping)
      filteredRecords = filteredRecords.filter(record => {
        // Simulate division filtering for now
        return true;
      });
    }

    if (filters.student) {
      filteredRecords = filteredRecords.filter(record => 
        record.usuario_id === Number(filters.student)
      );
    }

    if (filters.attendanceType) {
      filteredRecords = filteredRecords.filter(record => 
        record.tipo === filters.attendanceType
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredRecords = filteredRecords.filter(record => 
        (record.Usuario?.nombre?.toLowerCase().includes(searchTerm)) ||
        (record.Usuario?.apellido?.toLowerCase().includes(searchTerm)) ||
        (record.Usuario?.dni?.includes(searchTerm))
      );
    }

    // Process records for display
    this.attendanceRecords = filteredRecords.map(record => ({
      id: record.id,
      student: {
        id: record.usuario_id,
        name: record.Usuario ? `${record.Usuario.nombre} ${record.Usuario.apellido}` : 'Estudiante',
        dni: record.Usuario?.dni || 'Sin DNI'
      },
      division: this.getStudentDivision(record.usuario_id),
      time: new Date(record.fecha).toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: record.tipo,
      status: this.getAttendanceStatus(record),
      device: record.DispositivoFichaje?.nombre || 'Dispositivo desconocido',
      originalRecord: record
    }));

    this.calculateSummaryStats();
  }

  getStudentDivision(studentId: number): string {
    // This would need proper mapping from student to division
    // For now, return a simulated division
    const divisions = ['1° A', '1° B', '2° A', '2° B', '3° A'];
    return divisions[studentId % divisions.length];
  }

  getAttendanceStatus(record: any): string {
    if (record.tipo === 'egreso') return 'egreso';
    
    const recordTime = new Date(record.fecha);
    const hours = recordTime.getHours();
    const minutes = recordTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Consider late if after 8:30 AM (510 minutes)
    return totalMinutes > 510 ? 'tarde' : 'presente';
  }

  calculateSummaryStats(): void {
    const ingresoRecords = this.attendanceRecords.filter(r => r.type === 'ingreso');
    
    this.summaryStats.totalPresent = ingresoRecords.filter(r => r.status === 'presente').length;
    this.summaryStats.totalLate = ingresoRecords.filter(r => r.status === 'tarde').length;
    
    // Calculate absent students (this would need total student count per division)
    const totalExpectedStudents = this.getTotalExpectedStudents();
    this.summaryStats.totalAbsent = Math.max(0, totalExpectedStudents - ingresoRecords.length);
    
    // Calculate attendance rate
    if (totalExpectedStudents > 0) {
      this.summaryStats.attendanceRate = Math.round(
        (ingresoRecords.length / totalExpectedStudents) * 100
      );
    }
  }

  getTotalExpectedStudents(): number {
    // This would calculate based on selected divisions
    // For now, return a simulated total
    return this.divisions.reduce((sum, div) => sum + (div.estudiantes || 30), 0);
  }

  getStatusChipColor(status: string): string {
    switch (status) {
      case 'presente': return 'primary';
      case 'tarde': return 'accent';
      case 'egreso': return '';
      default: return 'warn';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'presente': return 'check_circle';
      case 'tarde': return 'schedule';
      case 'egreso': return 'exit_to_app';
      default: return 'help';
    }
  }

  getTypeIcon(type: string): string {
    return type === 'ingreso' ? 'login' : 'logout';
  }

  markAttendanceManually(): void {
    // Open dialog for manual attendance marking
    this.snackBar.open('Funcionalidad de registro manual - En desarrollo', 'Cerrar', { duration: 3000 });
  }

  exportAttendance(): void {
    // Export functionality
    this.snackBar.open('Funcionalidad de exportación - En desarrollo', 'Cerrar', { duration: 3000 });
  }

  refreshData(): void {
    this.loadAttendanceData();
  }

  viewStudentDetail(student: any): void {
    // Navigate to student detail
    console.log('View student detail:', student);
  }

  editAttendanceRecord(record: any): void {
    // Open edit dialog
    this.snackBar.open('Funcionalidad de edición - En desarrollo', 'Cerrar', { duration: 3000 });
  }

  deleteAttendanceRecord(record: any): void {
    if (confirm('¿Está seguro de eliminar este registro de asistencia?')) {
      // Delete logic here
      this.snackBar.open('Funcionalidad de eliminación - En desarrollo', 'Cerrar', { duration: 3000 });
    }
  }
}