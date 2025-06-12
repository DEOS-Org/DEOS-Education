import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, shareReplay } from 'rxjs';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent implements OnInit {
  isHandset$: Observable<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {}
}
