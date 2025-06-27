import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParentLayoutComponent } from './parent-layout/parent-layout';
import { ParentDashboardComponent } from './dashboard/dashboard';
import { ChildrenComponent } from './children/children';
import { GradesComponent } from './grades/grades';
import { AttendanceComponent } from './attendance/attendance';
import { AssignmentsComponent } from './assignments/assignments';
import { CommunicationsComponent } from './communications/communications';
import { MensajeriaComponent } from './mensajeria/mensajeria';
import { ComunicadosComponent } from './comunicados/comunicados';
import { MeetingsComponent } from './meetings/meetings';
import { PaymentsComponent } from './payments/payments';
import { SettingsComponent } from './settings/settings';

const routes: Routes = [
  {
    path: '',
    component: ParentLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ParentDashboardComponent },
      { path: 'children', component: ChildrenComponent },
      { path: 'grades', component: GradesComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'assignments', component: AssignmentsComponent },
      { path: 'communications', component: CommunicationsComponent },
      { path: 'mensajeria', component: MensajeriaComponent },
      { path: 'comunicados', component: ComunicadosComponent },
      { path: 'meetings', component: MeetingsComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentRoutingModule { }
