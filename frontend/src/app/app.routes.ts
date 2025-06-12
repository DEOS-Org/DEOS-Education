import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      // Users management routes
      {
        path: 'users',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/users-management/users-management').then(m => m.UsersManagementComponent)
          },
          {
            path: 'roles',
            loadComponent: () => import('./features/admin/users-management/roles-management/roles-management').then(m => m.RolesManagementComponent)
          }
        ]
      },
      // Student detail
      {
        path: 'student/:id',
        loadComponent: () => import('./features/admin/student-detail/student-detail').then(m => m.StudentDetailComponent)
      },
      // Professor detail
      {
        path: 'professor/:id',
        loadComponent: () => import('./features/admin/professor-detail/professor-detail').then(m => m.ProfessorDetailComponent)
      },
      // Academic management routes
      {
        path: 'academic',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/academic-management/academic-management').then(m => m.AcademicManagementComponent)
          },
          {
            path: 'division/:id',
            loadComponent: () => import('./features/admin/academic-management/division-detail/division-detail').then(m => m.DivisionDetailComponent)
          },
          {
            path: 'division/:id/attendance/:fecha',
            loadComponent: () => import('./features/admin/daily-attendance-detail/daily-attendance-detail').then(m => m.DailyAttendanceDetailComponent)
          },
          {
            path: 'courses',
            loadComponent: () => import('./features/admin/academic-management/courses/courses').then(m => m.CoursesComponent)
          },
          {
            path: 'subjects',
            loadComponent: () => import('./features/admin/academic-management/subjects/subjects').then(m => m.SubjectsComponent)
          },
          {
            path: 'schedules',
            loadComponent: () => import('./features/admin/academic-management/schedules/schedules').then(m => m.SchedulesComponent)
          },
          {
            path: 'assignments',
            loadComponent: () => import('./features/admin/academic-management/assignments/assignments').then(m => m.AssignmentsComponent)
          }
        ]
      },
      // Biometric management routes
      {
        path: 'biometric',
        children: [
          {
            path: 'fingerprints',
            loadComponent: () => import('./features/admin/biometric-management/fingerprints/fingerprints').then(m => m.FingerprintsComponent)
          },
          {
            path: 'records',
            loadComponent: () => import('./features/admin/biometric-management/records/records').then(m => m.RecordsComponent)
          }
        ]
      },
      // Devices management
      {
        path: 'devices',
        loadComponent: () => import('./features/admin/devices-management/devices-management').then(m => m.DevicesManagementComponent)
      },
      // Reports routes
      {
        path: 'reports',
        children: [
          {
            path: '',
            redirectTo: 'attendance',
            pathMatch: 'full'
          },
          {
            path: 'attendance',
            loadComponent: () => import('./features/admin/reports/attendance/attendance').then(m => m.AttendanceReportsComponent)
          },
          {
            path: 'teachers',
            loadComponent: () => import('./features/admin/reports/teachers/teachers').then(m => m.TeachersReportsComponent)
          },
          {
            path: 'statistics',
            loadComponent: () => import('./features/admin/reports/statistics/statistics').then(m => m.StatisticsReportsComponent)
          }
        ]
      },
      // Settings routes
      {
        path: 'settings',
        children: [
          {
            path: '',
            redirectTo: 'system',
            pathMatch: 'full'
          },
          {
            path: 'system',
            loadComponent: () => import('./features/admin/settings/system/system').then(m => m.SystemSettingsComponent)
          },
          {
            path: 'logs',
            loadComponent: () => import('./features/admin/settings/logs/logs').then(m => m.LogsSettingsComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'preceptor',
    canActivate: [AuthGuard],
    data: { roles: ['preceptor'] },
    loadChildren: () => import('./features/preceptor/preceptor-module').then(m => m.PreceptorModule)
  },
  {
    path: 'professor',
    canActivate: [AuthGuard],
    data: { roles: ['profesor'] },
    loadChildren: () => import('./features/professor/professor-module').then(m => m.ProfessorModule)
  },
  {
    path: 'student',
    canActivate: [AuthGuard],
    data: { roles: ['alumno'] },
    loadChildren: () => import('./features/student/student-module').then(m => m.StudentModule)
  },
  {
    path: 'parent',
    canActivate: [AuthGuard],
    data: { roles: ['padre'] },
    loadChildren: () => import('./features/parent/parent-module').then(m => m.ParentModule)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
