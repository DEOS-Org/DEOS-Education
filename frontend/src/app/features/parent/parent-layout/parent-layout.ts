import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, shareReplay } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { RoleSelectorComponent } from '../../../shared/components/role-selector/role-selector';

@Component({
  selector: 'app-parent-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    RoleSelectorComponent
  ],
  templateUrl: './parent-layout.html',
  styleUrl: './parent-layout.scss'
})
export class ParentLayoutComponent implements OnInit {
  currentUser: any = null;
  isHandset$!: Observable<boolean>;

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
    this.currentUser = this.authService.getCurrentUser();
  }

  showHelp(): void {
    console.log('Mostrando ayuda');
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
    if (!this.currentUser) return 'Padre/Madre';
    
    return `${this.currentUser.nombre || ''} ${this.currentUser.apellido || ''}`.trim();
  }
}