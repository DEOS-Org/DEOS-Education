import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreceptorLayoutComponent } from './preceptor-layout/preceptor-layout';

const routes: Routes = [
  {
    path: '',
    component: PreceptorLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.PreceptorDashboardComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./attendance/attendance').then(m => m.PreceptorAttendanceComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./students/students').then(m => m.PreceptorStudentsComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./alerts/alerts').then(m => m.PreceptorAlertsComponent)
      },
      {
        path: 'mensajeria',
        loadComponent: () => import('./mensajeria/mensajeria').then(m => m.PreceptorMensajeriaComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PreceptorRoutingModule { }
