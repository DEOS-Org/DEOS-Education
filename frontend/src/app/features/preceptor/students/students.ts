import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user';
import { AcademicService } from '../../../core/services/academic';
import { BiometricService } from '../../../core/services/biometric';

@Component({
  selector: 'app-preceptor-students',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './students.html',
  styleUrl: './students.scss'
})
export class PreceptorStudentsComponent implements OnInit, OnDestroy {
  isLoading = true;
  filtersForm: FormGroup;
  
  // Data
  students: any[] = [];
  divisions: any[] = [];
  
  // Table configuration
  displayedColumns: string[] = ['student', 'division', 'attendance', 'fingerprint', 'lastAccess', 'status', 'actions'];
  
  // Statistics
  stats = {
    totalStudents: 0,
    activeStudents: 0,
    withFingerprint: 0,
    withoutFingerprint: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private academicService: AcademicService,
    private biometricService: BiometricService,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      search: [''],
      division: [''],
      status: [''],
      fingerprintStatus: ['']
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
    
    // Load divisions first
    this.subscriptions.push(
      this.academicService.getDivisiones().subscribe({
        next: (response) => {
          this.divisions = Array.isArray(response) ? response : (response.data || []);
          this.loadStudents();
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
        this.filterStudents();
      })
    );
  }

  loadStudents(): void {
    this.subscriptions.push(
      this.userService.getUsers().subscribe({
        next: (response) => {
          const allStudents = Array.isArray(response) ? response : (response.data || []);
          const studentsOnly = allStudents.filter((user: any) => user.role === 'alumno');
          this.processStudentsData(studentsOnly);
          this.loadAttendanceData();
        },
        error: (error) => {
          console.error('Error loading students:', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar estudiantes', 'Cerrar', { duration: 5000 });
        }
      })
    );
  }

  processStudentsData(studentsData: any[]): void {
    this.students = studentsData.map(student => ({
      id: student.id,
      name: `${student.nombre} ${student.apellido}`,
      firstName: student.nombre,
      lastName: student.apellido,
      dni: student.dni,
      email: student.email,
      phone: student.telefono,
      division: this.getStudentDivision(student.id),
      attendanceRate: 0, // Will be calculated
      hasFingerprint: student.tiene_huella || false,
      lastAccess: student.ultimo_acceso || null,
      status: student.activo ? 'active' : 'inactive',
      originalData: student
    }));

    this.calculateStats();
    this.filterStudents();
  }

  getStudentDivision(studentId: number): string {
    // This would need proper mapping from student to division
    // For now, return a simulated division
    const divisions = ['1° A', '1° B', '2° A', '2° B', '3° A'];
    return divisions[studentId % divisions.length];
  }

  loadAttendanceData(): void {
    // Load recent attendance data for students
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    this.subscriptions.push(
      this.biometricService.getRegistrosByFecha(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ).subscribe({
        next: (response) => {
          const records = Array.isArray(response) ? response : (response.data || []);
          this.calculateAttendanceRates(records);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading attendance data:', error);
          this.isLoading = false;
        }
      })
    );
  }

  calculateAttendanceRates(records: any[]): void {
    // Calculate attendance rate for each student based on last week's data
    this.students.forEach(student => {
      const studentRecords = records.filter(r => r.usuario_id === student.id && r.tipo === 'ingreso');
      // Simulate attendance rate calculation (would need more complex logic)
      student.attendanceRate = Math.floor(Math.random() * 40) + 60; // 60-100%
    });
  }

  calculateStats(): void {
    this.stats.totalStudents = this.students.length;
    this.stats.activeStudents = this.students.filter(s => s.status === 'active').length;
    this.stats.withFingerprint = this.students.filter(s => s.hasFingerprint).length;
    this.stats.withoutFingerprint = this.stats.totalStudents - this.stats.withFingerprint;
  }

  filterStudents(): void {
    const filters = this.filtersForm.value;
    
    let filtered = [...this.students];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm) ||
        student.dni?.includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.division) {
      filtered = filtered.filter(student => student.division === filters.division);
    }

    if (filters.status) {
      filtered = filtered.filter(student => student.status === filters.status);
    }

    if (filters.fingerprintStatus) {
      const hasFingerprint = filters.fingerprintStatus === 'with';
      filtered = filtered.filter(student => student.hasFingerprint === hasFingerprint);
    }

    // Update displayed students (in a real app, this would be handled by the table datasource)
    this.students = filtered;
  }

  getAttendanceChipColor(rate: number): string {
    if (rate >= 90) return 'primary';
    if (rate >= 75) return 'accent';
    return 'warn';
  }

  getStatusChipColor(status: string): string {
    return status === 'active' ? 'primary' : 'warn';
  }

  getFingerprintIcon(hasFingerprint: boolean): string {
    return hasFingerprint ? 'fingerprint' : 'warning';
  }

  getFingerprintColor(hasFingerprint: boolean): string {
    return hasFingerprint ? 'var(--interactive-success)' : 'var(--interactive-warning)';
  }

  formatLastAccess(lastAccess: string | null): string {
    if (!lastAccess) return 'Nunca';
    
    const date = new Date(lastAccess);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString('es-AR');
  }

  viewStudentDetail(student: any): void {
    // Navigate to student detail view
    console.log('View student detail:', student);
    this.snackBar.open(`Ver detalle de ${student.name} - En desarrollo`, 'Cerrar', { duration: 3000 });
  }

  editStudent(student: any): void {
    // Open edit dialog
    this.snackBar.open(`Editar ${student.name} - En desarrollo`, 'Cerrar', { duration: 3000 });
  }

  viewAttendanceHistory(student: any): void {
    // Navigate to attendance history
    this.snackBar.open(`Ver historial de asistencia de ${student.name} - En desarrollo`, 'Cerrar', { duration: 3000 });
  }

  registerFingerprint(student: any): void {
    // Navigate to fingerprint registration
    this.snackBar.open(`Registrar huella de ${student.name} - En desarrollo`, 'Cerrar', { duration: 3000 });
  }

  sendNotification(student: any): void {
    // Send notification to student
    this.snackBar.open(`Enviar notificación a ${student.name} - En desarrollo`, 'Cerrar', { duration: 3000 });
  }

  toggleStudentStatus(student: any): void {
    const action = student.status === 'active' ? 'desactivar' : 'activar';
    if (confirm(`¿Está seguro de ${action} a ${student.name}?`)) {
      // Toggle status logic
      this.snackBar.open(`${action} estudiante - En desarrollo`, 'Cerrar', { duration: 3000 });
    }
  }

  exportStudents(): void {
    // Export students list
    this.snackBar.open('Exportar lista de estudiantes - En desarrollo', 'Cerrar', { duration: 3000 });
  }

  addStudent(): void {
    // Add new student
    this.snackBar.open('Agregar nuevo estudiante - En desarrollo', 'Cerrar', { duration: 3000 });
  }

  refreshData(): void {
    this.loadInitialData();
  }
}