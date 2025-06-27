import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-professor-students',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="professor-students">
      <div class="page-header">
        <h1>Mis Estudiantes</h1>
        <p>Gestiona la información de tus estudiantes</p>
      </div>
      
      <mat-card>
        <mat-card-content>
          <div class="empty-state">
            <mat-icon>people</mat-icon>
            <h2>Portal de Estudiantes</h2>
            <p>Esta sección está en desarrollo</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .professor-students {
      padding: 20px;
    }
    .page-header {
      margin-bottom: 20px;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
    }
    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  `]
})
export class StudentsComponent {
  constructor() {}
}