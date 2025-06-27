import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-parent-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="parent-settings">
      <div class="settings-header">
        <h1>Configuración</h1>
        <p>Administra tus preferencias y configuración del portal</p>
      </div>

      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Configuración del Portal de Padres
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Esta sección estará disponible próximamente.</p>
          <p>Aquí podrás configurar:</p>
          <ul>
            <li>Notificaciones</li>
            <li>Preferencias de comunicación</li>
            <li>Configuración de perfil</li>
            <li>Privacidad y seguridad</li>
          </ul>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary">
            <mat-icon>save</mat-icon>
            Guardar Cambios
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrl: './settings.scss'
})
export class ParentSettingsComponent {
  constructor() {}
}