import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BiometricService } from '../../../../core/services/biometric';
import { UserService } from '../../../../core/services/user';
import { DeviceService } from '../../../../core/services/device';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatTabsModule,
    MatPaginatorModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Registros de Fichaje</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="accent" (click)="openManualRecordDialog()">
            <mat-icon>add</mat-icon>
            Registro Manual
          </button>
          <button mat-raised-button color="primary" (click)="exportRecords()">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <mat-tab-group>
          <!-- Tab de Registros -->
          <mat-tab label="Registros de Fichaje">
            <!-- Filters form -->
            <form [formGroup]="filterForm" class="filter-form">
              <mat-form-field appearance="outline">
                <mat-label>Buscar usuario</mat-label>
                <input matInput formControlName="search" placeholder="Nombre, apellido o DNI">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha inicio</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="fechaInicio">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha fin</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="fechaFin">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de registro</mat-label>
                <mat-select formControlName="tipoRegistro">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="entrada">Entrada</mat-option>
                  <mat-option value="salida">Salida</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Dispositivo</mat-label>
                <mat-select formControlName="dispositivoId">
                  <mat-option value="">Todos</mat-option>
                  <mat-option *ngFor="let dispositivo of dispositivos" [value]="dispositivo.id">
                    {{ dispositivo.nombre }} - {{ dispositivo.ubicacion }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-raised-button color="primary" (click)="applyFilters()">
                <mat-icon>filter_list</mat-icon>
                Aplicar Filtros
              </button>

              <button mat-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </form>

            <!-- Loading spinner -->
            <div *ngIf="isLoading" class="loading-container">
              <mat-spinner></mat-spinner>
            </div>

            <!-- Records table -->
            <table mat-table [dataSource]="registros" class="records-table" *ngIf="!isLoading">
              
              <!-- Date Time Column -->
              <ng-container matColumnDef="fechaHora">
                <th mat-header-cell *matHeaderCellDef> Fecha y Hora </th>
                <td mat-cell *matCellDef="let registro"> 
                  {{ registro.fecha_hora | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>
              </ng-container>

              <!-- User Column -->
              <ng-container matColumnDef="usuario">
                <th mat-header-cell *matHeaderCellDef> Usuario </th>
                <td mat-cell *matCellDef="let registro"> 
                  <div class="user-info">
                    <div class="user-name">
                      {{ registro.Usuario?.nombre }} {{ registro.Usuario?.apellido }}
                    </div>
                    <div class="user-dni">DNI: {{ registro.Usuario?.dni }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="tipoRegistro">
                <th mat-header-cell *matHeaderCellDef> Tipo </th>
                <td mat-cell *matCellDef="let registro">
                  <mat-chip [color]="registro.tipo_registro === 'entrada' ? 'primary' : 'accent'">
                    <mat-icon class="chip-icon">{{ registro.tipo_registro === 'entrada' ? 'login' : 'logout' }}</mat-icon>
                    {{ registro.tipo_registro === 'entrada' ? 'Entrada' : 'Salida' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Device Column -->
              <ng-container matColumnDef="dispositivo">
                <th mat-header-cell *matHeaderCellDef> Dispositivo </th>
                <td mat-cell *matCellDef="let registro">
                  <div class="device-info">
                    <div>{{ registro.DispositivoFichaje?.nombre || 'Sin dispositivo' }}</div>
                    <div class="device-location">{{ registro.DispositivoFichaje?.ubicacion }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Verified Column -->
              <ng-container matColumnDef="verificado">
                <th mat-header-cell *matHeaderCellDef> Estado </th>
                <td mat-cell *matCellDef="let registro">
                  <mat-chip [color]="registro.verificado ? 'primary' : 'warn'">
                    <mat-icon class="chip-icon">{{ registro.verificado ? 'verified' : 'warning' }}</mat-icon>
                    {{ registro.verificado ? 'Verificado' : 'Sin verificar' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Acciones </th>
                <td mat-cell *matCellDef="let registro">
                  <button mat-icon-button [matMenuTriggerFor]="recordMenu" aria-label="Más acciones">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #recordMenu="matMenu">
                    <button mat-menu-item (click)="viewRecordDetails(registro)">
                      <mat-icon>info</mat-icon>
                      <span>Ver Detalles</span>
                    </button>
                    <button mat-menu-item (click)="editRecord(registro)" *ngIf="!registro.verificado">
                      <mat-icon>edit</mat-icon>
                      <span>Editar</span>
                    </button>
                    <button mat-menu-item (click)="verifyRecord(registro)" *ngIf="!registro.verificado">
                      <mat-icon>verified_user</mat-icon>
                      <span>Verificar</span>
                    </button>
                    <button mat-menu-item (click)="deleteRecord(registro)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Eliminar</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Paginator -->
            <mat-paginator 
              [length]="totalRecords"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)"
              *ngIf="!isLoading">
            </mat-paginator>

            <!-- No records message -->
            <div *ngIf="!isLoading && registros.length === 0" class="no-data">
              <mat-icon>history</mat-icon>
              <p>No se encontraron registros</p>
            </div>
          </mat-tab>

          <!-- Tab de Resumen del Día -->
          <mat-tab label="Resumen del Día">
            <div class="daily-summary">
              <div class="summary-header">
                <h3>Resumen de Fichajes - {{ today | date:'dd/MM/yyyy' }}</h3>
                <button mat-button color="primary" (click)="refreshSummary()">
                  <mat-icon>refresh</mat-icon>
                  Actualizar
                </button>
              </div>

              <div class="summary-stats">
                <div class="stat-card">
                  <mat-icon>people</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ todaySummary.totalUsuarios }}</div>
                    <div class="stat-label">Usuarios Presentes</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>login</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ todaySummary.entradas }}</div>
                    <div class="stat-label">Entradas</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>logout</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ todaySummary.salidas }}</div>
                    <div class="stat-label">Salidas</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>warning</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ todaySummary.sinSalida }}</div>
                    <div class="stat-label">Sin Salida</div>
                  </div>
                </div>
              </div>

              <!-- Active users table -->
              <h4>Usuarios Actualmente en el Establecimiento</h4>
              <table mat-table [dataSource]="usuariosActivos" class="active-users-table">
                
                <!-- User Column -->
                <ng-container matColumnDef="usuario">
                  <th mat-header-cell *matHeaderCellDef> Usuario </th>
                  <td mat-cell *matCellDef="let usuario"> 
                    {{ usuario.nombre }} {{ usuario.apellido }}
                  </td>
                </ng-container>

                <!-- Role Column -->
                <ng-container matColumnDef="rol">
                  <th mat-header-cell *matHeaderCellDef> Rol </th>
                  <td mat-cell *matCellDef="let usuario">
                    <mat-chip *ngFor="let rol of usuario.roles">
                      {{ rol.nombre }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Entry Time Column -->
                <ng-container matColumnDef="horaEntrada">
                  <th mat-header-cell *matHeaderCellDef> Hora Entrada </th>
                  <td mat-cell *matCellDef="let usuario"> 
                    {{ usuario.ultimaEntrada | date:'HH:mm:ss' }}
                  </td>
                </ng-container>

                <!-- Duration Column -->
                <ng-container matColumnDef="duracion">
                  <th mat-header-cell *matHeaderCellDef> Tiempo en Establecimiento </th>
                  <td mat-cell *matCellDef="let usuario"> 
                    {{ calculateDuration(usuario.ultimaEntrada) }}
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="activeUsersColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: activeUsersColumns;"></tr>
              </table>
            </div>
          </mat-tab>

          <!-- Tab de Estadísticas -->
          <mat-tab label="Estadísticas">
            <div class="statistics-container">
              <!-- Period selector -->
              <div class="period-selector">
                <mat-form-field appearance="outline">
                  <mat-label>Período</mat-label>
                  <mat-select [(value)]="statsPeriod" (selectionChange)="loadStatistics()">
                    <mat-option value="today">Hoy</mat-option>
                    <mat-option value="week">Esta Semana</mat-option>
                    <mat-option value="month">Este Mes</mat-option>
                    <mat-option value="custom">Personalizado</mat-option>
                  </mat-select>
                </mat-form-field>

                <div *ngIf="statsPeriod === 'custom'" class="custom-period">
                  <mat-form-field appearance="outline">
                    <mat-label>Desde</mat-label>
                    <input matInput [matDatepicker]="statStartPicker" [(ngModel)]="statsStartDate">
                    <mat-datepicker-toggle matSuffix [for]="statStartPicker"></mat-datepicker-toggle>
                    <mat-datepicker #statStartPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Hasta</mat-label>
                    <input matInput [matDatepicker]="statEndPicker" [(ngModel)]="statsEndDate">
                    <mat-datepicker-toggle matSuffix [for]="statEndPicker"></mat-datepicker-toggle>
                    <mat-datepicker #statEndPicker></mat-datepicker>
                  </mat-form-field>

                  <button mat-raised-button color="primary" (click)="loadStatistics()">
                    Aplicar
                  </button>
                </div>
              </div>

              <!-- Statistics cards -->
              <div class="stats-grid">
                <div class="stat-card">
                  <mat-icon>history</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.totalRegistros }}</div>
                    <div class="stat-label">Total Registros</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>people</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.usuariosUnicos }}</div>
                    <div class="stat-label">Usuarios Únicos</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>schedule</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.promedioEntrada }}</div>
                    <div class="stat-label">Hora Promedio Entrada</div>
                  </div>
                </div>

                <div class="stat-card">
                  <mat-icon>timer</mat-icon>
                  <div class="stat-content">
                    <div class="stat-number">{{ statistics.tiempoPromedio }}</div>
                    <div class="stat-label">Tiempo Promedio</div>
                  </div>
                </div>
              </div>

              <!-- Charts placeholder -->
              <div class="charts-container">
                <div class="chart-card">
                  <h4>Distribución por Hora del Día</h4>
                  <div class="chart-placeholder">
                    <mat-icon>bar_chart</mat-icon>
                    <p>Gráfico disponible próximamente</p>
                  </div>
                </div>

                <div class="chart-card">
                  <h4>Asistencia por Día de la Semana</h4>
                  <div class="chart-placeholder">
                    <mat-icon>show_chart</mat-icon>
                    <p>Gráfico disponible próximamente</p>
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
    .filter-form {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      margin-top: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    .filter-form mat-form-field {
      min-width: 180px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .records-table {
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
    .device-info {
      line-height: 1.2;
    }
    .device-location {
      font-size: 12px;
      color: rgba(0,0,0,0.6);
    }
    .chip-icon {
      margin-right: 4px !important;
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }
    .delete-action {
      color: #f44336;
    }
    .daily-summary {
      padding: 20px 0;
    }
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .summary-stats {
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
    .active-users-table {
      width: 100%;
      margin-top: 20px;
    }
    h4 {
      margin: 20px 0 10px 0;
      color: rgba(0,0,0,0.87);
    }
    .statistics-container {
      padding: 20px 0;
    }
    .period-selector {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 20px;
    }
    .custom-period {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }
    .chart-card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
    }
    .chart-card h4 {
      margin: 0 0 16px 0;
    }
    .chart-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(0,0,0,0.4);
    }
    .chart-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }
  `]
})
export class RecordsComponent implements OnInit {
  registros: any[] = [];
  dispositivos: any[] = [];
  usuariosActivos: any[] = [];
  displayedColumns: string[] = ['fechaHora', 'usuario', 'tipoRegistro', 'dispositivo', 'verificado', 'actions'];
  activeUsersColumns: string[] = ['usuario', 'rol', 'horaEntrada', 'duracion'];
  isLoading = true;
  filterForm: FormGroup;
  
  // Pagination
  totalRecords = 0;
  pageSize = 25;
  
  // Daily summary
  today = new Date();
  todaySummary = {
    totalUsuarios: 0,
    entradas: 0,
    salidas: 0,
    sinSalida: 0
  };
  
  // Statistics
  statsPeriod = 'today';
  statsStartDate = new Date();
  statsEndDate = new Date();
  statistics = {
    totalRegistros: 0,
    usuariosUnicos: 0,
    promedioEntrada: '00:00',
    tiempoPromedio: '0h 0m'
  };

  constructor(
    private fb: FormBuilder,
    private biometricService: BiometricService,
    private userService: UserService,
    private deviceService: DeviceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    this.filterForm = this.fb.group({
      search: [''],
      fechaInicio: [oneWeekAgo],
      fechaFin: [today],
      tipoRegistro: [''],
      dispositivoId: ['']
    });
  }

  ngOnInit(): void {
    this.loadRecords();
    this.loadDevices();
    this.loadDailySummary();
    this.loadStatistics();
  }

  loadRecords(): void {
    this.isLoading = true;
    this.biometricService.getRegistros().subscribe({
      next: (response: any) => {
        this.registros = Array.isArray(response) ? response : (response.data || []);
        this.totalRecords = response.total || this.registros.length;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading records:', error);
        this.snackBar.open('Error al cargar registros', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  loadDevices(): void {
    this.deviceService.getDevices().subscribe({
      next: (response: any) => {
        this.dispositivos = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error: any) => {
        console.error('Error loading devices:', error);
      }
    });
  }

  loadDailySummary(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.biometricService.getRegistrosByFecha(
      today.toISOString(),
      tomorrow.toISOString()
    ).subscribe({
      next: (response: any) => {
        const todayRecords = Array.isArray(response) ? response : (response.data || []);
        this.calculateDailySummary(todayRecords);
        this.findActiveUsers(todayRecords);
      }
    });
  }

  calculateDailySummary(records: any[]): void {
    const userMap = new Map();
    
    records.forEach(record => {
      const userId = record.usuario_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, { entradas: [], salidas: [] });
      }
      
      if (record.tipo_registro === 'entrada') {
        userMap.get(userId).entradas.push(record);
      } else {
        userMap.get(userId).salidas.push(record);
      }
    });
    
    this.todaySummary = {
      totalUsuarios: userMap.size,
      entradas: records.filter(r => r.tipo_registro === 'entrada').length,
      salidas: records.filter(r => r.tipo_registro === 'salida').length,
      sinSalida: 0
    };
    
    // Count users without exit
    userMap.forEach(userRecords => {
      if (userRecords.entradas.length > userRecords.salidas.length) {
        this.todaySummary.sinSalida++;
      }
    });
  }

  findActiveUsers(records: any[]): void {
    const userMap = new Map();
    
    // Group records by user
    records.forEach(record => {
      const userId = record.usuario_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          usuario: record.Usuario,
          registros: []
        });
      }
      userMap.get(userId).registros.push(record);
    });
    
    // Find users still in the building
    this.usuariosActivos = [];
    userMap.forEach(userData => {
      const registros = userData.registros.sort((a: any, b: any) => 
        new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
      );
      
      if (registros[0].tipo_registro === 'entrada') {
        this.usuariosActivos.push({
          ...userData.usuario,
          ultimaEntrada: registros[0].fecha_hora
        });
      }
    });
  }

  calculateDuration(entryTime: string): string {
    const entry = new Date(entryTime);
    const now = new Date();
    const diff = now.getTime() - entry.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Convert dates to ISO string format
    const startDate = filters.fechaInicio ? new Date(filters.fechaInicio).toISOString() : '';
    const endDate = filters.fechaFin ? new Date(filters.fechaFin).toISOString() : '';
    
    this.biometricService.getRegistrosByFecha(startDate, endDate).subscribe({
      next: (response: any) => {
        let filteredRecords = Array.isArray(response) ? response : (response.data || []);
        
        // Apply additional filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredRecords = filteredRecords.filter((registro: any) => 
            (registro.Usuario?.nombre && registro.Usuario.nombre.toLowerCase().includes(searchLower)) ||
            (registro.Usuario?.apellido && registro.Usuario.apellido.toLowerCase().includes(searchLower)) ||
            (registro.Usuario?.dni && registro.Usuario.dni.includes(filters.search))
          );
        }
        
        if (filters.tipoRegistro) {
          filteredRecords = filteredRecords.filter((registro: any) => 
            registro.tipo_registro === filters.tipoRegistro
          );
        }
        
        if (filters.dispositivoId) {
          filteredRecords = filteredRecords.filter((registro: any) => 
            registro.dispositivo_fichaje_id === Number(filters.dispositivoId)
          );
        }
        
        this.registros = filteredRecords;
        this.totalRecords = filteredRecords.length;
      }
    });
  }

  clearFilters(): void {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    this.filterForm.reset({
      search: '',
      fechaInicio: oneWeekAgo,
      fechaFin: today,
      tipoRegistro: '',
      dispositivoId: ''
    });
    
    this.loadRecords();
  }

  loadStatistics(): void {
    // TODO: Implement statistics loading based on selected period
    this.statistics = {
      totalRegistros: this.registros.length,
      usuariosUnicos: new Set(this.registros.map(r => r.usuario_id)).size,
      promedioEntrada: '08:30',
      tiempoPromedio: '8h 15m'
    };
  }

  onPageChange(event: any): void {
    // TODO: Implement server-side pagination
    console.log('Page changed:', event);
  }

  openManualRecordDialog(): void {
    // TODO: Implement manual record dialog
    this.snackBar.open('Registro manual - Próximamente', 'Cerrar', { duration: 3000 });
  }

  exportRecords(): void {
    // TODO: Implement export functionality
    this.snackBar.open('Exportar registros - Próximamente', 'Cerrar', { duration: 3000 });
  }

  viewRecordDetails(registro: any): void {
    // TODO: Implement record details dialog
    this.snackBar.open(`Detalles del registro - ${registro.Usuario?.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  editRecord(registro: any): void {
    // TODO: Implement edit record dialog
    this.snackBar.open('Editar registro - Próximamente', 'Cerrar', { duration: 3000 });
  }

  verifyRecord(registro: any): void {
    if (confirm('¿Está seguro de verificar este registro?')) {
      this.biometricService.updateRegistro(registro.id, { verificado: true }).subscribe({
        next: () => {
          this.snackBar.open('Registro verificado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadRecords();
        },
        error: (error) => {
          console.error('Error verifying record:', error);
          this.snackBar.open('Error al verificar registro', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  deleteRecord(registro: any): void {
    if (confirm(`¿Está seguro de eliminar este registro de ${registro.Usuario?.nombre} ${registro.Usuario?.apellido}?`)) {
      this.biometricService.deleteRegistro(registro.id).subscribe({
        next: () => {
          this.snackBar.open('Registro eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadRecords();
          this.loadDailySummary();
        },
        error: (error) => {
          console.error('Error deleting record:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar registro', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  refreshSummary(): void {
    this.loadDailySummary();
    this.snackBar.open('Resumen actualizado', 'Cerrar', { duration: 2000 });
  }
}