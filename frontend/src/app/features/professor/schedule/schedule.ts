import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-professor-schedule',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="professor-schedule">
      <div class="page-header">
        <h1>Horarios</h1>
        <button mat-raised-button color="primary">
          <mat-icon>event</mat-icon>
          Ver Calendario
        </button>
      </div>
      <mat-card>
        <mat-card-content>
          <div class="empty-state">
            <mat-icon>schedule</mat-icon>
            <h2>Gestión de Horarios</h2>
            <p>Esta sección está en desarrollo</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .professor-schedule { 
      padding: 20px; 
    }
    .page-header { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    mat-card {
      margin-bottom: 24px;
    }
    .empty-state { 
      text-align: center; 
      padding: 48px 24px;
      color: #666;
    }
    .empty-state mat-icon { 
      font-size: 72px; 
      width: 72px;
      height: 72px;
      color: #ccc;
      margin-bottom: 16px;
    }
    .empty-state h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 500;
    }
    .empty-state p {
      margin: 0;
      color: #999;
    }
  `]
})
export class ScheduleComponent {}