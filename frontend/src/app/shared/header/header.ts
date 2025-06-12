import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService, User } from '../../core/services/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  @Input() drawer!: MatSidenav;
  
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleDrawer(): void {
    this.drawer.toggle();
  }

  logout(): void {
    this.authService.logout();
  }

  getUserDisplayName(user: User | null): string {
    if (!user) return '';
    return `${user.nombre} ${user.apellido}`;
  }

  getPrimaryRole(user: User | null): string {
    if (!user || !user.roles.length) return '';
    
    // Priority order for roles
    const rolePriority = ['admin', 'preceptor', 'profesor', 'alumno', 'padre'];
    
    for (const role of rolePriority) {
      if (user.roles.includes(role)) {
        return this.getRoleDisplayName(role);
      }
    }
    
    return user.roles[0];
  }

  private getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': 'Administrador',
      'preceptor': 'Preceptor',
      'profesor': 'Profesor',
      'alumno': 'Alumno',
      'padre': 'Padre'
    };
    return roleNames[role] || role;
  }
}
