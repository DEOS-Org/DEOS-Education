import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { DeviceService } from '../../../core/services/device';

@Component({
  selector: 'app-devices-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule
  ],
  templateUrl: './devices-management.html',
  styleUrl: './devices-management.scss'
})
export class DevicesManagementComponent implements OnInit {
  devices: any[] = [];
  displayedColumns: string[] = ['nombre', 'ip', 'puerto', 'tipo', 'ubicacion', 'estado', 'actions'];
  isLoading = true;
  searchForm: FormGroup;
  
  deviceTypes = [
    { value: 'biometrico', viewValue: 'Biométrico' },
    { value: 'rfid', viewValue: 'RFID' },
    { value: 'camara', viewValue: 'Cámara' }
  ];

  constructor(
    private fb: FormBuilder,
    private deviceService: DeviceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      tipo: ['']
    });
  }

  ngOnInit(): void {
    this.loadDevices();
    
    this.searchForm.valueChanges.subscribe(() => {
      this.filterDevices();
    });
  }

  loadDevices(): void {
    this.isLoading = true;
    this.deviceService.getDevices().subscribe({
      next: (response: any) => {
        this.devices = Array.isArray(response) ? response : (response.data || []);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading devices:', error);
        this.snackBar.open('Error al cargar dispositivos', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  filterDevices(): void {
    const { search, tipo } = this.searchForm.value;
    
    this.deviceService.getDevices().subscribe({
      next: (response: any) => {
        let filteredDevices = Array.isArray(response) ? response : (response.data || []);
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredDevices = filteredDevices.filter((device: any) => 
            device.nombre.toLowerCase().includes(searchLower) ||
            device.ip.toLowerCase().includes(searchLower) ||
            device.ubicacion.toLowerCase().includes(searchLower)
          );
        }
        
        if (tipo) {
          filteredDevices = filteredDevices.filter((device: any) => 
            device.tipo === tipo
          );
        }
        
        this.devices = filteredDevices;
      }
    });
  }

  openDeviceDialog(device?: any): void {
    this.snackBar.open('Funcionalidad de diálogo en desarrollo', 'Cerrar', { duration: 3000 });
  }

  deleteDevice(device: any): void {
    if (confirm(`¿Está seguro de eliminar el dispositivo ${device.nombre}?`)) {
      this.deviceService.deleteDevice(device.id).subscribe({
        next: () => {
          this.snackBar.open('Dispositivo eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadDevices();
        },
        error: (error) => {
          console.error('Error deleting device:', error);
          this.snackBar.open(error.error?.message || 'Error al eliminar dispositivo', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  testConnection(device: any): void {
    this.deviceService.testConnection(device.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open('Conexión exitosa', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Error de conexión', 'Cerrar', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Error testing connection:', error);
        this.snackBar.open('Error al probar conexión', 'Cerrar', { duration: 5000 });
      }
    });
  }

  getStatusColor(activo: boolean): string {
    return activo ? 'primary' : 'warn';
  }

  getStatusText(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}