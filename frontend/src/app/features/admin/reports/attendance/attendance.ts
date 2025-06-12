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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReportService } from '../../../../core/services/report';
import { AcademicService } from '../../../../core/services/academic';
import { UserService } from '../../../../core/services/user';

@Component({
  selector: 'app-attendance-reports',
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
    MatProgressBarModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Reportes de Asistencia</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="generateReport()" [disabled]="isGenerating">
            <mat-icon>assessment</mat-icon>
            {{ isGenerating ? 'Generando...' : 'Generar Reporte' }}
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <mat-tab-group>
          <!-- Tab de Configuración de Reporte -->
          <mat-tab label="Configurar Reporte">
            <div class="report-config">
              <form [formGroup]="reportForm" class="config-form">
                <div class="form-section">
                  <h3>Período del Reporte</h3>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de período</mat-label>
                      <mat-select formControlName="periodType" (selectionChange)="onPeriodTypeChange()">
                        <mat-option value="daily">Diario</mat-option>
                        <mat-option value="weekly">Semanal</mat-option>
                        <mat-option value="monthly">Mensual</mat-option>
                        <mat-option value="custom">Personalizado</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" *ngIf="reportForm.get('periodType')?.value === 'custom'">
                      <mat-label>Fecha inicio</mat-label>
                      <input matInput [matDatepicker]="startPicker" formControlName="fechaInicio">
                      <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                      <mat-datepicker #startPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline" *ngIf="reportForm.get('periodType')?.value === 'custom'">
                      <mat-label>Fecha fin</mat-label>
                      <input matInput [matDatepicker]="endPicker" formControlName="fechaFin">
                      <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                      <mat-datepicker #endPicker></mat-datepicker>
                    </mat-form-field>
                  </div>
                </div>

                <div class="form-section">
                  <h3>Filtros</h3>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo de usuario</mat-label>
                      <mat-select formControlName="userType" (selectionChange)="onUserTypeChange()">
                        <mat-option value="all">Todos</mat-option>
                        <mat-option value="alumno">Alumnos</mat-option>
                        <mat-option value="profesor">Profesores</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Curso</mat-label>
                      <mat-select formControlName="cursoId">
                        <mat-option value="">Todos los cursos</mat-option>
                        <mat-option *ngFor="let curso of cursos" [value]="curso.id">
                          {{ curso.nombre }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" *ngIf="reportForm.get('cursoId')?.value">
                      <mat-label>División</mat-label>
                      <mat-select formControlName="divisionId">
                        <mat-option value="">Todas las divisiones</mat-option>
                        <mat-option *ngFor="let division of divisiones" [value]="division.id">
                          {{ division.nombre }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="form-section">
                  <h3>Opciones del Reporte</h3>
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        Columnas a incluir
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    <div class="columns-selection">
                      <mat-checkbox [(ngModel)]="includeColumns.dni" [ngModelOptions]="{standalone: true}">DNI</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.nombre" [ngModelOptions]="{standalone: true}">Nombre Completo</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.curso" [ngModelOptions]="{standalone: true}">Curso/División</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.entradas" [ngModelOptions]="{standalone: true}">Total Entradas</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.salidas" [ngModelOptions]="{standalone: true}">Total Salidas</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.horasTotal" [ngModelOptions]="{standalone: true}">Horas Totales</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.porcentaje" [ngModelOptions]="{standalone: true}">% Asistencia</mat-checkbox>
                      <mat-checkbox [(ngModel)]="includeColumns.detallesDiarios" [ngModelOptions]="{standalone: true}">Detalle Diario</mat-checkbox>
                    </div>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        Formato de salida
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Formato</mat-label>
                      <mat-select formControlName="outputFormat">
                        <mat-option value="pdf">PDF</mat-option>
                        <mat-option value="excel">Excel</mat-option>
                        <mat-option value="csv">CSV</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </mat-expansion-panel>
                </div>
              </form>
            </div>
          </mat-tab>

          <!-- Tab de Vista Previa -->
          <mat-tab label="Vista Previa">
            <div class="preview-container">
              <!-- Loading spinner -->
              <div *ngIf="isLoading" class="loading-container">
                <mat-spinner></mat-spinner>
                <p>Cargando datos...</p>
              </div>

              <!-- Preview table -->
              <div *ngIf="!isLoading && previewData.length > 0" class="preview-content">
                <div class="preview-header">
                  <h3>Vista Previa del Reporte</h3>
                  <div class="preview-info">
                    <span>Período: {{ getReportPeriodText() }}</span>
                    <span>Total registros: {{ previewData.length }}</span>
                  </div>
                </div>

                <table mat-table [dataSource]="previewData" class="preview-table">
                  <!-- DNI Column -->
                  <ng-container matColumnDef="dni">
                    <th mat-header-cell *matHeaderCellDef> DNI </th>
                    <td mat-cell *matCellDef="let row"> {{ row.dni }} </td>
                  </ng-container>

                  <!-- Name Column -->
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef> Nombre </th>
                    <td mat-cell *matCellDef="let row"> {{ row.nombre }} {{ row.apellido }} </td>
                  </ng-container>

                  <!-- Course Column -->
                  <ng-container matColumnDef="curso">
                    <th mat-header-cell *matHeaderCellDef> Curso/División </th>
                    <td mat-cell *matCellDef="let row"> {{ row.curso || 'N/A' }} </td>
                  </ng-container>

                  <!-- Attendance Percentage Column -->
                  <ng-container matColumnDef="porcentajeAsistencia">
                    <th mat-header-cell *matHeaderCellDef> % Asistencia </th>
                    <td mat-cell *matCellDef="let row">
                      <div class="percentage-cell">
                        <span [class.low-attendance]="row.porcentajeAsistencia < 75">
                          {{ row.porcentajeAsistencia }}%
                        </span>
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="row.porcentajeAsistencia"
                          [color]="row.porcentajeAsistencia >= 75 ? 'primary' : 'warn'">
                        </mat-progress-bar>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Total Days Column -->
                  <ng-container matColumnDef="diasPresente">
                    <th mat-header-cell *matHeaderCellDef> Días Presente </th>
                    <td mat-cell *matCellDef="let row"> {{ row.diasPresente }} / {{ row.diasTotal }} </td>
                  </ng-container>

                  <!-- Total Hours Column -->
                  <ng-container matColumnDef="horasTotales">
                    <th mat-header-cell *matHeaderCellDef> Horas Totales </th>
                    <td mat-cell *matCellDef="let row"> {{ row.horasTotales }} </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef> Acciones </th>
                    <td mat-cell *matCellDef="let row">
                      <button mat-icon-button [matMenuTriggerFor]="previewMenu" aria-label="Más acciones">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #previewMenu="matMenu">
                        <button mat-menu-item (click)="viewDetails(row)">
                          <mat-icon>visibility</mat-icon>
                          <span>Ver Detalles</span>
                        </button>
                        <button mat-menu-item (click)="viewHistory(row)">
                          <mat-icon>history</mat-icon>
                          <span>Ver Historial</span>
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="previewColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: previewColumns;"></tr>
                </table>
              </div>

              <!-- No data message -->
              <div *ngIf="!isLoading && previewData.length === 0" class="no-data">
                <mat-icon>description</mat-icon>
                <p>Configure los parámetros del reporte y haga clic en "Generar Reporte"</p>
              </div>
            </div>
          </mat-tab>

          <!-- Tab de Reportes Guardados -->
          <mat-tab label="Reportes Guardados">
            <div class="saved-reports">
              <div class="saved-reports-header">
                <h3>Reportes Generados Anteriormente</h3>
                <button mat-button color="primary" (click)="refreshSavedReports()">
                  <mat-icon>refresh</mat-icon>
                  Actualizar
                </button>
              </div>

              <!-- Loading spinner -->
              <div *ngIf="isLoadingSaved" class="loading-container">
                <mat-spinner></mat-spinner>
              </div>

              <!-- Saved reports table -->
              <table mat-table [dataSource]="savedReports" class="saved-table" *ngIf="!isLoadingSaved">
                <!-- Date Column -->
                <ng-container matColumnDef="fecha">
                  <th mat-header-cell *matHeaderCellDef> Fecha Generación </th>
                  <td mat-cell *matCellDef="let report"> 
                    {{ report.fechaGeneracion | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                </ng-container>

                <!-- Type Column -->
                <ng-container matColumnDef="tipo">
                  <th mat-header-cell *matHeaderCellDef> Tipo </th>
                  <td mat-cell *matCellDef="let report"> 
                    <mat-chip>{{ report.tipo }}</mat-chip>
                  </td>
                </ng-container>

                <!-- Period Column -->
                <ng-container matColumnDef="periodo">
                  <th mat-header-cell *matHeaderCellDef> Período </th>
                  <td mat-cell *matCellDef="let report"> {{ report.periodo }} </td>
                </ng-container>

                <!-- Format Column -->
                <ng-container matColumnDef="formato">
                  <th mat-header-cell *matHeaderCellDef> Formato </th>
                  <td mat-cell *matCellDef="let report">
                    <mat-icon [color]="getFormatColor(report.formato)">
                      {{ getFormatIcon(report.formato) }}
                    </mat-icon>
                    {{ report.formato.toUpperCase() }}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="savedActions">
                  <th mat-header-cell *matHeaderCellDef> Acciones </th>
                  <td mat-cell *matCellDef="let report">
                    <button mat-icon-button (click)="downloadReport(report)" matTooltip="Descargar">
                      <mat-icon>download</mat-icon>
                    </button>
                    <button mat-icon-button (click)="deleteReport(report)" matTooltip="Eliminar">
                      <mat-icon color="warn">delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="savedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: savedColumns;"></tr>
              </table>

              <!-- No saved reports message -->
              <div *ngIf="!isLoadingSaved && savedReports.length === 0" class="no-data">
                <mat-icon>folder_open</mat-icon>
                <p>No hay reportes guardados</p>
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
    }
    .report-config {
      padding: 20px 0;
    }
    .config-form {
      max-width: 1000px;
    }
    .form-section {
      margin-bottom: 30px;
    }
    .form-section h3 {
      margin-bottom: 16px;
      color: rgba(0,0,0,0.87);
    }
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .form-row mat-form-field {
      min-width: 200px;
      flex: 1;
    }
    .columns-selection {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      padding: 16px;
    }
    .full-width {
      width: 100%;
    }
    .preview-container {
      padding: 20px 0;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    .loading-container p {
      margin-top: 16px;
      color: rgba(0,0,0,0.6);
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .preview-info {
      display: flex;
      gap: 20px;
      color: rgba(0,0,0,0.6);
    }
    .preview-table, .saved-table {
      width: 100%;
    }
    .percentage-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .percentage-cell mat-progress-bar {
      flex: 1;
      max-width: 100px;
    }
    .low-attendance {
      color: #f44336;
      font-weight: 500;
    }
    .no-data {
      text-align: center;
      padding: 60px;
      color: rgba(0,0,0,0.4);
    }
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .saved-reports {
      padding: 20px 0;
    }
    .saved-reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    mat-expansion-panel {
      margin-top: 16px;
    }
  `]
})
export class AttendanceReportsComponent implements OnInit {
  reportForm: FormGroup;
  previewData: any[] = [];
  savedReports: any[] = [];
  cursos: any[] = [];
  divisiones: any[] = [];
  
  isLoading = false;
  isLoadingSaved = false;
  isGenerating = false;
  
  previewColumns = ['dni', 'nombre', 'curso', 'porcentajeAsistencia', 'diasPresente', 'horasTotales', 'actions'];
  savedColumns = ['fecha', 'tipo', 'periodo', 'formato', 'savedActions'];
  
  includeColumns = {
    dni: true,
    nombre: true,
    curso: true,
    entradas: true,
    salidas: true,
    horasTotal: true,
    porcentaje: true,
    detallesDiarios: false
  };

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private academicService: AcademicService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    this.reportForm = this.fb.group({
      periodType: ['monthly'],
      fechaInicio: [lastMonth],
      fechaFin: [today],
      userType: ['all'],
      cursoId: [''],
      divisionId: [''],
      outputFormat: ['pdf']
    });
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadSavedReports();
  }

  loadCourses(): void {
    this.academicService.getCursos().subscribe({
      next: (response: any) => {
        this.cursos = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  loadDivisions(): void {
    const cursoId = this.reportForm.get('cursoId')?.value;
    if (cursoId) {
      this.academicService.getDivisionesByCurso(cursoId).subscribe({
        next: (response: any) => {
          this.divisiones = Array.isArray(response) ? response : (response.data || []);
        },
        error: (error: any) => {
          console.error('Error loading divisions:', error);
        }
      });
    }
  }

  loadSavedReports(): void {
    this.isLoadingSaved = true;
    // TODO: Implement saved reports loading
    setTimeout(() => {
      this.savedReports = [
        {
          id: 1,
          fechaGeneracion: new Date(),
          tipo: 'Asistencia Mensual',
          periodo: 'Noviembre 2024',
          formato: 'pdf',
          archivo: 'asistencia_nov_2024.pdf'
        },
        {
          id: 2,
          fechaGeneracion: new Date(2024, 9, 30),
          tipo: 'Asistencia Semanal',
          periodo: '23-29 Oct 2024',
          formato: 'excel',
          archivo: 'asistencia_sem_43_2024.xlsx'
        }
      ];
      this.isLoadingSaved = false;
    }, 1000);
  }

  onPeriodTypeChange(): void {
    const periodType = this.reportForm.get('periodType')?.value;
    const today = new Date();
    
    switch(periodType) {
      case 'daily':
        this.reportForm.patchValue({
          fechaInicio: today,
          fechaFin: today
        });
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        this.reportForm.patchValue({
          fechaInicio: weekStart,
          fechaFin: today
        });
        break;
      case 'monthly':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        this.reportForm.patchValue({
          fechaInicio: monthStart,
          fechaFin: today
        });
        break;
    }
  }

  onUserTypeChange(): void {
    // Reset course and division when user type changes
    this.reportForm.patchValue({
      cursoId: '',
      divisionId: ''
    });
  }

  getReportPeriodText(): string {
    const { periodType, fechaInicio, fechaFin } = this.reportForm.value;
    
    if (periodType === 'custom') {
      return `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;
    }
    
    return periodType === 'daily' ? fechaInicio.toLocaleDateString() : 
           periodType === 'weekly' ? `Semana del ${fechaInicio.toLocaleDateString()}` :
           `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`;
  }

  generateReport(): void {
    this.isGenerating = true;
    this.isLoading = true;
    
    const reportParams = {
      ...this.reportForm.value,
      includeColumns: this.includeColumns
    };
    
    this.reportService.generateAttendanceReport(reportParams).subscribe({
      next: (response: any) => {
        this.previewData = response.preview || [];
        this.isGenerating = false;
        this.isLoading = false;
        
        if (reportParams.outputFormat !== 'preview') {
          this.snackBar.open('Reporte generado exitosamente', 'Cerrar', { duration: 3000 });
          // TODO: Handle file download
        }
      },
      error: (error: any) => {
        console.error('Error generating report:', error);
        this.snackBar.open('Error al generar reporte', 'Cerrar', { duration: 5000 });
        this.isGenerating = false;
        this.isLoading = false;
      }
    });
  }

  viewDetails(row: any): void {
    this.snackBar.open(`Ver detalles de ${row.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  viewHistory(row: any): void {
    this.snackBar.open(`Ver historial de ${row.nombre} - Próximamente`, 'Cerrar', { duration: 3000 });
  }

  refreshSavedReports(): void {
    this.loadSavedReports();
  }

  getFormatIcon(format: string): string {
    switch(format) {
      case 'pdf': return 'picture_as_pdf';
      case 'excel': return 'table_chart';
      case 'csv': return 'description';
      default: return 'insert_drive_file';
    }
  }

  getFormatColor(format: string): string {
    switch(format) {
      case 'pdf': return 'warn';
      case 'excel': return 'primary';
      case 'csv': return 'accent';
      default: return '';
    }
  }

  downloadReport(report: any): void {
    this.snackBar.open(`Descargando ${report.archivo}...`, 'Cerrar', { duration: 3000 });
    // TODO: Implement download
  }

  deleteReport(report: any): void {
    if (confirm(`¿Está seguro de eliminar el reporte ${report.archivo}?`)) {
      // TODO: Implement delete
      this.snackBar.open('Reporte eliminado', 'Cerrar', { duration: 3000 });
      this.loadSavedReports();
    }
  }
}