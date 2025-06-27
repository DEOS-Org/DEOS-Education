import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-professor-attendance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="professor-attendance">
      <div class="page-header">
        <h1>Control de Asistencia</h1>
        <p>Registra y gestiona la asistencia de tus estudiantes</p>
      </div>
      <mat-card>
        <mat-card-content>
          <div class="empty-state">
            <mat-icon>fact_check</mat-icon>
            <h2>Control de Asistencia</h2>
            <p>Esta sección está en desarrollo</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .professor-attendance { padding: 20px; }
    .page-header { margin-bottom: 20px; }
    .empty-state { text-align: center; padding: 40px; }
    .empty-state mat-icon { font-size: 64px; height: 64px; width: 64px; margin-bottom: 16px; opacity: 0.5; }
  `]
})
export class AttendanceComponent {}