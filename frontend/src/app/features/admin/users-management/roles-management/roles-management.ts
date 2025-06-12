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
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RoleService } from '../../../../core/services/role';

@Component({
  selector: 'app-roles-management',
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
    MatChipsModule,
    MatMenuModule,
    MatCheckboxModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Roles y Permisos</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openRoleDialog()">
            <mat-icon>add</mat-icon>
            Nuevo Rol
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Search form -->
        <form [formGroup]="searchForm" class="search-form">
          <mat-form-field appearance="outline">
            <mat-label>Buscar rol</mat-label>
            <input matInput formControlName="search" placeholder="Nombre o descripción">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </form>

        <!-- Loading spinner -->
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner></mat-spinner>
        </div>

        <!-- Roles table -->
        <table mat-table [dataSource]="roles" class="roles-table" *ngIf="!isLoading">
          
          <!-- Name Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre </th>
            <td mat-cell *matCellDef="let role"> {{ role.nombre }} </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="descripcion">
            <th mat-header-cell *matHeaderCellDef> Descripción </th>
            <td mat-cell *matCellDef="let role"> {{ role.descripcion || 'Sin descripción' }} </td>
          </ng-container>

          <!-- Permissions Column -->
          <ng-container matColumnDef="permisos">
            <th mat-header-cell *matHeaderCellDef> Permisos </th>
            <td mat-cell *matCellDef="let role">
              <mat-chip-set>
                <mat-chip *ngFor="let permission of getPermissions(role)" color="primary">
                  {{ permission }}
                </mat-chip>
              </mat-chip-set>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="activo">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let role">
              <mat-chip [color]="role.activo ? 'primary' : 'warn'">
                {{ role.activo ? 'Activo' : 'Inactivo' }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let role">
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Más acciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="openRoleDialog(role)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <button mat-menu-item (click)="viewUsersWithRole(role)" [disabled]="role.nombre === 'admin'">
                  <mat-icon>people</mat-icon>
                  <span>Ver Usuarios</span>
                </button>
                <button mat-menu-item (click)="deleteRole(role)" [disabled]="role.nombre === 'admin'">
                  <mat-icon>delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- No roles message -->
        <div *ngIf="!isLoading && roles.length === 0" class="no-data">
          <mat-icon>security</mat-icon>
          <p>No se encontraron roles</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
    }
    .search-form {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .search-form mat-form-field {
      min-width: 300px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .roles-table {
      width: 100%;
      margin-top: 20px;
    }
    .no-data {
      text-align: center;
      padding: 40px;
      color: rgba(0,0,0,0.6);
    }
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    mat-chip-set {
      max-width: 300px;
    }
  `]
})
export class RolesManagementComponent implements OnInit {
  roles: any[] = [];
  displayedColumns: string[] = ['nombre', 'descripcion', 'permisos', 'activo', 'actions'];
  isLoading = true;
  searchForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    
    this.searchForm.valueChanges.subscribe(() => {
      this.filterRoles();
    });
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (response: any) => {
        this.roles = Array.isArray(response) ? response : (response.data || []);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading roles:', error);
        this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  filterRoles(): void {
    const { search } = this.searchForm.value;
    
    this.roleService.getRoles().subscribe({
      next: (response: any) => {
        let filteredRoles = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredRoles = filteredRoles.filter((role: any) => 
            role.nombre.toLowerCase().includes(searchLower) ||
            (role.descripcion && role.descripcion.toLowerCase().includes(searchLower))
          );
        }
        
        this.roles = filteredRoles;
      }
    });
  }

  openRoleDialog(role?: any): void {
    this.snackBar.open('Funcionalidad de diálogo en desarrollo', 'Cerrar', { duration: 3000 });
  }

  deleteRole(role: any): void {
    if (confirm(`¿Está seguro de eliminar el rol ${role.nombre}?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.snackBar.open('Rol eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadRoles();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar rol', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  viewUsersWithRole(role: any): void {
    this.roleService.getUsersWithRole(role.id).subscribe({
      next: (users) => {
        const userNames = users.map(u => `${u.nombre} ${u.apellido}`).join(', ');
        this.snackBar.open(`Usuarios con rol ${role.nombre}: ${userNames || 'Ninguno'}`, 'Cerrar', { duration: 5000 });
      },
      error: (error) => {
        console.error('Error loading users with role:', error);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 5000 });
      }
    });
  }

  getPermissions(role: any): string[] {
    return role.permisos || [];
  }
}