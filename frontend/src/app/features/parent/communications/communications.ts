import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';

export interface CommunicationMessage {
  id: number;
  subject: string;
  content: string;
  htmlContent?: string;
  sender: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  recipients: {
    id: number;
    name: string;
    role: string;
  }[];
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  priority: 'high' | 'normal' | 'low';
  type: 'message' | 'announcement' | 'alert' | 'newsletter';
  attachments?: {
    id: number;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  relatedChild?: {
    id: number;
    name: string;
  };
  conversationId?: number;
  parentMessageId?: number;
  isReply?: boolean;
  replyCount?: number;
  hasUnreadReplies?: boolean;
  tags?: string[];
  selected?: boolean;
}

export interface CommunicationFilter {
  type: string[];
  sender: string[];
  priority: string[];
  readStatus: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  child: string[];
  tags: string[];
  hasAttachments: boolean | null;
}

export interface CommunicationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: {
    messages: boolean;
    announcements: boolean;
    alerts: boolean;
    newsletters: boolean;
  };
  autoMarkAsRead: boolean;
  groupByConversation: boolean;
}

@Component({
  selector: 'app-parent-communications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="communications-container">
      <!-- Header -->
      <div class="communications-header">
        <div class="header-content">
          <h1>Comunicaciones</h1>
          <p>Mensajes, anuncios y notificaciones del colegio</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="toggleSidebar()" matTooltip="Filtros">
            <mat-icon>filter_list</mat-icon>
          </button>
          <button mat-icon-button (click)="refreshCommunications()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-raised-button color="primary" (click)="composeMessage()">
            <mat-icon>create</mat-icon>
            Nuevo Mensaje
          </button>
        </div>
      </div>

      <div class="communications-layout">
        <!-- Sidebar -->
        <mat-sidenav-container class="sidenav-container">
          <mat-sidenav #sidebar mode="side" [opened]="sidebarOpen" class="communications-sidebar">
            <div class="sidebar-content">
              <!-- Quick Filters -->
              <div class="quick-filters">
                <h3>Filtros Rápidos</h3>
                <div class="filter-chips">
                  <mat-chip-listbox>
                    <mat-chip-option 
                      *ngFor="let filter of quickFilters" 
                      [selected]="filter.active"
                      (click)="toggleQuickFilter(filter)"
                      [color]="filter.color">
                      <mat-icon>{{ filter.icon }}</mat-icon>
                      {{ filter.label }}
                      <span *ngIf="filter.count > 0" class="filter-count">{{ filter.count }}</span>
                    </mat-chip-option>
                  </mat-chip-listbox>
                </div>
              </div>

              <mat-divider></mat-divider>

              <!-- Advanced Filters -->
              <div class="advanced-filters">
                <h3>Filtros Avanzados</h3>
                
                <!-- Message Type -->
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de Mensaje</mat-label>
                  <mat-select multiple formControlName="type">
                    <mat-option value="message">Mensajes Directos</mat-option>
                    <mat-option value="announcement">Anuncios</mat-option>
                    <mat-option value="alert">Alertas</mat-option>
                    <mat-option value="newsletter">Boletines</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Sender -->
                <mat-form-field appearance="outline">
                  <mat-label>Remitente</mat-label>
                  <mat-select multiple formControlName="sender">
                    <mat-option *ngFor="let sender of senderOptions" [value]="sender.id">
                      {{ sender.name }} ({{ sender.role }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Priority -->
                <mat-form-field appearance="outline">
                  <mat-label>Prioridad</mat-label>
                  <mat-select multiple formControlName="priority">
                    <mat-option value="high">Alta</mat-option>
                    <mat-option value="normal">Normal</mat-option>
                    <mat-option value="low">Baja</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Read Status -->
                <mat-form-field appearance="outline">
                  <mat-label>Estado de Lectura</mat-label>
                  <mat-select formControlName="readStatus">
                    <mat-option value="">Todos</mat-option>
                    <mat-option value="read">Leídos</mat-option>
                    <mat-option value="unread">No Leídos</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Date Range -->
                <div class="date-filters">
                  <mat-form-field appearance="outline">
                    <mat-label>Fecha Desde</mat-label>
                    <input matInput [matDatepicker]="startPicker" formControlName="dateStart">
                    <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                    <mat-datepicker #startPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Fecha Hasta</mat-label>
                    <input matInput [matDatepicker]="endPicker" formControlName="dateEnd">
                    <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                    <mat-datepicker #endPicker></mat-datepicker>
                  </mat-form-field>
                </div>

                <!-- Child Filter -->
                <mat-form-field appearance="outline">
                  <mat-label>Hijo</mat-label>
                  <mat-select multiple formControlName="child">
                    <mat-option *ngFor="let child of childrenOptions" [value]="child.id">
                      {{ child.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Attachments -->
                <mat-checkbox formControlName="hasAttachments">
                  Solo con archivos adjuntos
                </mat-checkbox>

                <div class="filter-actions">
                  <button mat-button (click)="clearFilters()">Limpiar</button>
                  <button mat-raised-button color="primary" (click)="applyFilters()">Aplicar</button>
                </div>
              </div>
            </div>
          </mat-sidenav>

          <mat-sidenav-content class="main-content">
            <!-- Search and Controls -->
            <div class="search-controls">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar en comunicaciones</mat-label>
                <input matInput [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Buscar por asunto, contenido o remitente...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <div class="controls-actions">
                <button mat-button [matMenuTriggerFor]="sortMenu">
                  <mat-icon>sort</mat-icon>
                  Ordenar
                </button>
                <mat-menu #sortMenu="matMenu">
                  <button mat-menu-item (click)="sortBy('timestamp')">
                    <mat-icon>schedule</mat-icon>
                    Fecha
                  </button>
                  <button mat-menu-item (click)="sortBy('sender')">
                    <mat-icon>person</mat-icon>
                    Remitente
                  </button>
                  <button mat-menu-item (click)="sortBy('priority')">
                    <mat-icon>priority_high</mat-icon>
                    Prioridad
                  </button>
                  <button mat-menu-item (click)="sortBy('subject')">
                    <mat-icon>subject</mat-icon>
                    Asunto
                  </button>
                </mat-menu>

                <button mat-button [matMenuTriggerFor]="viewMenu">
                  <mat-icon>view_module</mat-icon>
                  Vista
                </button>
                <mat-menu #viewMenu="matMenu">
                  <button mat-menu-item (click)="setViewMode('list')">
                    <mat-icon>view_list</mat-icon>
                    Lista
                  </button>
                  <button mat-menu-item (click)="setViewMode('cards')">
                    <mat-icon>view_module</mat-icon>
                    Tarjetas
                  </button>
                  <button mat-menu-item (click)="setViewMode('compact')">
                    <mat-icon>view_headline</mat-icon>
                    Compacta
                  </button>
                </mat-menu>

                <button mat-icon-button [matMenuTriggerFor]="moreMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #moreMenu="matMenu">
                  <button mat-menu-item (click)="markAllAsRead()">
                    <mat-icon>mark_email_read</mat-icon>
                    Marcar todo como leído
                  </button>
                  <button mat-menu-item (click)="archiveSelected()">
                    <mat-icon>archive</mat-icon>
                    Archivar seleccionados
                  </button>
                  <button mat-menu-item (click)="deleteSelected()">
                    <mat-icon>delete</mat-icon>
                    Eliminar seleccionados
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="openPreferences()">
                    <mat-icon>settings</mat-icon>
                    Preferencias
                  </button>
                </mat-menu>
              </div>
            </div>

            <!-- Active Filters Display -->
            <div class="active-filters" *ngIf="hasActiveFilters()">
              <div class="filter-chips">
                <mat-chip-listbox>
                  <mat-chip-option 
                    *ngFor="let filter of getActiveFilters()" 
                    (removed)="removeFilter(filter)"
                    removable="true">
                    {{ filter.label }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip-option>
                </mat-chip-listbox>
              </div>
              <button mat-button (click)="clearAllFilters()">Limpiar Todo</button>
            </div>

            <!-- Loading State -->
            <div *ngIf="isLoading" class="loading-container">
              <mat-spinner diameter="48"></mat-spinner>
              <p>Cargando comunicaciones...</p>
            </div>

            <!-- Empty State -->
            <div *ngIf="!isLoading && filteredCommunications.length === 0" class="empty-state">
              <mat-icon>email</mat-icon>
              <h2>No hay comunicaciones</h2>
              <p *ngIf="!hasActiveFilters()">No tienes mensajes en este momento.</p>
              <p *ngIf="hasActiveFilters()">No se encontraron comunicaciones que coincidan con los filtros aplicados.</p>
              <button mat-raised-button color="primary" (click)="composeMessage()" *ngIf="!hasActiveFilters()">
                Enviar Mensaje
              </button>
              <button mat-button (click)="clearAllFilters()" *ngIf="hasActiveFilters()">
                Limpiar Filtros
              </button>
            </div>

            <!-- Communications List -->
            <div *ngIf="!isLoading && filteredCommunications.length > 0" class="communications-list" [class]="'view-' + viewMode">
              
              <!-- Conversation View -->
              <div *ngIf="selectedConversation" class="conversation-view">
                <div class="conversation-header">
                  <button mat-icon-button (click)="closeConversation()">
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <div class="conversation-info">
                    <h2>{{ selectedConversation.subject }}</h2>
                    <p>{{ selectedConversation.participants.length }} participantes</p>
                  </div>
                  <div class="conversation-actions">
                    <button mat-icon-button (click)="toggleConversationStar()">
                      <mat-icon>{{ selectedConversation.isStarred ? 'star' : 'star_border' }}</mat-icon>
                    </button>
                    <button mat-icon-button [matMenuTriggerFor]="conversationMenu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #conversationMenu="matMenu">
                      <button mat-menu-item (click)="archiveConversation()">
                        <mat-icon>archive</mat-icon>
                        Archivar conversación
                      </button>
                      <button mat-menu-item (click)="deleteConversation()">
                        <mat-icon>delete</mat-icon>
                        Eliminar conversación
                      </button>
                    </mat-menu>
                  </div>
                </div>
                
                <div class="conversation-messages">
                  <div *ngFor="let message of selectedConversation.messages" class="message-item" [class.own-message]="message.isOwnMessage">
                    <div class="message-avatar">
                      <mat-icon>{{ message.sender.avatar || 'person' }}</mat-icon>
                    </div>
                    <div class="message-content">
                      <div class="message-header">
                        <span class="sender-name">{{ message.sender.name }}</span>
                        <span class="message-time">{{ formatDate(message.timestamp) }}</span>
                      </div>
                      <div class="message-body" [innerHTML]="message.htmlContent || message.content"></div>
                      <div class="message-attachments" *ngIf="message.attachments && message.attachments.length > 0">
                        <div *ngFor="let attachment of message.attachments" class="attachment-item">
                          <mat-icon>{{ getAttachmentIcon(attachment.type) }}</mat-icon>
                          <span class="attachment-name">{{ attachment.name }}</span>
                          <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
                          <button mat-icon-button (click)="downloadAttachment(attachment)">
                            <mat-icon>download</mat-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="conversation-reply">
                  <mat-form-field appearance="outline" class="reply-field">
                    <mat-label>Escribe tu respuesta...</mat-label>
                    <textarea matInput [(ngModel)]="replyContent" rows="3" placeholder="Escribe tu respuesta aquí..."></textarea>
                  </mat-form-field>
                  <div class="reply-actions">
                    <button mat-icon-button (click)="attachFile()" matTooltip="Adjuntar archivo">
                      <mat-icon>attach_file</mat-icon>
                    </button>
                    <button mat-raised-button color="primary" (click)="sendReply()" [disabled]="!replyContent.trim()">
                      <mat-icon>send</mat-icon>
                      Enviar
                    </button>
                  </div>
                </div>
              </div>

              <!-- List View -->
              <div *ngIf="!selectedConversation" class="messages-list">
                <div 
                  *ngFor="let communication of pagedCommunications" 
                  class="communication-item"
                  [class.unread]="!communication.isRead"
                  [class.high-priority]="communication.priority === 'high'"
                  (click)="selectCommunication(communication)"
                  matRipple>
                  
                  <!-- Checkbox for selection -->
                  <mat-checkbox 
                    class="communication-checkbox"
                    [(ngModel)]="communication.selected"
                    (click)="$event.stopPropagation()"
                    (change)="onCommunicationSelect(communication)">
                  </mat-checkbox>

                  <!-- Message Type Icon -->
                  <div class="message-type-icon">
                    <mat-icon [color]="getMessageTypeColor(communication.type)">
                      {{ getMessageTypeIcon(communication.type) }}
                    </mat-icon>
                  </div>

                  <!-- Sender Info -->
                  <div class="sender-info">
                    <div class="sender-avatar">
                      <mat-icon>{{ communication.sender.avatar || 'person' }}</mat-icon>
                    </div>
                    <div class="sender-details">
                      <div class="sender-name">{{ communication.sender.name }}</div>
                      <div class="sender-role">{{ communication.sender.role }}</div>
                    </div>
                  </div>

                  <!-- Message Content -->
                  <div class="message-content">
                    <div class="message-header">
                      <div class="message-subject">
                        {{ communication.subject }}
                        <mat-icon *ngIf="communication.priority === 'high'" class="priority-icon">priority_high</mat-icon>
                        <mat-icon *ngIf="communication.attachments && communication.attachments.length > 0" class="attachment-icon">attach_file</mat-icon>
                      </div>
                      <div class="message-meta">
                        <span class="message-time">{{ formatDate(communication.timestamp) }}</span>
                        <mat-chip class="type-chip" [color]="getMessageTypeColor(communication.type)">
                          {{ getMessageTypeLabel(communication.type) }}
                        </mat-chip>
                      </div>
                    </div>
                    <div class="message-preview">
                      {{ getMessagePreview(communication.content) }}
                    </div>
                    <div class="message-tags" *ngIf="communication.tags && communication.tags.length > 0">
                      <mat-chip *ngFor="let tag of communication.tags" class="tag-chip">{{ tag }}</mat-chip>
                    </div>
                    <div class="message-child" *ngIf="communication.relatedChild">
                      <mat-icon>child_care</mat-icon>
                      <span>{{ communication.relatedChild.name }}</span>
                    </div>
                  </div>

                  <!-- Message Actions -->
                  <div class="message-actions">
                    <button mat-icon-button (click)="toggleStar(communication, $event)" matTooltip="Marcar como favorito">
                      <mat-icon>{{ communication.isStarred ? 'star' : 'star_border' }}</mat-icon>
                    </button>
                    <button mat-icon-button (click)="toggleRead(communication, $event)" matTooltip="{{ communication.isRead ? 'Marcar como no leído' : 'Marcar como leído' }}">
                      <mat-icon>{{ communication.isRead ? 'mark_email_unread' : 'mark_email_read' }}</mat-icon>
                    </button>
                    <button mat-icon-button [matMenuTriggerFor]="messageMenu" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #messageMenu="matMenu">
                      <button mat-menu-item (click)="replyCommunication(communication)">
                        <mat-icon>reply</mat-icon>
                        Responder
                      </button>
                      <button mat-menu-item (click)="forwardCommunication(communication)">
                        <mat-icon>forward</mat-icon>
                        Reenviar
                      </button>
                      <button mat-menu-item (click)="archiveCommunication(communication)">
                        <mat-icon>archive</mat-icon>
                        Archivar
                      </button>
                      <button mat-menu-item (click)="deleteCommunication(communication)">
                        <mat-icon>delete</mat-icon>
                        Eliminar
                      </button>
                    </mat-menu>
                  </div>

                  <!-- Reply Count -->
                  <div class="reply-count" *ngIf="communication.replyCount && communication.replyCount > 0">
                    <mat-icon>forum</mat-icon>
                    <span>{{ communication.replyCount }}</span>
                    <mat-icon *ngIf="communication.hasUnreadReplies" class="unread-indicator">fiber_manual_record</mat-icon>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <mat-paginator 
                *ngIf="!selectedConversation && filteredCommunications.length > pageSize"
                [length]="filteredCommunications.length"
                [pageSize]="pageSize"
                [pageSizeOptions]="[10, 25, 50, 100]"
                (page)="onPageChange($event)"
                showFirstLastButtons>
              </mat-paginator>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styleUrl: './communications.scss'
})
export class ParentCommunicationsComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar') sidebar!: ElementRef;

  isLoading = true;
  sidebarOpen = false;
  viewMode: 'list' | 'cards' | 'compact' = 'list';
  searchTerm = '';
  currentSort = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Pagination
  pageSize = 25;
  currentPage = 0;
  
  // Data
  communications: CommunicationMessage[] = [];
  filteredCommunications: CommunicationMessage[] = [];
  pagedCommunications: CommunicationMessage[] = [];
  senderOptions: any[] = [];
  childrenOptions: any[] = [];
  selectedCommunication: CommunicationMessage | null = null;
  selectedConversation: any = null;
  
  // Forms
  filterForm: FormGroup;
  replyContent = '';
  
  // Filters
  quickFilters = [
    { id: 'unread', label: 'No Leídos', icon: 'mark_email_unread', color: 'primary', active: false, count: 0 },
    { id: 'starred', label: 'Favoritos', icon: 'star', color: 'accent', active: false, count: 0 },
    { id: 'high-priority', label: 'Alta Prioridad', icon: 'priority_high', color: 'warn', active: false, count: 0 },
    { id: 'with-attachments', label: 'Con Archivos', icon: 'attach_file', color: 'primary', active: false, count: 0 }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      type: [[]],
      sender: [[]],
      priority: [[]],
      readStatus: [''],
      dateStart: [null],
      dateEnd: [null],
      child: [[]],
      hasAttachments: [false]
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadCommunications();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeComponent(): void {
    // Initialize sender options
    this.senderOptions = [
      { id: 1, name: 'Prof. García Martínez', role: 'Profesor de Matemática' },
      { id: 2, name: 'Dra. López Silva', role: 'Directora Académica' },
      { id: 3, name: 'Prof. Rodríguez Pérez', role: 'Profesor de Lengua' },
      { id: 4, name: 'Lic. Fernández Castro', role: 'Coordinador Pedagógico' },
      { id: 5, name: 'Secretaría Académica', role: 'Administración' }
    ];

    // Initialize children options
    this.childrenOptions = [
      { id: 1, name: 'Juan Carlos Pérez González' },
      { id: 2, name: 'María Elena Pérez González' }
    ];
  }

  private setupFilterSubscriptions(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private loadCommunications(): void {
    this.isLoading = true;
    
    // Mock data - En producción esto vendría del backend
    setTimeout(() => {
      this.communications = [
        {
          id: 1,
          subject: 'Reunión de Padres - Próxima Semana',
          content: 'Estimados padres, los invitamos a la reunión de padres que se realizará el próximo miércoles a las 18:00 horas en el salón de actos del colegio. En esta reunión hablaremos sobre el progreso académico de los estudiantes y los próximos eventos escolares.',
          htmlContent: '<p>Estimados padres,</p><p>Los invitamos a la reunión de padres que se realizará el <strong>próximo miércoles a las 18:00 horas</strong> en el salón de actos del colegio.</p><p>En esta reunión hablaremos sobre:</p><ul><li>Progreso académico de los estudiantes</li><li>Próximos eventos escolares</li><li>Actividades extracurriculares</li></ul>',
          sender: {
            id: 2,
            name: 'Dra. López Silva',
            role: 'Directora Académica',
            avatar: 'person'
          },
          recipients: [
            { id: 1, name: 'Todos los Padres', role: 'Padres' }
          ],
          timestamp: new Date('2024-12-08T10:30:00'),
          isRead: false,
          isStarred: false,
          isArchived: false,
          priority: 'high',
          type: 'announcement',
          attachments: [
            {
              id: 1,
              name: 'agenda_reunion_padres.pdf',
              size: 245760,
              type: 'application/pdf',
              url: '/attachments/agenda_reunion_padres.pdf'
            }
          ],
          conversationId: 1,
          replyCount: 0,
          tags: ['reunión', 'padres', 'académico']
        },
        {
          id: 2,
          subject: 'Examen de Matemática - Juan Carlos',
          content: 'Buenos días. Le informo que Juan Carlos ha obtenido una calificación de 8.5 en el examen de matemática de la unidad 4. Felicitaciones por el excelente desempeño. Adjunto encontrará el detalle de la evaluación.',
          sender: {
            id: 1,
            name: 'Prof. García Martínez',
            role: 'Profesor de Matemática',
            avatar: 'school'
          },
          recipients: [
            { id: 1, name: 'María González', role: 'Madre' }
          ],
          timestamp: new Date('2024-12-07T14:15:00'),
          isRead: true,
          isStarred: true,
          isArchived: false,
          priority: 'normal',
          type: 'message',
          relatedChild: {
            id: 1,
            name: 'Juan Carlos Pérez González'
          },
          conversationId: 2,
          replyCount: 2,
          hasUnreadReplies: false,
          tags: ['calificación', 'matemática', 'examen']
        },
        {
          id: 3,
          subject: 'Alerta: Falta sin Justificar',
          content: 'Se ha registrado una falta sin justificar para María Elena el día de hoy en la clase de Educación Física. Por favor, contacte con la secretaría para regularizar la situación.',
          sender: {
            id: 5,
            name: 'Secretaría Académica',
            role: 'Administración',
            avatar: 'admin_panel_settings'
          },
          recipients: [
            { id: 1, name: 'María González', role: 'Madre' }
          ],
          timestamp: new Date('2024-12-06T16:45:00'),
          isRead: false,
          isStarred: false,
          isArchived: false,
          priority: 'high',
          type: 'alert',
          relatedChild: {
            id: 2,
            name: 'María Elena Pérez González'
          },
          conversationId: 3,
          replyCount: 0,
          tags: ['falta', 'educación física', 'justificación']
        },
        {
          id: 4,
          subject: 'Boletín Informativo - Diciembre 2024',
          content: 'Boletín informativo del mes de diciembre con todas las novedades del colegio, próximos eventos, y reconocimientos a estudiantes destacados.',
          htmlContent: '<h2>Boletín Informativo - Diciembre 2024</h2><h3>Novedades del Mes</h3><p>En este mes de diciembre queremos compartir con ustedes las principales novedades y logros de nuestra institución educativa.</p><h3>Próximos Eventos</h3><ul><li>Ceremonia de Graduación - 15 de Diciembre</li><li>Festival de Talentos - 18 de Diciembre</li><li>Cierre del Año Lectivo - 20 de Diciembre</li></ul>',
          sender: {
            id: 4,
            name: 'Lic. Fernández Castro',
            role: 'Coordinador Pedagógico',
            avatar: 'campaign'
          },
          recipients: [
            { id: 1, name: 'Toda la Comunidad Educativa', role: 'Comunidad' }
          ],
          timestamp: new Date('2024-12-05T09:00:00'),
          isRead: true,
          isStarred: false,
          isArchived: false,
          priority: 'normal',
          type: 'newsletter',
          attachments: [
            {
              id: 2,
              name: 'boletin_diciembre_2024.pdf',
              size: 1024000,
              type: 'application/pdf',
              url: '/attachments/boletin_diciembre_2024.pdf'
            },
            {
              id: 3,
              name: 'calendario_eventos.jpg',
              size: 512000,
              type: 'image/jpeg',
              url: '/attachments/calendario_eventos.jpg'
            }
          ],
          conversationId: 4,
          replyCount: 0,
          tags: ['boletín', 'eventos', 'diciembre']
        },
        {
          id: 5,
          subject: 'Tarea Pendiente - Ensayo de Historia',
          content: 'Recordatorio: Juan Carlos tiene pendiente la entrega del ensayo sobre la Revolución Industrial para la clase de Historia. La fecha límite es el viernes 13 de diciembre.',
          sender: {
            id: 3,
            name: 'Prof. Rodríguez Pérez',
            role: 'Profesor de Historia',
            avatar: 'history_edu'
          },
          recipients: [
            { id: 1, name: 'María González', role: 'Madre' }
          ],
          timestamp: new Date('2024-12-04T11:20:00'),
          isRead: false,
          isStarred: false,
          isArchived: false,
          priority: 'normal',
          type: 'message',
          relatedChild: {
            id: 1,
            name: 'Juan Carlos Pérez González'
          },
          conversationId: 5,
          replyCount: 1,
          hasUnreadReplies: true,
          tags: ['tarea', 'historia', 'ensayo']
        }
      ];

      this.updateQuickFilterCounts();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  private updateQuickFilterCounts(): void {
    this.quickFilters[0].count = this.communications.filter(c => !c.isRead).length;
    this.quickFilters[1].count = this.communications.filter(c => c.isStarred).length;
    this.quickFilters[2].count = this.communications.filter(c => c.priority === 'high').length;
    this.quickFilters[3].count = this.communications.filter(c => c.attachments && c.attachments.length > 0).length;
  }

  applyFilters(): void {
    let filtered = [...this.communications];
    const formValue = this.filterForm.value;

    // Apply quick filters
    const activeQuickFilters = this.quickFilters.filter(f => f.active);
    if (activeQuickFilters.length > 0) {
      filtered = filtered.filter(comm => {
        return activeQuickFilters.some(filter => {
          switch (filter.id) {
            case 'unread': return !comm.isRead;
            case 'starred': return comm.isStarred;
            case 'high-priority': return comm.priority === 'high';
            case 'with-attachments': return comm.attachments && comm.attachments.length > 0;
            default: return false;
          }
        });
      });
    }

    // Apply advanced filters
    if (formValue.type && formValue.type.length > 0) {
      filtered = filtered.filter(comm => formValue.type.includes(comm.type));
    }

    if (formValue.sender && formValue.sender.length > 0) {
      filtered = filtered.filter(comm => formValue.sender.includes(comm.sender.id));
    }

    if (formValue.priority && formValue.priority.length > 0) {
      filtered = filtered.filter(comm => formValue.priority.includes(comm.priority));
    }

    if (formValue.readStatus) {
      filtered = filtered.filter(comm => 
        formValue.readStatus === 'read' ? comm.isRead : !comm.isRead
      );
    }

    if (formValue.dateStart) {
      filtered = filtered.filter(comm => comm.timestamp >= formValue.dateStart);
    }

    if (formValue.dateEnd) {
      filtered = filtered.filter(comm => comm.timestamp <= formValue.dateEnd);
    }

    if (formValue.child && formValue.child.length > 0) {
      filtered = filtered.filter(comm => 
        comm.relatedChild && formValue.child.includes(comm.relatedChild.id)
      );
    }

    if (formValue.hasAttachments) {
      filtered = filtered.filter(comm => comm.attachments && comm.attachments.length > 0);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(comm =>
        comm.subject.toLowerCase().includes(searchLower) ||
        comm.content.toLowerCase().includes(searchLower) ||
        comm.sender.name.toLowerCase().includes(searchLower) ||
        (comm.tags && comm.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.currentSort) {
        case 'timestamp':
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        case 'sender':
          aValue = a.sender.name;
          bValue = b.sender.name;
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'subject':
          aValue = a.subject;
          bValue = b.subject;
          break;
        default:
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
      }

      if (this.sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    this.filteredCommunications = filtered;
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedCommunications = this.filteredCommunications.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleQuickFilter(filter: any): void {
    filter.active = !filter.active;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.quickFilters.forEach(f => f.active = false);
    this.searchTerm = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.clearFilters();
  }

  hasActiveFilters(): boolean {
    return this.quickFilters.some(f => f.active) || 
           Object.values(this.filterForm.value).some(value => 
             value && (Array.isArray(value) ? value.length > 0 : true)
           ) ||
           this.searchTerm.trim().length > 0;
  }

  getActiveFilters(): any[] {
    const filters = [];
    
    // Quick filters
    this.quickFilters.filter(f => f.active).forEach(f => {
      filters.push({ type: 'quick', id: f.id, label: f.label });
    });

    // Advanced filters
    const formValue = this.filterForm.value;
    if (formValue.type && formValue.type.length > 0) {
      filters.push({ type: 'type', label: `Tipo: ${formValue.type.join(', ')}` });
    }
    // ... more filter labels

    return filters;
  }

  removeFilter(filter: any): void {
    if (filter.type === 'quick') {
      const quickFilter = this.quickFilters.find(f => f.id === filter.id);
      if (quickFilter) quickFilter.active = false;
    }
    this.applyFilters();
  }

  selectCommunication(communication: CommunicationMessage): void {
    this.selectedCommunication = communication;
    if (!communication.isRead) {
      this.markAsRead(communication);
    }
    
    // If it's part of a conversation, load the conversation
    if (communication.conversationId) {
      this.loadConversation(communication.conversationId);
    }
  }

  private loadConversation(conversationId: number): void {
    // Mock conversation data
    this.selectedConversation = {
      id: conversationId,
      subject: this.selectedCommunication?.subject || '',
      participants: [
        { id: 1, name: 'María González', role: 'Madre' },
        { id: 2, name: this.selectedCommunication?.sender.name || '', role: this.selectedCommunication?.sender.role || '' }
      ],
      messages: [
        {
          id: 1,
          sender: this.selectedCommunication?.sender || {},
          content: this.selectedCommunication?.content || '',
          htmlContent: this.selectedCommunication?.htmlContent,
          timestamp: this.selectedCommunication?.timestamp || new Date(),
          attachments: this.selectedCommunication?.attachments || [],
          isOwnMessage: false
        }
      ],
      isStarred: this.selectedCommunication?.isStarred || false
    };
  }

  closeConversation(): void {
    this.selectedConversation = null;
    this.selectedCommunication = null;
  }

  markAsRead(communication: CommunicationMessage): void {
    communication.isRead = true;
    this.updateQuickFilterCounts();
  }

  toggleRead(communication: CommunicationMessage, event: Event): void {
    event.stopPropagation();
    communication.isRead = !communication.isRead;
    this.updateQuickFilterCounts();
  }

  toggleStar(communication: CommunicationMessage, event: Event): void {
    event.stopPropagation();
    communication.isStarred = !communication.isStarred;
    this.updateQuickFilterCounts();
  }

  onCommunicationSelect(communication: CommunicationMessage): void {
    // Handle multi-select logic
  }

  setViewMode(mode: 'list' | 'cards' | 'compact'): void {
    this.viewMode = mode;
  }

  sortBy(field: string): void {
    if (this.currentSort === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = field;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  composeMessage(): void {
    // Open compose message dialog
    this.snackBar.open('Función de composición de mensajes próximamente', 'Cerrar', {
      duration: 3000
    });
  }

  replyCommunication(communication: CommunicationMessage): void {
    this.selectCommunication(communication);
  }

  forwardCommunication(communication: CommunicationMessage): void {
    this.snackBar.open('Función de reenvío próximamente', 'Cerrar', {
      duration: 3000
    });
  }

  archiveCommunication(communication: CommunicationMessage): void {
    communication.isArchived = true;
    this.snackBar.open('Mensaje archivado', 'Deshacer', {
      duration: 3000
    }).onAction().subscribe(() => {
      communication.isArchived = false;
    });
    this.applyFilters();
  }

  deleteCommunication(communication: CommunicationMessage): void {
    const index = this.communications.indexOf(communication);
    if (index > -1) {
      this.communications.splice(index, 1);
      this.snackBar.open('Mensaje eliminado', 'Deshacer', {
        duration: 3000
      }).onAction().subscribe(() => {
        this.communications.splice(index, 0, communication);
        this.applyFilters();
      });
      this.applyFilters();
    }
  }

  markAllAsRead(): void {
    this.communications.forEach(comm => comm.isRead = true);
    this.updateQuickFilterCounts();
    this.snackBar.open('Todos los mensajes marcados como leídos', 'Cerrar', {
      duration: 3000
    });
  }

  archiveSelected(): void {
    const selected = this.communications.filter(c => c.selected);
    selected.forEach(comm => comm.isArchived = true);
    this.snackBar.open(`${selected.length} mensajes archivados`, 'Cerrar', {
      duration: 3000
    });
    this.applyFilters();
  }

  deleteSelected(): void {
    const selected = this.communications.filter(c => c.selected);
    selected.forEach(comm => {
      const index = this.communications.indexOf(comm);
      if (index > -1) this.communications.splice(index, 1);
    });
    this.snackBar.open(`${selected.length} mensajes eliminados`, 'Cerrar', {
      duration: 3000
    });
    this.applyFilters();
  }

  sendReply(): void {
    if (this.replyContent.trim() && this.selectedConversation) {
      const newMessage = {
        id: Date.now(),
        sender: { id: 0, name: 'Tú', role: 'Padre/Madre' },
        content: this.replyContent,
        timestamp: new Date(),
        attachments: [],
        isOwnMessage: true
      };
      
      this.selectedConversation.messages.push(newMessage);
      this.replyContent = '';
      
      this.snackBar.open('Respuesta enviada', 'Cerrar', {
        duration: 3000
      });
    }
  }

  openPreferences(): void {
    this.snackBar.open('Preferencias de comunicación próximamente', 'Cerrar', {
      duration: 3000
    });
  }

  refreshCommunications(): void {
    this.loadCommunications();
  }

  attachFile(): void {
    this.snackBar.open('Función de adjuntar archivos próximamente', 'Cerrar', {
      duration: 3000
    });
  }

  downloadAttachment(attachment: any): void {
    this.snackBar.open(`Descargando ${attachment.name}`, 'Cerrar', {
      duration: 3000
    });
  }

  toggleConversationStar(): void {
    if (this.selectedConversation) {
      this.selectedConversation.isStarred = !this.selectedConversation.isStarred;
    }
  }

  archiveConversation(): void {
    this.snackBar.open('Conversación archivada', 'Cerrar', {
      duration: 3000
    });
    this.closeConversation();
  }

  deleteConversation(): void {
    this.snackBar.open('Conversación eliminada', 'Cerrar', {
      duration: 3000
    });
    this.closeConversation();
  }

  // Utility methods
  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return `Hace ${days} días`;
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMessageTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'message': 'email',
      'announcement': 'campaign',
      'alert': 'warning',
      'newsletter': 'article'
    };
    return icons[type] || 'email';
  }

  getMessageTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'message': 'primary',
      'announcement': 'accent',
      'alert': 'warn',
      'newsletter': 'primary'
    };
    return colors[type] || 'primary';
  }

  getMessageTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'message': 'Mensaje',
      'announcement': 'Anuncio',
      'alert': 'Alerta',
      'newsletter': 'Boletín'
    };
    return labels[type] || 'Mensaje';
  }

  getMessagePreview(content: string): string {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  }

  getAttachmentIcon(type: string): string {
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('image')) return 'image';
    if (type.includes('video')) return 'video_file';
    if (type.includes('audio')) return 'audio_file';
    if (type.includes('document') || type.includes('word')) return 'description';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'grid_on';
    return 'attach_file';
  }
}