import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing-module';
import { AdminLayoutComponent } from './admin-layout/admin-layout';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,
    AdminLayoutComponent
  ]
})
export class AdminModule { }
