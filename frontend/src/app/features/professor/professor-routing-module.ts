import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfessorLayoutComponent } from './professor-layout/professor-layout';

const routes: Routes = [
  {
    path: '',
    component: ProfessorLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.ProfessorDashboardComponent)
      },
      {
        path: 'classes',
        loadComponent: () => import('./classes/classes').then(m => m.ClassesComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./attendance/attendance').then(m => m.AttendanceComponent)
      },
      {
        path: 'grades',
        loadComponent: () => import('./grades/grades').then(m => m.GradesComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./students/students').then(m => m.StudentsComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./schedule/schedule').then(m => m.ScheduleComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfessorRoutingModule { }
