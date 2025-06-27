import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell';
import { RoleSelectorComponent } from '../../../shared/components/role-selector/role-selector';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-preceptor-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    NotificationBellComponent,
    RoleSelectorComponent
  ],
  templateUrl: './preceptor-layout.html',
  styleUrl: './preceptor-layout.scss'
})
export class PreceptorLayoutComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  menuItems = [
    {
      path: '/preceptor/dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      description: 'Vista general y estadísticas'
    },
    {
      path: '/preceptor/attendance',
      icon: 'how_to_reg',
      label: 'Asistencia',
      description: 'Gestión de asistencia diaria'
    },
    {
      path: '/preceptor/students',
      icon: 'school',
      label: 'Estudiantes',
      description: 'Gestión de estudiantes'
    },
    {
      path: '/preceptor/divisions',
      icon: 'class',
      label: 'Divisiones',
      description: 'Gestión de divisiones'
    },
    {
      path: '/preceptor/reports',
      icon: 'assessment',
      label: 'Reportes',
      description: 'Reportes de asistencia'
    },
    {
      path: '/preceptor/alerts',
      icon: 'warning',
      label: 'Alertas',
      description: 'Alertas y notificaciones'
    },
    {
      path: '/preceptor/comunicados',
      icon: 'campaign',
      label: 'Comunicados',
      description: 'Gestionar comunicados'
    },
    {
      path: '/preceptor/mensajeria',
      icon: 'chat',
      label: 'Mensajería',
      description: 'Sistema de mensajes'
    },
    {
      path: '/preceptor/sanciones',
      icon: 'gavel',
      label: 'Sanciones',
      description: 'Gestionar sanciones'
    }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'P';
    
    const firstName = this.currentUser.nombre || '';
    const lastName = this.currentUser.apellido || '';
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'P';
  }

  getUserFullName(): string {
    if (!this.currentUser) return 'Preceptor';
    
    return `${this.currentUser.nombre || ''} ${this.currentUser.apellido || ''}`.trim();
  }
}