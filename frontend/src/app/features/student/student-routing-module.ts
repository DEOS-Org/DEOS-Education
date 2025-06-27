import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentLayoutComponent } from './student-layout/student-layout';

const routes: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./schedule/schedule').then(m => m.ScheduleComponent)
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
        path: 'subjects',
        loadComponent: () => import('./subjects/subjects').then(m => m.SubjectsComponent)
      },
      {
        path: 'assignments',
        loadComponent: () => import('./assignments/assignments').then(m => m.AssignmentsComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./calendar/calendar').then(m => m.CalendarComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent)
      },
      {
        path: 'comunicados',
        loadComponent: () => import('./comunicados/comunicados').then(m => m.ComunicadosComponent)
      },
      {
        path: 'mensajeria',
        loadComponent: () => import('./mensajeria/mensajeria').then(m => m.MensajeriaComponent)
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
export class StudentRoutingModule { }
