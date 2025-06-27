import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ParentRoutingModule } from './parent-routing-module';
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

@NgModule({
  declarations: [
    ParentLayoutComponent,
    ParentDashboardComponent,
    ChildrenComponent,
    GradesComponent,
    AttendanceComponent,
    AssignmentsComponent,
    CommunicationsComponent,
    MensajeriaComponent,
    ComunicadosComponent,
    MeetingsComponent,
    PaymentsComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ParentRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatDividerModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class ParentModule { }
