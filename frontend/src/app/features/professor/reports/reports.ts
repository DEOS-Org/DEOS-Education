import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-professor-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="professor-reports">
      <div class="page-header">
        <h1>Reportes</h1>
        <button mat-raised-button color="primary">
          <mat-icon>description</mat-icon>
          Generar Reporte
        </button>
      </div>
      <mat-card>
        <mat-card-content>
          <div class="empty-state">
            <mat-icon>assessment</mat-icon>
            <h2>Generación de Reportes</h2>
            <p>Esta sección está en desarrollo</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .professor-reports { 
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
export class ReportsComponent {}