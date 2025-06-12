import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
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
        path: 'users',
        loadComponent: () => import('./users-management/users-management').then(m => m.UsersManagementComponent)
      },
      {
        path: 'academic',
        loadComponent: () => import('./academic-management/academic-management').then(m => m.AcademicManagementComponent)
      },
      {
        path: 'academic/course-division/:id',
        loadComponent: () => import('./academic-management/course-division-details/course-division-details').then(m => m.CourseDivisionDetailsComponent)
      },
      {
        path: 'academic/division/:id',
        loadComponent: () => import('./academic-management/division-detail/division-detail').then(m => m.DivisionDetailComponent)
      },
      {
        path: 'academic/division/:id/attendance/:fecha',
        loadComponent: () => import('./daily-attendance-detail/daily-attendance-detail').then(m => m.DailyAttendanceDetailComponent)
      },
      {
        path: 'professor/:id',
        loadComponent: () => import('./professor-detail/professor-detail').then(m => m.ProfessorDetailComponent)
      },
      {
        path: 'student/:id',
        loadComponent: () => import('./student-detail/student-detail').then(m => m.StudentDetailComponent)
      },
      {
        path: 'devices',
        loadComponent: () => import('./devices-management/devices-management').then(m => m.DevicesManagementComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
