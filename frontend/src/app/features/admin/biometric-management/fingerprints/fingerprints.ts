import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BiometricService } from '../../../../core/services/biometric';
import { UserService } from '../../../../core/services/user';

@Component({
  selector: 'app-fingerprints',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatTabsModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Gestión de Huellas Dactilares</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openEnrollDialog()">
            <mat-icon>fingerprint</mat-icon>
            Registrar Huella
          </button>
          <button mat-raised-button color="accent" (click)="refreshData()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <mat-tab-group>
          <!-- Tab de Huellas Registradas -->
          <mat-tab label="Huellas Registradas">
            <!-- Search form -->
            <form [formGroup]="searchForm" class="search-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar usuario</mat-label>
                <input matInput formControlName="search" placeholder="Nombre, apellido o DNI">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado de huella</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="">Todas</mat-option>
                  <mat-option value="true">Activas</mat-option>
                  <mat-option value="false">Inactivas</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Calidad mínima</mat-label>
                <mat-select formControlName="calidadMinima">
                  <mat-option value="">Todas</mat-option>
                  <mat-option value="90">Excelente (90+)</mat-option>
                  <mat-option value="70">Buena (70+)</mat-option>
                  <mat-option value="50">Regular (50+)</mat-option>
                </mat-select>
              </mat-form-field>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoadingFingerprints" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Fingerprints table -->
            <table mat-table [dataSource]="huellas" class="fingerprints-table" *ngIf="!isLoadingFingerprints">
              
              <!-- User Column -->
              <ng-container matColumnDef="usuario">
                <th mat-header-cell *matHeaderCellDef> Usuario </th>
                <td mat-cell *matCellDef="let huella"> 
                  <div class="user-info">
                    <div class="user-name">{{ huella.Usuario?.nombre }} {{ huella.Usuario?.apellido }}</div>
                    <div class="user-dni">DNI: {{ huella.Usuario?.dni }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef> Email </th>
                <td mat-cell *matCellDef="let huella"> {{ huella.Usuario?.email || 'Sin email' }} </td>
              </ng-container>

              <!-- Quality Column -->
              <ng-container matColumnDef="calidad">
                <th mat-header-cell *matHeaderCellDef> Calidad </th>
                <td mat-cell *matCellDef="let huella">
                  <div class="quality-indicator">
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="huella.calidad"
                      [color]="getQualityColor(huella.calidad)">
                    </mat-progress-bar>
                    <span class="quality-text">{{ huella.calidad }}%</span>
                  </div>
                </td>
              </ng-container>

              <!-- Registration Date Column -->
              <ng-container matColumnDef="fechaRegistro">
                <th mat-header-cell *matHeaderCellDef> Fecha Registro </th>
                <td mat-cell *matCellDef="let huella"> 
                  {{ (huella.fecha_registro | date:'dd/MM/yyyy HH:mm') || 'Sin fecha' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="activo">
                <th mat-header-cell *matHeaderCellDef> Estado </th>
                <td mat-cell *matCellDef="let huella">
                  <mat-chip [color]="huella.activo ? 'primary' : 'warn'">
                    {{ huella.activo ? 'Activa' : 'Inactiva' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let huella">
                  <button mat-icon-button [matMenuTriggerFor]="fingerprintMenu" aria-label="Más acciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #fingerprintMenu="matMenu">
                    <button mat-menu-item (click)="verifyFingerprint(huella)">
                      <mat-icon>verified_user</mat-icon>
                      <span>Verificar Huella</span>
                    </button>
                    <button mat-menu-item (click)="viewHistory(huella)">
                      <mat-icon>history</mat-icon>
                      <span>Ver Historial</span>
                    </button>
                    <button mat-menu-item (click)="reEnrollFingerprint(huella)">
                      <mat-icon>refresh</mat-icon>
                      <span>Re-registrar</span>
                    </button>
                    <button mat-menu-item (click)="toggleFingerprintStatus(huella)">
                      <mat-icon>{{ huella.activo ? 'block' : 'check_circle' }}</mat-icon>
                      <span>{{ huella.activo ? 'Desactivar' : 'Activar' }}</span>
                    </button>
                    <button mat-menu-item (click)="deleteFingerprint(huella)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Eliminar</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="fingerprintColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: fingerprintColumns;"></tr>
            </table>

            <!-- No fingerprints message -->
            <div *ngIf="!isLoadingFingerprints && huellas.length === 0" class="no-data">
              <mat-icon>fingerprint</mat-icon>
              <p>No se encontraron huellas registradas</p>
              <button mat-raised-button color="primary" (click)="openEnrollDialog()">
                <mat-icon>add</mat-icon>
                Registrar Primera Huella
              </button>
            </div>
          </mat-tab>

          <!-- Tab de Usuarios sin Huella -->
          <mat-tab label="Usuarios sin Huella">
            <!-- Search form for users -->
            <form [formGroup]="userSearchForm" class="search-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar usuario</mat-label>
                <input matInput formControlName="search" placeholder="Nombre, apellido o DNI">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Filtrar por rol</mat-label>
                <mat-select formControlName="rol">
                  <mat-option value="">Todos los roles</mat-option>
                  <mat-option value="alumno">Alumnos</mat-option>
                  <mat-option value="profesor">Profesores</mat-option>
                  <mat-option value="admin">Administradores</mat-option>
                </mat-select>
              </mat-form-field>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoadingUsers" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Users without fingerprints table -->
            <table mat-table [dataSource]="usuariosSinHuella" class="users-table" *ngIf="!isLoadingUsers">
              
              <!-- User Column -->
              <ng-container matColumnDef="usuario">
                <th mat-header-cell *matHeaderCellDef> Usuario </th>
                <td mat-cell *matCellDef="let usuario"> 
                  <div class="user-info">
                    <div class="user-name">{{ usuario.nombre }} {{ usuario.apellido }}</div>
                    <div class="user-dni">DNI: {{ usuario.dni }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef> Email </th>
                <td mat-cell *matCellDef="let usuario"> {{ usuario.email }} </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="rol">
                <th mat-header-cell *matHeaderCellDef> Rol </th>
                <td mat-cell *matCellDef="let usuario">
                  <mat-chip *ngFor="let rol of usuario.roles" [color]="getRoleColor(rol.nombre)">
                    {{ rol.nombre }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Registration Date Column -->
              <ng-container matColumnDef="fechaCreacion">
                <th mat-header-cell *matHeaderCellDef> Fecha Creación </th>
                <td mat-cell *matCellDef="let usuario"> 
                  {{ (usuario.createdAt | date:'dd/MM/yyyy') || 'Sin fecha' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actionsUser">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let usuario">
                  <button mat-raised-button color="primary" (click)="enrollUserFingerprint(usuario)">
                    <mat-icon>fingerprint</mat-icon>
                    Registrar Huella
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
            </table>

            <!-- No users message -->
            <div *ngIf="!isLoadingUsers && usuariosSinHuella.length === 0" class="no-data">
              <mat-icon>check_circle</mat-icon>
              <p>Todos los usuarios tienen huellas registradas</p>
            </div>
          </mat-tab>

          <!-- Tab de Estadísticas -->
          <mat-tab label="Estadísticas">
            <div class="stats-container">
              <div class="stats-grid">
                <div class="stat-card">
                  <mat-icon>fingerprint</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ totalHuellas }}</div>
                    <div class="stat-label">Total Huellas</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>people</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ usuariosSinHuella.length }}</div>
                    <div class="stat-label">Sin Huella</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>verified_user</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ huellasActivas }}</div>
                    <div class="stat-label">Huellas Activas</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>star</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ Math.round(calidadPromedio) }}%</div>
                    <div class="stat-label">Calidad Promedio</div>
                  </div>
                </div>
              </div>

              <div class="quality-distribution">
                <h3>Distribución de Calidad</h3>
                <div class="quality-bars">
                  <div class="quality-bar">
                    <span class="quality-range">90-100% (Excelente)</span>
                    <mat-progress-bar mode="determinate" [value]="getQualityPercentage('excellent')" color="primary"></mat-progress-bar>
                    <span class="quality-count">{{ getQualityCount('excellent') }} huellas</span>
                  </div>
                  <div class="quality-bar">
                    <span class="quality-range">70-89% (Buena)</span>
                    <mat-progress-bar mode="determinate" [value]="getQualityPercentage('good')" color="accent"></mat-progress-bar>
                    <span class="quality-count">{{ getQualityCount('good') }} huellas</span>
                  </div>
                  <div class="quality-bar">
                    <span class="quality-range">50-69% (Regular)</span>
                    <mat-progress-bar mode="determinate" [value]="getQualityPercentage('fair')" color="warn"></mat-progress-bar>
                    <span class="quality-count">{{ getQualityCount('fair') }} huellas</span>
                  </div>
                  <div class="quality-bar">
                    <span class="quality-range">0-49% (Mala)</span>
                    <mat-progress-bar mode="determinate" [value]="getQualityPercentage('poor')" color="warn"></mat-progress-bar>
                    <span class="quality-count">{{ getQualityCount('poor') }} huellas</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
    .search-form {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .search-form mat-form-field {
      min-width: 200px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .fingerprints-table, .users-table {
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
    .no-data button {
      margin-top: 16px;
    }
    .user-info {
      line-height: 1.2;
    }
    .user-name {
      font-weight: 500;
    }
    .user-dni {
      font-size: 12px;
      color: rgba(0,0,0,0.6);
    }
    .quality-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }
    .quality-indicator mat-progress-bar {
      flex: 1;
      height: 8px;
    }
    .quality-text {
      font-size: 12px;
      font-weight: 500;
      min-width: 35px;
    }
    .delete-action {
      color: #f44336;
    }
    .stats-container {
      padding: 20px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      gap: 16px;
    }
    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }
    .stat-content {
      flex: 1;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }
    .stat-label {
      font-size: 14px;
      color: rgba(0,0,0,0.6);
    }
    .quality-distribution h3 {
      margin-bottom: 20px;
      color: rgba(0,0,0,0.87);
    }
    .quality-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .quality-bar {
      display: grid;
      grid-template-columns: 150px 1fr 100px;
      align-items: center;
      gap: 16px;
    }
    .quality-range {
      font-size: 14px;
      font-weight: 500;
    }
    .quality-count {
      font-size: 12px;
      color: rgba(0,0,0,0.6);
      text-align: right;
    }
  `]
})
export class FingerprintsComponent implements OnInit {
  Math = Math;
  huellas: any[] = [];
  usuariosSinHuella: any[] = [];
  dispositivos: any[] = [];
  fingerprintColumns: string[] = ['usuario', 'email', 'calidad', 'fechaRegistro', 'activo', 'actions'];
  userColumns: string[] = ['usuario', 'email', 'rol', 'fechaCreacion', 'actionsUser'];
  isLoadingFingerprints = true;
  isLoadingUsers = true;
  searchForm: FormGroup;
  userSearchForm: FormGroup;

  // Statistics
  totalHuellas = 0;
  huellasActivas = 0;
  calidadPromedio = 0;

  constructor(
    private fb: FormBuilder,
    private biometricService: BiometricService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      estado: [''],
      calidadMinima: ['']
    });

    this.userSearchForm = this.fb.group({
      search: [''],
      rol: ['']
    });
  }

  ngOnInit(): void {
    this.loadFingerprints();
    this.loadUsersWithoutFingerprints();
    this.loadDevices();
    
    this.searchForm.valueChanges.subscribe(() => {
      this.filterFingerprints();
    });

    this.userSearchForm.valueChanges.subscribe(() => {
      this.filterUsers();
    });
  }

  loadFingerprints(): void {
    this.isLoadingFingerprints = true;
    this.biometricService.getHuellas().subscribe({
      next: (response: any) => {
        this.huellas = Array.isArray(response) ? response : (response.data || []);
        this.calculateStatistics();
        this.isLoadingFingerprints = false;
      },
      error: (error: any) => {
        console.error('Error loading fingerprints:', error);
        this.snackBar.open('Error al cargar huellas', 'Cerrar', { duration: 5000 });
        this.isLoadingFingerprints = false;
      }
    });
  }

  loadUsersWithoutFingerprints(): void {
    this.isLoadingUsers = true;
    // TODO: Implement API endpoint to get users without fingerprints
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        const allUsers = Array.isArray(response) ? response : (response.data || []);
        // Filter users that don't have fingerprints
        this.usuariosSinHuella = allUsers.filter((user: any) => 
          !this.huellas.some(huella => huella.usuario_id === user.id)
        );
        this.isLoadingUsers = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 5000 });
        this.isLoadingUsers = false;
      }
    });
  }

  loadDevices(): void {
    this.biometricService.getDispositivos().subscribe({
      next: (response: any) => {
        this.dispositivos = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error: any) => {
        console.error('Error loading devices:', error);
      }
    });
  }

  calculateStatistics(): void {
    this.totalHuellas = this.huellas.length;
    this.huellasActivas = this.huellas.filter(h => h.activo).length;
    this.calidadPromedio = this.huellas.length > 0 ? 
      this.huellas.reduce((sum, h) => sum + h.calidad, 0) / this.huellas.length : 0;
  }

  filterFingerprints(): void {
    const { search, estado, calidadMinima } = this.searchForm.value;
    
    this.biometricService.getHuellas().subscribe({
      next: (response: any) => {
        let filteredFingerprints = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredFingerprints = filteredFingerprints.filter((huella: any) => 
            (huella.Usuario?.nombre && huella.Usuario.nombre.toLowerCase().includes(searchLower)) ||
            (huella.Usuario?.apellido && huella.Usuario.apellido.toLowerCase().includes(searchLower)) ||
            (huella.Usuario?.dni && huella.Usuario.dni.includes(search))
          );
        }

        if (estado !== '') {
          filteredFingerprints = filteredFingerprints.filter((huella: any) => 
            huella.activo === (estado === 'true')
          );
        }

        if (calidadMinima) {
          filteredFingerprints = filteredFingerprints.filter((huella: any) => 
            huella.calidad >= Number(calidadMinima)
          );
        }
        
        this.huellas = filteredFingerprints;
        this.calculateStatistics();
      }
    });
  }

  filterUsers(): void {
    const { search, rol } = this.userSearchForm.value;
    
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        let allUsers = Array.isArray(response) ? response : (response.data || []);
        
        // Filter users that don't have fingerprints
        let filteredUsers = allUsers.filter((user: any) => 
          !this.huellas.some(huella => huella.usuario_id === user.id)
        );
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = filteredUsers.filter((user: any) => 
            user.nombre.toLowerCase().includes(searchLower) ||
            user.apellido.toLowerCase().includes(searchLower) ||
            user.dni.includes(search) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }

        if (rol) {
          filteredUsers = filteredUsers.filter((user: any) => 
            user.roles?.some((userRole: any) => userRole.nombre === rol)
          );
        }
        
        this.usuariosSinHuella = filteredUsers;
      }
    });
  }

  getQualityColor(quality: number): string {
    if (quality >= 90) return 'primary';
    if (quality >= 70) return 'accent';
    if (quality >= 50) return 'warn';
    return 'warn';
  }

  getRoleColor(roleName: string): string {
    switch(roleName) {
      case 'admin': return 'primary';
      case 'profesor': return 'accent';
      case 'alumno': return 'basic';
      default: return 'basic';
    }
  }

  getQualityCount(range: string): number {
    switch(range) {
      case 'excellent': return this.huellas.filter(h => h.calidad >= 90).length;
      case 'good': return this.huellas.filter(h => h.calidad >= 70 && h.calidad < 90).length;
      case 'fair': return this.huellas.filter(h => h.calidad >= 50 && h.calidad < 70).length;
      case 'poor': return this.huellas.filter(h => h.calidad < 50).length;
      default: return 0;
    }
  }

  getQualityPercentage(range: string): number {
    const count = this.getQualityCount(range);
    return this.totalHuellas > 0 ? (count / this.totalHuellas) * 100 : 0;
  }

  openEnrollDialog(): void {
    const dialogData = {
      title: 'Registrar Nueva Huella',
      usuarios: this.usuariosSinHuella,
      dispositivos: this.dispositivos
    };
    
    // TODO: Implement dialog component
    this.snackBar.open('Registrar Huella - Próximamente', 'Cerrar', { duration: 3000 });
  }

  enrollUserFingerprint(usuario: any): void {
    if (this.dispositivos.length === 0) {
      this.snackBar.open('No hay dispositivos disponibles para el registro', 'Cerrar', { duration: 5000 });
      return;
    }

    const dialogData = {
      title: `Registrar Huella - ${usuario.nombre} ${usuario.apellido}`,
      usuario: usuario,
      dispositivos: this.dispositivos.filter(d => d.estado === 'online' && d.activo)
    };
    
    // TODO: Implement enrollment dialog
    this.snackBar.open(`Registrar huella para ${usuario.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  verifyFingerprint(huella: any): void {
    this.snackBar.open(`Verificar huella de ${huella.Usuario?.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  reEnrollFingerprint(huella: any): void {
    if (confirm(`¿Está seguro de re-registrar la huella de ${huella.Usuario?.nombre} ${huella.Usuario?.apellido}?`)) {
      this.snackBar.open(`Re-registrar huella - Próximamente`, 'Cerrar', { duration: 3000 });
    }
  }

  toggleFingerprintStatus(huella: any): void {
    const newStatus = !huella.activo;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (confirm(`¿Está seguro de ${action} la huella de ${huella.Usuario?.nombre} ${huella.Usuario?.apellido}?`)) {
      this.biometricService.updateHuella(huella.id, { activo: newStatus }).subscribe({
        next: () => {
          this.snackBar.open(`Huella ${action}da exitosamente`, 'Cerrar', { duration: 3000 });
          this.loadFingerprints();
        },
        error: (error) => {
          console.error('Error updating fingerprint:', error);
          this.snackBar.open(`Error al ${action} huella`, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  deleteFingerprint(huella: any): void {
    if (confirm(`¿Está seguro de eliminar la huella de ${huella.Usuario?.nombre} ${huella.Usuario?.apellido}? Esta acción no se puede deshacer.`)) {
      this.biometricService.deleteHuella(huella.id).subscribe({
        next: () => {
          this.snackBar.open('Huella eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadFingerprints();
          this.loadUsersWithoutFingerprints();
        },
        error: (error) => {
          console.error('Error deleting fingerprint:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar huella', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  viewHistory(huella: any): void {
    this.snackBar.open(`Ver historial de ${huella.Usuario?.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
    // TODO: Navigate to records filtered by this user
  }

  refreshData(): void {
    this.loadFingerprints();
    this.loadUsersWithoutFingerprints();
    this.loadDevices();
    this.snackBar.open('Datos actualizados', 'Cerrar', { duration: 2000 });
  }
}