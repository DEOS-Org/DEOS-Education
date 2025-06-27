import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-professor-mensajeria',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="mensajeria-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>message</mat-icon>
            Mensajería - Profesor
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Sistema de mensajería en desarrollo.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mensajeria-container { padding: 20px; }
    mat-card-title { display: flex; align-items: center; gap: 8px; }
  `]
})
export class ProfessorMensajeriaComponent {
}