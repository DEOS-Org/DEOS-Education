import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { ComunicadoService, Comunicado, EstadisticasComunicados } from '../../../core/services/comunicado';
import { AuthService } from '../../../core/services/auth';
import { ComunicadoDetailDialogComponent } from '../../../shared/dialogs/comunicado-detail-dialog/comunicado-detail-dialog';

@Component({
  selector: 'app-parent-comunicados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.scss'
})
export class ParentComunicadosComponent implements OnInit, OnDestroy {
  // Estado del componente
  isLoading = false;
  comunicados: Comunicado[] = [];
  
  // Paginación
  totalComunicados = 0;
  pageSize = 10;
  currentPage = 0;
  
  // Filtros
  filtroTipo = '';
  textoBusqueda = '';
  
  // Usuario actual
  currentUser: any = null;
  
  // Configuración de tabla - solo columnas de lectura
  displayedColumns: string[] = [
    'titulo', 
    'tipo', 
    'dirigido_a', 
    'fecha_publicacion', 
    'creador',
    'prioridad'
  ];
  
  // Opciones para filtros
  tiposComunicado = [
    { value: 'general', label: 'General' },
    { value: 'urgente', label: 'Urgente' },
    { value: 'informativo', label: 'Informativo' },
    { value: 'evento', label: 'Evento' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private comunicadoService: ComunicadoService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.cargarComunicados();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private cargarComunicados(): void {
    this.isLoading = true;
    
    // Solo cargar comunicados publicados dirigidos a estudiantes o todos
    const comunicadosSub = this.comunicadoService.getComunicados(
      this.currentPage + 1,
      this.pageSize,
      this.filtroTipo,
      'publicado' // Solo comunicados publicados
    ).subscribe({
      next: (response) => {
        // Filtrar solo comunicados dirigidos a padres o todos
        this.comunicados = response.comunicados.filter(c => 
          c.dirigido_a === 'padres' || c.dirigido_a === 'todos'
        );
        this.totalComunicados = this.comunicados.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar comunicados:', error);
        this.mostrarError('Error al cargar comunicados');
        this.isLoading = false;
      }
    });

    this.subscriptions.push(comunicadosSub);
  }

  // ========== FILTROS Y BÚSQUEDA ==========

  aplicarFiltros(): void {
    this.currentPage = 0;
    this.cargarComunicados();
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.textoBusqueda = '';
    this.currentPage = 0;
    this.cargarComunicados();
  }

  buscar(): void {
    if (this.textoBusqueda.trim()) {
      const buscarSub = this.comunicadoService.buscarComunicados(this.textoBusqueda).subscribe({
        next: (response) => {
          // Filtrar solo comunicados dirigidos a padres o todos
          this.comunicados = response.comunicados.filter(c => 
            (c.dirigido_a === 'padres' || c.dirigido_a === 'todos') && 
            c.estado === 'publicado'
          );
          this.totalComunicados = this.comunicados.length;
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.mostrarError('Error en la búsqueda');
        }
      });

      this.subscriptions.push(buscarSub);
    } else {
      this.cargarComunicados();
    }
  }

  // ========== PAGINACIÓN ==========

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarComunicados();
  }

  // ========== UTILIDADES ==========

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // ========== GETTERS PARA TEMPLATE ==========

  getTipoChip(tipo: string): { class: string; icon: string } {
    switch (tipo) {
      case 'urgente':
        return { class: 'tipo-urgente', icon: 'priority_high' };
      case 'evento':
        return { class: 'tipo-evento', icon: 'event' };
      case 'informativo':
        return { class: 'tipo-informativo', icon: 'info' };
      default:
        return { class: 'tipo-general', icon: 'announcement' };
    }
  }

  getPrioridadChip(prioridad: string): { class: string; icon: string } {
    switch (prioridad) {
      case 'alta':
        return { class: 'prioridad-alta', icon: 'keyboard_double_arrow_up' };
      case 'media':
        return { class: 'prioridad-media', icon: 'keyboard_arrow_up' };
      case 'baja':
        return { class: 'prioridad-baja', icon: 'keyboard_arrow_down' };
      default:
        return { class: 'prioridad-default', icon: 'remove' };
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCreatorName(comunicado: Comunicado): string {
    // Si el comunicado tiene información del creador, mostrarla
    if (comunicado.creador_nombre && comunicado.creador_apellido) {
      return `${comunicado.creador_nombre} ${comunicado.creador_apellido}`;
    }
    
    // Si no, mostrar texto genérico
    return 'Administración';
  }

  verDetalleComunicado(comunicado: Comunicado): void {
    // Abrir el diálogo con el detalle del comunicado
    const dialogRef = this.dialog.open(ComunicadoDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { comunicado }
    });

    // Marcar como leído después de abrir
    if (!comunicado.leido) {
      this.comunicadoService.marcarComoLeido(comunicado.id).subscribe({
        next: () => {
          // Actualizar el estado local
          comunicado.leido = true;
        },
        error: (error) => {
          console.error('Error al marcar como leído:', error);
        }
      });
    }
  }
}