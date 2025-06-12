import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user';
import { UserDialogComponent } from './user-dialog/user-dialog';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './users-management.html',
  styleUrl: './users-management.scss'
})
export class UsersManagementComponent implements OnInit {
  users: any[] = [];
  displayedColumns: string[] = ['dni', 'nombre', 'email', 'roles', 'activo', 'actions'];
  isLoading = true;
  searchForm: FormGroup;
  
  roles = [
    { value: 'admin', viewValue: 'Administrador' },
    { value: 'preceptor', viewValue: 'Preceptor' },
    { value: 'profesor', viewValue: 'Profesor' },
    { value: 'alumno', viewValue: 'Alumno' },
    { value: 'padre', viewValue: 'Padre' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      role: ['']
    });
  }

  ngOnInit(): void {
    // Check for role query parameter
    this.route.queryParams.subscribe(params => {
      if (params['role']) {
        this.searchForm.patchValue({ role: params['role'] });
      }
    });
    
    this.loadUsers();
    
    // Listen to search changes
    this.searchForm.valueChanges.subscribe(() => {
      this.filterUsers();
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        // Handle both array response and {data: array} response
        this.users = Array.isArray(response) ? response : (response.data || []);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  filterUsers(): void {
    const { search, role } = this.searchForm.value;
    
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        // Handle both array response and {data: array} response
        let filteredUsers = Array.isArray(response) ? response : (response.data || []);
        
        // Filter by search term
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = filteredUsers.filter((user: any) => 
            user.nombre.toLowerCase().includes(searchLower) ||
            user.apellido.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.dni.toLowerCase().includes(searchLower)
          );
        }
        
        // Filter by role
        if (role) {
          filteredUsers = filteredUsers.filter((user: any) => 
            user.Rols?.some((r: any) => r.nombre === role)
          );
        }
        
        this.users = filteredUsers;
      }
    });
  }

  openUserDialog(user?: any): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        user: user,
        isEdit: !!user
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recargar la lista de usuarios después de crear/editar
        this.loadUsers();
      }
    });
  }

  createUser(userData: any): void {
    this.userService.createUser(userData).subscribe({
      next: () => {
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.snackBar.open(error.error?.message || 'Error al crear usuario', 'Cerrar', { duration: 5000 });
      }
    });
  }

  updateUser(userId: number, userData: any): void {
    this.userService.updateUser(userId, userData).subscribe({
      next: () => {
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.snackBar.open(error.error?.message || 'Error al actualizar usuario', 'Cerrar', { duration: 5000 });
      }
    });
  }

  deleteUser(user: any): void {
    if (confirm(`¿Está seguro de eliminar al usuario ${user.nombre} ${user.apellido}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar usuario', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  getUserRoles(user: any): string[] {
    return user.Rols?.map((r: any) => r.nombre) || [];
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'admin': 'primary',
      'preceptor': 'accent',
      'profesor': 'warn',
      'alumno': '',
      'padre': ''
    };
    return colors[role] || '';
  }

  getRoleClass(role: string): string {
    const classes: { [key: string]: string } = {
      'admin': 'admin',
      'preceptor': 'preceptor',
      'profesor': 'profesor',
      'alumno': 'alumno',
      'padre': 'padre'
    };
    return classes[role] || 'alumno';
  }

  viewStudentDetail(user: any): void {
    if (this.getUserRoles(user).includes('alumno')) {
      this.router.navigate(['/admin/student', user.id], {
        queryParams: { 
          returnTo: 'users'
        }
      });
    }
  }

  viewProfessorDetail(user: any): void {
    if (this.getUserRoles(user).includes('profesor')) {
      this.router.navigate(['/admin/professor', user.id], {
        queryParams: { 
          returnTo: 'users'
        }
      });
    }
  }
}