import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, User } from '../../core/services/auth';
import { Observable } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit {
  currentUser$: Observable<User | null>;
  expandedGroups = new Set<string>();
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
      roles: ['admin', 'preceptor']
    },
    {
      label: 'Gestión de Usuarios',
      icon: 'group',
      roles: ['admin'],
      children: [
        {
          label: 'Todos los Usuarios',
          icon: 'people',
          route: '/admin/users',
          roles: ['admin']
        },
        {
          label: 'Roles y Permisos',
          icon: 'security',
          route: '/admin/users/roles',
          roles: ['admin']
        }
      ]
    },
    {
      label: 'Gestión Académica',
      icon: 'school',
      roles: ['admin', 'preceptor'],
      children: [
        {
          label: 'Cursos y Divisiones',
          icon: 'class',
          route: '/admin/academic',
          roles: ['admin', 'preceptor']
        },
        {
          label: 'Materias',
          icon: 'book',
          route: '/admin/academic/subjects',
          roles: ['admin', 'preceptor']
        },
        {
          label: 'Horarios',
          icon: 'schedule',
          route: '/admin/academic/schedules',
          roles: ['admin', 'preceptor']
        },
        {
          label: 'Asignaciones',
          icon: 'assignment',
          route: '/admin/academic/assignments',
          roles: ['admin', 'preceptor']
        }
      ]
    },
    {
      label: 'Sistema Biométrico',
      icon: 'fingerprint',
      roles: ['admin', 'preceptor'],
      children: [
        {
          label: 'Dispositivos',
          icon: 'devices',
          route: '/admin/devices',
          roles: ['admin']
        },
        {
          label: 'Huellas Dactilares',
          icon: 'touch_app',
          route: '/admin/biometric/fingerprints',
          roles: ['admin', 'preceptor']
        },
        {
          label: 'Registros de Fichaje',
          icon: 'access_time',
          route: '/admin/biometric/records',
          roles: ['admin', 'preceptor']
        }
      ]
    },
    {
      label: 'Reportes',
      icon: 'analytics',
      roles: ['admin', 'preceptor', 'profesor'],
      children: [
        {
          label: 'Asistencia',
          icon: 'fact_check',
          route: '/admin/reports/attendance',
          roles: ['admin', 'preceptor', 'profesor']
        },
        {
          label: 'Profesores',
          icon: 'person_outline',
          route: '/admin/reports/teachers',
          roles: ['admin', 'preceptor']
        },
        {
          label: 'Estadísticas',
          icon: 'bar_chart',
          route: '/admin/reports/statistics',
          roles: ['admin', 'preceptor']
        }
      ]
    },
    {
      label: 'Configuración',
      icon: 'settings',
      roles: ['admin'],
      children: [
        {
          label: 'Sistema',
          icon: 'tune',
          route: '/admin/settings/system',
          roles: ['admin']
        },
        {
          label: 'Logs del Sistema',
          icon: 'bug_report',
          route: '/admin/settings/logs',
          roles: ['admin']
        }
      ]
    }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  hasPermission(requiredRoles: string[]): boolean {
    return this.authService.hasAnyRole(requiredRoles);
  }

  getFilteredMenuItems(): MenuItem[] {
    return this.menuItems.filter(item => this.hasPermission(item.roles));
  }

  getFilteredChildren(children: MenuItem[] | undefined): MenuItem[] {
    if (!children) return [];
    return children.filter(child => this.hasPermission(child.roles));
  }

  toggleGroup(groupLabel: string): void {
    if (this.expandedGroups.has(groupLabel)) {
      this.expandedGroups.delete(groupLabel);
    } else {
      this.expandedGroups.add(groupLabel);
    }
  }
}
