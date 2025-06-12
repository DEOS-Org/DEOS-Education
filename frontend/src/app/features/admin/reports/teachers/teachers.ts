import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-teachers-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Reportes de Profesores</mat-card-title>
        <div class="header-actions">
          <button mat-raised-button color="primary">
            <mat-icon>assessment</mat-icon>
            Generar Reporte
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <p>Esta funcionalidad está en desarrollo.</p>
        <p>Aquí podrás generar reportes de actividad y asistencia de profesores.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-actions {
      margin-left: auto;
    }
    mat-card-content {
      padding: 20px;
    }
  `]
})
export class TeachersReportsComponent {
}