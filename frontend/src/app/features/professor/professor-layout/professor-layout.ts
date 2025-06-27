import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, shareReplay } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { RoleSelectorComponent } from '../../../shared/components/role-selector/role-selector';

@Component({
  selector: 'app-professor-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    RoleSelectorComponent
  ],
  templateUrl: './professor-layout.html',
  styleUrl: './professor-layout.scss'
})
export class ProfessorLayoutComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isHandset$!: Observable<boolean>;
  
  menuItems = [
    {
      path: '/professor/dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      description: 'Vista general y estadísticas'
    },
    {
      path: '/professor/classes',
      icon: 'school',
      label: 'Mis Clases',
      description: 'Gestión de clases'
    },
    {
      path: '/professor/attendance',
      icon: 'fact_check',
      label: 'Asistencia',
      description: 'Control de asistencia'
    },
    {
      path: '/professor/grades',
      icon: 'grade',
      label: 'Calificaciones',
      description: 'Gestión de notas'
    },
    {
      path: '/professor/students',
      icon: 'people',
      label: 'Estudiantes',
      description: 'Lista de estudiantes'
    },
    {
      path: '/professor/schedule',
      icon: 'schedule',
      label: 'Horario',
      description: 'Mi horario de clases'
    },
    {
      path: '/professor/reports',
      icon: 'assessment',
      label: 'Reportes',
      description: 'Reportes académicos'
    },
    {
      path: '/professor/settings',
      icon: 'settings',
      label: 'Configuración',
      description: 'Configuración personal'
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
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
    if (!this.currentUser) return 'Profesor';
    
    return `${this.currentUser.nombre || ''} ${this.currentUser.apellido || ''}`.trim();
  }
}