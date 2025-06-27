import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { ParentService } from '../../../core/services/parent';

// Interfaces
interface Child {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  edad: number;
  curso: string;
  division: string;
  legajo: string;
  foto?: string;
  
  // Contact Information
  telefono?: string;
  email?: string;
  direccion: string;
  
  // Emergency Contacts
  contactosEmergencia: EmergencyContact[];
  
  // Medical Information
  informacionMedica: MedicalInfo;
  
  // Academic Summary
  resumenAcademico: AcademicSummary;
  
  // Schedule and Teachers
  horario: Schedule[];
  profesores: Teacher[];
  
  // Settings and Permissions
  configuracion: ChildSettings;
  
  // Statistics
  estadisticas: ChildStatistics;
  
  // Documents
  documentos: Document[];
}

interface EmergencyContact {
  id: number;
  nombre: string;
  relacion: string;
  telefono: string;
  email?: string;
  esPrincipal: boolean;
}

interface MedicalInfo {
  grupoSanguineo?: string;
  alergias: string[];
  medicamentos: string[];
  condicionesMedicas: string[];
  medicoFamiliar?: string;
  telefonoMedico?: string;
  obraSocial?: string;
  numeroAfiliado?: string;
  observaciones?: string;
}

interface AcademicSummary {
  promedioGeneral: number;
  asistenciaPorcentaje: number;
  materias: Subject[];
  tareasPendientes: number;
  proximosExamenes: Exam[];
  ultimasCalificaciones: Grade[];
}

interface Subject {
  id: number;
  nombre: string;
  profesor: string;
  promedio: number;
  asistencia: number;
  tareasPendientes: number;
}

interface Exam {
  id: number;
  materia: string;
  fecha: string;
  tipo: string;
  descripcion: string;
}

interface Grade {
  id: number;
  materia: string;
  calificacion: number;
  fecha: string;
  tipo: string;
  observaciones?: string;
}

interface Schedule {
  dia: string;
  horarios: TimeSlot[];
}

interface TimeSlot {
  hora: string;
  materia: string;
  profesor: string;
  aula: string;
}

interface Teacher {
  id: number;
  nombre: string;
  materias: string[];
  email: string;
  telefono?: string;
}

interface ChildSettings {
  notificaciones: {
    calificaciones: boolean;
    asistencia: boolean;
    tareas: boolean;
    comunicaciones: boolean;
    eventos: boolean;
  };
  privacidad: {
    compartirDatos: boolean;
    mostrarEnDirectorio: boolean;
    permitirFotos: boolean;
  };
  permisos: {
    retirarse: boolean;
    actividadesExtracurriculares: boolean;
    excursiones: boolean;
  };
}

interface ChildStatistics {
  asistenciaMensual: MonthlyData[];
  promedioMensual: MonthlyData[];
  comparativoGrado: ComparisonData;
  tendencias: TrendData;
}

interface MonthlyData {
  mes: string;
  valor: number;
}

interface ComparisonData {
  posicionEnGrado: number;
  totalEstudiantes: number;
  percentil: number;
}

interface TrendData {
  academica: 'mejorando' | 'estable' | 'descendente';
  asistencia: 'mejorando' | 'estable' | 'descendente';
  comportamiento: 'mejorando' | 'estable' | 'descendente';
}

interface Document {
  id: number;
  nombre: string;
  tipo: string;
  fecha: string;
  tamano: string;
  url: string;
}

@Component({
  selector: 'app-parent-children',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatTabsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="parent-children">
      <!-- Header Section -->
      <div class="children-header">
        <div class="header-content">
          <h1>Mis Hijos</h1>
          <p>Gestiona la información y configuración de tus hijos</p>
        </div>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar" [disabled]="isLoading">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-raised-button color="primary" (click)="addChild()" matTooltip="Agregar nuevo hijo">
            <mat-icon>add</mat-icon>
            Agregar Hijo
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando información de los niños...</p>
      </div>

      <!-- Children Content -->
      <div *ngIf="!isLoading" class="children-content">
        <!-- Children Selection Cards -->
        <div class="children-selector" *ngIf="children.length > 1">
          <h3>Seleccionar Hijo</h3>
          <div class="child-selector-cards">
            <div 
              *ngFor="let child of children" 
              class="child-selector-card"
              [class.selected]="selectedChildId === child.id"
              (click)="selectChild(child.id)"
            >
              <div class="child-avatar">
                <img *ngIf="child.foto" [src]="child.foto" [alt]="child.nombre">
                <mat-icon *ngIf="!child.foto">face</mat-icon>
              </div>
              <div class="child-info">
                <div class="child-name">{{ child.nombre }}</div>
                <div class="child-grade">{{ child.curso }} - {{ child.division }}</div>
              </div>
              <mat-icon class="selection-icon">{{ selectedChildId === child.id ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
            </div>
          </div>
        </div>

        <!-- Selected Child Details -->
        <div *ngIf="selectedChild" class="child-details">
          <!-- Child Profile Card -->
          <mat-card class="profile-card">
            <mat-card-header>
              <div mat-card-avatar class="profile-avatar">
                <img *ngIf="selectedChild.foto" [src]="selectedChild.foto" [alt]="selectedChild.nombre">
                <mat-icon *ngIf="!selectedChild.foto">face</mat-icon>
              </div>
              <mat-card-title>{{ selectedChild.nombre }} {{ selectedChild.apellido }}</mat-card-title>
              <mat-card-subtitle>{{ selectedChild.curso }} - {{ selectedChild.division }} | Legajo: {{ selectedChild.legajo }}</mat-card-subtitle>
              <div class="profile-actions">
                <button mat-icon-button [matMenuTriggerFor]="profileMenu" matTooltip="Más opciones">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #profileMenu="matMenu">
                  <button mat-menu-item (click)="editChild()">
                    <mat-icon>edit</mat-icon>
                    <span>Editar Información</span>
                  </button>
                  <button mat-menu-item (click)="changeProfilePicture()">
                    <mat-icon>photo_camera</mat-icon>
                    <span>Cambiar Foto</span>
                  </button>
                  <button mat-menu-item (click)="downloadProfile()">
                    <mat-icon>download</mat-icon>
                    <span>Descargar Perfil</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="viewFullProfile()" color="primary">
                    <mat-icon>visibility</mat-icon>
                    <span>Ver Perfil Completo</span>
                  </button>
                </mat-menu>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="profile-info">
                <div class="info-item">
                  <mat-icon>cake</mat-icon>
                  <span>{{ selectedChild.edad }} años ({{ formatDate(selectedChild.fechaNacimiento) }})</span>
                </div>
                <div class="info-item">
                  <mat-icon>location_on</mat-icon>
                  <span>{{ selectedChild.direccion }}</span>
                </div>
                <div class="info-item" *ngIf="selectedChild.telefono">
                  <mat-icon>phone</mat-icon>
                  <span>{{ selectedChild.telefono }}</span>
                </div>
                <div class="info-item" *ngIf="selectedChild.email">
                  <mat-icon>email</mat-icon>
                  <span>{{ selectedChild.email }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon [color]="getAttendanceColor(selectedChild.resumenAcademico.asistenciaPorcentaje)">how_to_reg</mat-icon>
                  <div class="stat-info">
                    <div class="stat-value">{{ selectedChild.resumenAcademico.asistenciaPorcentaje }}%</div>
                    <div class="stat-label">Asistencia</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon color="primary">grade</mat-icon>
                  <div class="stat-info">
                    <div class="stat-value">{{ selectedChild.resumenAcademico.promedioGeneral }}</div>
                    <div class="stat-label">Promedio General</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon color="accent" [matBadge]="selectedChild.resumenAcademico.tareasPendientes" matBadgeSize="small">assignment</mat-icon>
                  <div class="stat-info">
                    <div class="stat-value">{{ selectedChild.resumenAcademico.tareasPendientes }}</div>
                    <div class="stat-label">Tareas Pendientes</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
              <mat-card-content>
                <div class="stat-content">
                  <mat-icon color="warn">school</mat-icon>
                  <div class="stat-info">
                    <div class="stat-value">#{{ selectedChild.estadisticas.comparativoGrado.posicionEnGrado }}</div>
                    <div class="stat-label">Posición en Grado</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Tabbed Content -->
          <mat-tab-group class="child-tabs" (selectedTabChange)="onTabChange($event)">
            <!-- Basic Information Tab -->
            <mat-tab label="Información Básica">
              <div class="tab-content">
                <div class="info-grid">
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        Datos Personales
                      </mat-card-title>
                      <button mat-icon-button (click)="editBasicInfo()" matTooltip="Editar">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-list">
                        <div class="info-row">
                          <span class="label">Nombre Completo:</span>
                          <span class="value">{{ selectedChild.nombre }} {{ selectedChild.apellido }}</span>
                        </div>
                        <div class="info-row">
                          <span class="label">Fecha de Nacimiento:</span>
                          <span class="value">{{ formatDate(selectedChild.fechaNacimiento) }}</span>
                        </div>
                        <div class="info-row">
                          <span class="label">Edad:</span>
                          <span class="value">{{ selectedChild.edad }} años</span>
                        </div>
                        <div class="info-row">
                          <span class="label">Legajo:</span>
                          <span class="value">{{ selectedChild.legajo }}</span>
                        </div>
                        <div class="info-row">
                          <span class="label">Curso:</span>
                          <span class="value">{{ selectedChild.curso }} - División {{ selectedChild.division }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>contact_phone</mat-icon>
                        Información de Contacto
                      </mat-card-title>
                      <button mat-icon-button (click)="editContactInfo()" matTooltip="Editar">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-list">
                        <div class="info-row">
                          <span class="label">Dirección:</span>
                          <span class="value">{{ selectedChild.direccion }}</span>
                        </div>
                        <div class="info-row" *ngIf="selectedChild.telefono">
                          <span class="label">Teléfono:</span>
                          <span class="value">{{ selectedChild.telefono }}</span>
                        </div>
                        <div class="info-row" *ngIf="selectedChild.email">
                          <span class="label">Email:</span>
                          <span class="value">{{ selectedChild.email }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <!-- Emergency Contacts Tab -->
            <mat-tab label="Contactos de Emergencia">
              <div class="tab-content">
                <div class="contacts-header">
                  <h3>Contactos de Emergencia</h3>
                  <button mat-raised-button color="primary" (click)="addEmergencyContact()">
                    <mat-icon>add</mat-icon>
                    Agregar Contacto
                  </button>
                </div>
                
                <div class="contacts-list" *ngIf="selectedChild.contactosEmergencia.length > 0">
                  <mat-card *ngFor="let contact of selectedChild.contactosEmergencia" class="contact-card">
                    <mat-card-header>
                      <div mat-card-avatar class="contact-avatar">
                        <mat-icon>{{ contact.esPrincipal ? 'star' : 'person' }}</mat-icon>
                      </div>
                      <mat-card-title>{{ contact.nombre }}</mat-card-title>
                      <mat-card-subtitle>{{ contact.relacion }}</mat-card-subtitle>
                      <div class="contact-actions">
                        <button mat-icon-button (click)="editEmergencyContact(contact)" matTooltip="Editar">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="deleteEmergencyContact(contact.id)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="contact-info">
                        <div class="contact-item">
                          <mat-icon>phone</mat-icon>
                          <span>{{ contact.telefono }}</span>
                        </div>
                        <div class="contact-item" *ngIf="contact.email">
                          <mat-icon>email</mat-icon>
                          <span>{{ contact.email }}</span>
                        </div>
                        <mat-chip *ngIf="contact.esPrincipal" color="primary" class="primary-chip">
                          <mat-icon>star</mat-icon>
                          Principal
                        </mat-chip>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div *ngIf="selectedChild.contactosEmergencia.length === 0" class="no-data">
                  <mat-icon>contacts</mat-icon>
                  <p>No hay contactos de emergencia registrados</p>
                  <button mat-raised-button color="primary" (click)="addEmergencyContact()">
                    Agregar Primer Contacto
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Medical Information Tab -->
            <mat-tab label="Información Médica">
              <div class="tab-content">
                <div class="medical-header">
                  <h3>Información Médica</h3>
                  <button mat-icon-button (click)="editMedicalInfo()" matTooltip="Editar información médica">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>

                <div class="medical-grid">
                  <mat-card class="medical-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>local_hospital</mat-icon>
                        Información General
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="medical-info">
                        <div class="medical-item" *ngIf="selectedChild.informacionMedica.grupoSanguineo">
                          <span class="label">Grupo Sanguíneo:</span>
                          <span class="value">{{ selectedChild.informacionMedica.grupoSanguineo }}</span>
                        </div>
                        <div class="medical-item" *ngIf="selectedChild.informacionMedica.obraSocial">
                          <span class="label">Obra Social:</span>
                          <span class="value">{{ selectedChild.informacionMedica.obraSocial }}</span>
                        </div>
                        <div class="medical-item" *ngIf="selectedChild.informacionMedica.numeroAfiliado">
                          <span class="label">Número de Afiliado:</span>
                          <span class="value">{{ selectedChild.informacionMedica.numeroAfiliado }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="medical-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>warning</mat-icon>
                        Alergias y Condiciones
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="medical-lists">
                        <div class="medical-list" *ngIf="selectedChild.informacionMedica.alergias.length > 0">
                          <h4>Alergias:</h4>
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let alergia of selectedChild.informacionMedica.alergias" color="warn">
                              {{ alergia }}
                            </mat-chip>
                          </mat-chip-listbox>
                        </div>
                        
                        <div class="medical-list" *ngIf="selectedChild.informacionMedica.condicionesMedicas.length > 0">
                          <h4>Condiciones Médicas:</h4>
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let condicion of selectedChild.informacionMedica.condicionesMedicas" color="accent">
                              {{ condicion }}
                            </mat-chip>
                          </mat-chip-listbox>
                        </div>

                        <div class="medical-list" *ngIf="selectedChild.informacionMedica.medicamentos.length > 0">
                          <h4>Medicamentos:</h4>
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let medicamento of selectedChild.informacionMedica.medicamentos" color="primary">
                              {{ medicamento }}
                            </mat-chip>
                          </mat-chip-listbox>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="medical-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        Médico de Familia
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="doctor-info" *ngIf="selectedChild.informacionMedica.medicoFamiliar">
                        <div class="doctor-item">
                          <span class="label">Nombre:</span>
                          <span class="value">{{ selectedChild.informacionMedica.medicoFamiliar }}</span>
                        </div>
                        <div class="doctor-item" *ngIf="selectedChild.informacionMedica.telefonoMedico">
                          <span class="label">Teléfono:</span>
                          <span class="value">{{ selectedChild.informacionMedica.telefonoMedico }}</span>
                        </div>
                      </div>
                      <p *ngIf="!selectedChild.informacionMedica.medicoFamiliar" class="no-info">
                        No se ha registrado información del médico de familia
                      </p>
                    </mat-card-content>
                  </mat-card>
                </div>

                <mat-card class="observations-card" *ngIf="selectedChild.informacionMedica.observaciones">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>note</mat-icon>
                      Observaciones Médicas
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <p>{{ selectedChild.informacionMedica.observaciones }}</p>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Academic Progress Tab -->
            <mat-tab label="Progreso Académico">
              <div class="tab-content">
                <div class="academic-overview">
                  <mat-card class="overview-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>trending_up</mat-icon>
                        Resumen Académico
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="academic-stats">
                        <div class="academic-stat">
                          <div class="stat-circle excellent">
                            <span>{{ selectedChild.resumenAcademico.promedioGeneral }}</span>
                          </div>
                          <div class="stat-label">Promedio General</div>
                        </div>
                        <div class="academic-stat">
                          <div class="stat-circle good">
                            <span>{{ selectedChild.resumenAcademico.asistenciaPorcentaje }}%</span>
                          </div>
                          <div class="stat-label">Asistencia</div>
                        </div>
                        <div class="academic-stat">
                          <div class="stat-circle warning">
                            <span>{{ selectedChild.resumenAcademico.tareasPendientes }}</span>
                          </div>
                          <div class="stat-label">Tareas Pendientes</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="comparison-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>equalizer</mat-icon>
                        Comparación con el Grado
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="comparison-info">
                        <div class="comparison-item">
                          <span class="label">Posición en el grado:</span>
                          <span class="value">#{{ selectedChild.estadisticas.comparativoGrado.posicionEnGrado }} de {{ selectedChild.estadisticas.comparativoGrado.totalEstudiantes }}</span>
                        </div>
                        <div class="comparison-item">
                          <span class="label">Percentil:</span>
                          <span class="value">{{ selectedChild.estadisticas.comparativoGrado.percentil }}°</span>
                        </div>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="selectedChild.estadisticas.comparativoGrado.percentil"
                        color="primary">
                      </mat-progress-bar>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="subjects-section">
                  <h3>Materias</h3>
                  <div class="subjects-grid">
                    <mat-card *ngFor="let materia of selectedChild.resumenAcademico.materias" class="subject-card">
                      <mat-card-header>
                        <mat-card-title>{{ materia.nombre }}</mat-card-title>
                        <mat-card-subtitle>{{ materia.profesor }}</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="subject-metrics">
                          <div class="metric">
                            <span class="metric-value" [class]="getGradeClass(materia.promedio)">{{ materia.promedio }}</span>
                            <span class="metric-label">Promedio</span>
                          </div>
                          <div class="metric">
                            <span class="metric-value">{{ materia.asistencia }}%</span>
                            <span class="metric-label">Asistencia</span>
                          </div>
                          <div class="metric" *ngIf="materia.tareasPendientes > 0">
                            <span class="metric-value warning">{{ materia.tareasPendientes }}</span>
                            <span class="metric-label">Tareas Pendientes</span>
                          </div>
                        </div>
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="materia.promedio * 10"
                          [color]="getProgressColor(materia.promedio)">
                        </mat-progress-bar>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>

                <div class="exams-section" *ngIf="selectedChild.resumenAcademico.proximosExamenes.length > 0">
                  <h3>Próximos Exámenes</h3>
                  <div class="exams-list">
                    <mat-card *ngFor="let examen of selectedChild.resumenAcademico.proximosExamenes" class="exam-card">
                      <mat-card-content>
                        <div class="exam-info">
                          <div class="exam-date">
                            <div class="date-day">{{ getEventDay(examen.fecha) }}</div>
                            <div class="date-month">{{ getEventMonth(examen.fecha) }}</div>
                          </div>
                          <div class="exam-details">
                            <div class="exam-subject">{{ examen.materia }}</div>
                            <div class="exam-type">{{ examen.tipo }}</div>
                            <div class="exam-description">{{ examen.descripcion }}</div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Schedule & Teachers Tab -->
            <mat-tab label="Horarios y Profesores">
              <div class="tab-content">
                <div class="schedule-section">
                  <h3>Horario de Clases</h3>
                  <div class="schedule-grid">
                    <div *ngFor="let dia of selectedChild.horario" class="day-schedule">
                      <h4>{{ dia.dia }}</h4>
                      <div class="time-slots">
                        <div *ngFor="let slot of dia.horarios" class="time-slot">
                          <div class="slot-time">{{ slot.hora }}</div>
                          <div class="slot-info">
                            <div class="slot-subject">{{ slot.materia }}</div>
                            <div class="slot-teacher">{{ slot.profesor }}</div>
                            <div class="slot-room">Aula {{ slot.aula }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="teachers-section">
                  <h3>Profesores</h3>
                  <div class="teachers-grid">
                    <mat-card *ngFor="let profesor of selectedChild.profesores" class="teacher-card">
                      <mat-card-header>
                        <div mat-card-avatar class="teacher-avatar">
                          <mat-icon>person</mat-icon>
                        </div>
                        <mat-card-title>{{ profesor.nombre }}</mat-card-title>
                        <mat-card-subtitle>
                          <mat-chip-listbox>
                            <mat-chip *ngFor="let materia of profesor.materias" color="primary">{{ materia }}</mat-chip>
                          </mat-chip-listbox>
                        </mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="teacher-contact">
                          <div class="contact-item">
                            <mat-icon>email</mat-icon>
                            <span>{{ profesor.email }}</span>
                          </div>
                          <div class="contact-item" *ngIf="profesor.telefono">
                            <mat-icon>phone</mat-icon>
                            <span>{{ profesor.telefono }}</span>
                          </div>
                        </div>
                      </mat-card-content>
                      <mat-card-actions>
                        <button mat-button (click)="contactTeacher(profesor)">
                          <mat-icon>message</mat-icon>
                          Contactar
                        </button>
                      </mat-card-actions>
                    </mat-card>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Settings Tab -->
            <mat-tab label="Configuración">
              <div class="tab-content">
                <div class="settings-sections">
                  <mat-expansion-panel class="settings-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>notifications</mat-icon>
                        Notificaciones
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    <div class="settings-content">
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Calificaciones</div>
                          <div class="setting-description">Recibir notificaciones sobre nuevas calificaciones</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.notificaciones.calificaciones" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Asistencia</div>
                          <div class="setting-description">Recibir notificaciones sobre asistencia y ausencias</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.notificaciones.asistencia" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Tareas</div>
                          <div class="setting-description">Recibir notificaciones sobre tareas y proyectos</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.notificaciones.tareas" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Comunicaciones</div>
                          <div class="setting-description">Recibir comunicaciones generales de la escuela</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.notificaciones.comunicaciones" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Eventos</div>
                          <div class="setting-description">Recibir notificaciones sobre eventos escolares</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.notificaciones.eventos" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                    </div>
                  </mat-expansion-panel>

                  <mat-expansion-panel class="settings-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>privacy_tip</mat-icon>
                        Privacidad
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    <div class="settings-content">
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Compartir Datos</div>
                          <div class="setting-description">Permitir que la escuela comparta datos académicos con terceros autorizados</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.privacidad.compartirDatos" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Directorio Escolar</div>
                          <div class="setting-description">Mostrar información de contacto en el directorio escolar</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.privacidad.mostrarEnDirectorio" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Fotografías</div>
                          <div class="setting-description">Permitir fotografías en eventos y actividades escolares</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.privacidad.permitirFotos" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                    </div>
                  </mat-expansion-panel>

                  <mat-expansion-panel class="settings-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>verified_user</mat-icon>
                        Permisos
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    <div class="settings-content">
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Retirarse Solo</div>
                          <div class="setting-description">Permitir que el estudiante se retire solo de la institución</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.permisos.retirarse" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Actividades Extracurriculares</div>
                          <div class="setting-description">Participar en actividades extracurriculares</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.permisos.actividadesExtracurriculares" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                      <div class="setting-item">
                        <div class="setting-info">
                          <div class="setting-title">Excursiones</div>
                          <div class="setting-description">Participar en excursiones y viajes educativos</div>
                        </div>
                        <mat-slide-toggle [(ngModel)]="selectedChild.configuracion.permisos.excursiones" (change)="updateSettings()">
                        </mat-slide-toggle>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </div>
              </div>
            </mat-tab>

            <!-- Documents Tab -->
            <mat-tab label="Documentos">
              <div class="tab-content">
                <div class="documents-header">
                  <h3>Documentos</h3>
                  <button mat-raised-button color="primary" (click)="uploadDocument()">
                    <mat-icon>upload</mat-icon>
                    Subir Documento
                  </button>
                </div>

                <div class="documents-list" *ngIf="selectedChild.documentos.length > 0">
                  <mat-card *ngFor="let documento of selectedChild.documentos" class="document-card">
                    <mat-card-header>
                      <div mat-card-avatar class="document-avatar">
                        <mat-icon>{{ getDocumentIcon(documento.tipo) }}</mat-icon>
                      </div>
                      <mat-card-title>{{ documento.nombre }}</mat-card-title>
                      <mat-card-subtitle>{{ documento.tipo }} - {{ documento.tamano }}</mat-card-subtitle>
                      <div class="document-actions">
                        <button mat-icon-button (click)="downloadDocument(documento)" matTooltip="Descargar">
                          <mat-icon>download</mat-icon>
                        </button>
                        <button mat-icon-button (click)="viewDocument(documento)" matTooltip="Ver">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button (click)="deleteDocument(documento.id)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="document-info">
                        <span class="document-date">Subido el {{ formatDate(documento.fecha) }}</span>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div *ngIf="selectedChild.documentos.length === 0" class="no-data">
                  <mat-icon>folder_open</mat-icon>
                  <p>No hay documentos subidos</p>
                  <button mat-raised-button color="primary" (click)="uploadDocument()">
                    Subir Primer Documento
                  </button>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- Empty State -->
        <div *ngIf="children.length === 0" class="no-children">
          <mat-icon>child_care</mat-icon>
          <h2>No hay hijos registrados</h2>
          <p>Agrega información sobre tus hijos para comenzar a usar el portal de padres.</p>
          <button mat-raised-button color="primary" (click)="addChild()">
            <mat-icon>add</mat-icon>
            Agregar Primer Hijo
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './children.scss'
})
export class ParentChildrenComponent implements OnInit, OnDestroy {
  isLoading = true;
  children: Child[] = [];
  selectedChildId: number | null = null;
  selectedChild: Child | null = null;
  activeTabIndex = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadChildrenData();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkRouteParams(): void {
    const childId = this.route.snapshot.params['id'];
    if (childId) {
      this.selectedChildId = parseInt(childId);
    }
  }

  private loadChildrenData(): void {
    this.isLoading = true;
    
    // Mock data - En producción esto vendría del backend
    setTimeout(() => {
      this.children = [
        {
          id: 1,
          nombre: 'Juan Carlos',
          apellido: 'Pérez González',
          fechaNacimiento: '2010-03-15',
          edad: 13,
          curso: '4to Año',
          division: 'A',
          legajo: 'A4001',
          foto: '',
          telefono: '11-5555-0001',
          email: 'juan.perez@email.com',
          direccion: 'Av. Corrientes 1234, Buenos Aires, Argentina',
          
          contactosEmergencia: [
            {
              id: 1,
              nombre: 'María González',
              relacion: 'Madre',
              telefono: '11-1234-5678',
              email: 'maria.gonzalez@email.com',
              esPrincipal: true
            },
            {
              id: 2,
              nombre: 'Carlos Pérez',
              relacion: 'Padre',
              telefono: '11-8765-4321',
              email: 'carlos.perez@email.com',
              esPrincipal: false
            },
            {
              id: 3,
              nombre: 'Ana Pérez',
              relacion: 'Abuela',
              telefono: '11-5555-1111',
              esPrincipal: false
            }
          ],
          
          informacionMedica: {
            grupoSanguineo: 'O+',
            alergias: ['Polen', 'Frutos secos'],
            medicamentos: ['Antihistamínico (según necesidad)'],
            condicionesMedicas: ['Asma leve'],
            medicoFamiliar: 'Dr. Roberto Martínez',
            telefonoMedico: '11-4444-5555',
            obraSocial: 'OSDE',
            numeroAfiliado: '12345678901',
            observaciones: 'Necesita inhalador en caso de crisis asmática. Evitar actividades físicas intensas en días de mucho viento.'
          },
          
          resumenAcademico: {
            promedioGeneral: 8.2,
            asistenciaPorcentaje: 92,
            tareasPendientes: 3,
            materias: [
              { id: 1, nombre: 'Matemática', profesor: 'Prof. García', promedio: 8.5, asistencia: 94, tareasPendientes: 1 },
              { id: 2, nombre: 'Lengua', profesor: 'Prof. Martínez', promedio: 7.8, asistencia: 90, tareasPendientes: 0 },
              { id: 3, nombre: 'Historia', profesor: 'Prof. López', promedio: 6.8, asistencia: 89, tareasPendientes: 2 },
              { id: 4, nombre: 'Ciencias', profesor: 'Prof. Rodríguez', promedio: 9.2, asistencia: 96, tareasPendientes: 0 },
              { id: 5, nombre: 'Inglés', profesor: 'Prof. Wilson', promedio: 8.0, asistencia: 91, tareasPendientes: 0 },
              { id: 6, nombre: 'Educación Física', profesor: 'Prof. Fernández', promedio: 9.0, asistencia: 88, tareasPendientes: 0 }
            ],
            proximosExamenes: [
              { id: 1, materia: 'Matemática', fecha: '2024-12-12', tipo: 'Parcial', descripcion: 'Ecuaciones de segundo grado' },
              { id: 2, materia: 'Historia', fecha: '2024-12-15', tipo: 'Oral', descripcion: 'Revolución Industrial' }
            ],
            ultimasCalificaciones: [
              { id: 1, materia: 'Ciencias', calificacion: 9.5, fecha: '2024-12-05', tipo: 'Examen', observaciones: 'Excelente comprensión del tema' },
              { id: 2, materia: 'Matemática', calificacion: 8.0, fecha: '2024-12-03', tipo: 'Tarea', observaciones: '' }
            ]
          },
          
          horario: [
            {
              dia: 'Lunes',
              horarios: [
                { hora: '08:00 - 08:45', materia: 'Matemática', profesor: 'Prof. García', aula: '201' },
                { hora: '08:45 - 09:30', materia: 'Lengua', profesor: 'Prof. Martínez', aula: '105' },
                { hora: '09:30 - 10:15', materia: 'Historia', profesor: 'Prof. López', aula: '302' },
                { hora: '10:30 - 11:15', materia: 'Ciencias', profesor: 'Prof. Rodríguez', aula: 'Lab 1' },
                { hora: '11:15 - 12:00', materia: 'Inglés', profesor: 'Prof. Wilson', aula: '110' }
              ]
            },
            {
              dia: 'Martes',
              horarios: [
                { hora: '08:00 - 08:45', materia: 'Ciencias', profesor: 'Prof. Rodríguez', aula: 'Lab 1' },
                { hora: '08:45 - 09:30', materia: 'Educación Física', profesor: 'Prof. Fernández', aula: 'Gimnasio' },
                { hora: '09:30 - 10:15', materia: 'Matemática', profesor: 'Prof. García', aula: '201' },
                { hora: '10:30 - 11:15', materia: 'Arte', profesor: 'Prof. Silva', aula: 'Taller' },
                { hora: '11:15 - 12:00', materia: 'Historia', profesor: 'Prof. López', aula: '302' }
              ]
            }
          ],
          
          profesores: [
            { id: 1, nombre: 'Prof. García', materias: ['Matemática'], email: 'garcia@escuela.edu', telefono: '11-2222-3333' },
            { id: 2, nombre: 'Prof. Martínez', materias: ['Lengua'], email: 'martinez@escuela.edu', telefono: '11-3333-4444' },
            { id: 3, nombre: 'Prof. López', materias: ['Historia'], email: 'lopez@escuela.edu' },
            { id: 4, nombre: 'Prof. Rodríguez', materias: ['Ciencias'], email: 'rodriguez@escuela.edu', telefono: '11-5555-6666' },
            { id: 5, nombre: 'Prof. Wilson', materias: ['Inglés'], email: 'wilson@escuela.edu' },
            { id: 6, nombre: 'Prof. Fernández', materias: ['Educación Física'], email: 'fernandez@escuela.edu' }
          ],
          
          configuracion: {
            notificaciones: {
              calificaciones: true,
              asistencia: true,
              tareas: true,
              comunicaciones: true,
              eventos: false
            },
            privacidad: {
              compartirDatos: false,
              mostrarEnDirectorio: true,
              permitirFotos: true
            },
            permisos: {
              retirarse: false,
              actividadesExtracurriculares: true,
              excursiones: true
            }
          },
          
          estadisticas: {
            asistenciaMensual: [
              { mes: 'Agosto', valor: 95 },
              { mes: 'Septiembre', valor: 92 },
              { mes: 'Octubre', valor: 88 },
              { mes: 'Noviembre', valor: 90 },
              { mes: 'Diciembre', valor: 93 }
            ],
            promedioMensual: [
              { mes: 'Agosto', valor: 8.0 },
              { mes: 'Septiembre', valor: 8.1 },
              { mes: 'Octubre', valor: 7.9 },
              { mes: 'Noviembre', valor: 8.3 },
              { mes: 'Diciembre', valor: 8.2 }
            ],
            comparativoGrado: {
              posicionEnGrado: 12,
              totalEstudiantes: 45,
              percentil: 73
            },
            tendencias: {
              academica: 'mejorando',
              asistencia: 'estable',
              comportamiento: 'estable'
            }
          },
          
          documentos: [
            { id: 1, nombre: 'Certificado de Nacimiento', tipo: 'PDF', fecha: '2024-01-15', tamano: '256 KB', url: '' },
            { id: 2, nombre: 'Ficha Médica', tipo: 'PDF', fecha: '2024-02-20', tamano: '512 KB', url: '' },
            { id: 3, nombre: 'Autorización Foto', tipo: 'PDF', fecha: '2024-03-01', tamano: '128 KB', url: '' }
          ]
        },
        {
          id: 2,
          nombre: 'María Elena',
          apellido: 'Pérez González',
          fechaNacimiento: '2012-07-22',
          edad: 11,
          curso: '2do Año',
          division: 'B',
          legajo: 'B2012',
          foto: '',
          telefono: '',
          email: '',
          direccion: 'Av. Corrientes 1234, Buenos Aires, Argentina',
          
          contactosEmergencia: [
            {
              id: 4,
              nombre: 'María González',
              relacion: 'Madre',
              telefono: '11-1234-5678',
              email: 'maria.gonzalez@email.com',
              esPrincipal: true
            },
            {
              id: 5,
              nombre: 'Carlos Pérez',
              relacion: 'Padre',
              telefono: '11-8765-4321',
              email: 'carlos.perez@email.com',
              esPrincipal: false
            }
          ],
          
          informacionMedica: {
            grupoSanguineo: 'A+',
            alergias: [],
            medicamentos: [],
            condicionesMedicas: [],
            medicoFamiliar: 'Dr. Roberto Martínez',
            telefonoMedico: '11-4444-5555',
            obraSocial: 'OSDE',
            numeroAfiliado: '12345678902'
          },
          
          resumenAcademico: {
            promedioGeneral: 8.9,
            asistenciaPorcentaje: 95,
            tareasPendientes: 1,
            materias: [
              { id: 7, nombre: 'Matemática', profesor: 'Prof. Silva', promedio: 9.0, asistencia: 96, tareasPendientes: 0 },
              { id: 8, nombre: 'Lengua', profesor: 'Prof. Fernández', promedio: 8.5, asistencia: 94, tareasPendientes: 1 },
              { id: 9, nombre: 'Historia', profesor: 'Prof. Díaz', promedio: 8.8, asistencia: 95, tareasPendientes: 0 },
              { id: 10, nombre: 'Ciencias', profesor: 'Prof. Moreno', promedio: 9.3, asistencia: 97, tareasPendientes: 0 }
            ],
            proximosExamenes: [
              { id: 3, materia: 'Lengua', fecha: '2024-12-14', tipo: 'Lectura', descripcion: 'Comprensión lectora' }
            ],
            ultimasCalificaciones: [
              { id: 3, materia: 'Matemática', calificacion: 9.2, fecha: '2024-12-04', tipo: 'Examen', observaciones: 'Muy buen desempeño' },
              { id: 4, materia: 'Ciencias', calificacion: 9.5, fecha: '2024-12-02', tipo: 'Proyecto', observaciones: 'Excelente presentación' }
            ]
          },
          
          horario: [
            {
              dia: 'Lunes',
              horarios: [
                { hora: '08:00 - 08:45', materia: 'Matemática', profesor: 'Prof. Silva', aula: '101' },
                { hora: '08:45 - 09:30', materia: 'Lengua', profesor: 'Prof. Fernández', aula: '102' },
                { hora: '09:30 - 10:15', materia: 'Historia', profesor: 'Prof. Díaz', aula: '103' },
                { hora: '10:30 - 11:15', materia: 'Ciencias', profesor: 'Prof. Moreno', aula: 'Lab 2' }
              ]
            }
          ],
          
          profesores: [
            { id: 7, nombre: 'Prof. Silva', materias: ['Matemática'], email: 'silva@escuela.edu', telefono: '11-7777-8888' },
            { id: 8, nombre: 'Prof. Fernández', materias: ['Lengua'], email: 'fernandez.lengua@escuela.edu' },
            { id: 9, nombre: 'Prof. Díaz', materias: ['Historia'], email: 'diaz@escuela.edu' },
            { id: 10, nombre: 'Prof. Moreno', materias: ['Ciencias'], email: 'moreno@escuela.edu', telefono: '11-9999-0000' }
          ],
          
          configuracion: {
            notificaciones: {
              calificaciones: true,
              asistencia: true,
              tareas: true,
              comunicaciones: true,
              eventos: true
            },
            privacidad: {
              compartirDatos: false,
              mostrarEnDirectorio: true,
              permitirFotos: true
            },
            permisos: {
              retirarse: false,
              actividadesExtracurriculares: true,
              excursiones: true
            }
          },
          
          estadisticas: {
            asistenciaMensual: [
              { mes: 'Agosto', valor: 97 },
              { mes: 'Septiembre', valor: 94 },
              { mes: 'Octubre', valor: 96 },
              { mes: 'Noviembre', valor: 95 },
              { mes: 'Diciembre', valor: 95 }
            ],
            promedioMensual: [
              { mes: 'Agosto', valor: 8.5 },
              { mes: 'Septiembre', valor: 8.7 },
              { mes: 'Octubre', valor: 8.8 },
              { mes: 'Noviembre', valor: 8.9 },
              { mes: 'Diciembre', valor: 8.9 }
            ],
            comparativoGrado: {
              posicionEnGrado: 3,
              totalEstudiantes: 38,
              percentil: 92
            },
            tendencias: {
              academica: 'mejorando',
              asistencia: 'estable',
              comportamiento: 'mejorando'
            }
          },
          
          documentos: [
            { id: 4, nombre: 'Certificado de Nacimiento', tipo: 'PDF', fecha: '2024-01-15', tamano: '256 KB', url: '' },
            { id: 5, nombre: 'Ficha Médica', tipo: 'PDF', fecha: '2024-02-20', tamano: '512 KB', url: '' }
          ]
        }
      ];

      // Auto-select first child or route param child
      if (this.children.length > 0) {
        if (this.selectedChildId) {
          const child = this.children.find(c => c.id === this.selectedChildId);
          if (child) {
            this.selectedChild = child;
          } else {
            this.selectChild(this.children[0].id);
          }
        } else {
          this.selectChild(this.children[0].id);
        }
      }

      this.isLoading = false;
    }, 1000);
  }

  selectChild(childId: number): void {
    this.selectedChildId = childId;
    this.selectedChild = this.children.find(child => child.id === childId) || null;
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }

  // Helper methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR');
  }

  getAttendanceColor(percentage: number): string {
    if (percentage >= 90) return 'primary';
    if (percentage >= 80) return 'accent';
    return 'warn';
  }

  getGradeClass(grade: number): string {
    if (grade >= 8) return 'excellent';
    if (grade >= 7) return 'good';
    if (grade >= 6) return 'satisfactory';
    return 'needs-improvement';
  }

  getProgressColor(grade: number): string {
    if (grade >= 8) return 'primary';
    if (grade >= 7) return 'accent';
    return 'warn';
  }

  getEventDay(fecha: string): string {
    return new Date(fecha).getDate().toString();
  }

  getEventMonth(fecha: string): string {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return months[new Date(fecha).getMonth()];
  }

  getDocumentIcon(tipo: string): string {
    switch (tipo.toLowerCase()) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'image';
      default: return 'insert_drive_file';
    }
  }

  // Action methods
  refreshData(): void {
    this.loadChildrenData();
  }

  addChild(): void {
    // Implement add child dialog
    this.snackBar.open('Funcionalidad de agregar hijo próximamente', 'Cerrar', { duration: 3000 });
  }

  editChild(): void {
    // Implement edit child dialog
    this.snackBar.open('Funcionalidad de edición próximamente', 'Cerrar', { duration: 3000 });
  }

  editBasicInfo(): void {
    this.snackBar.open('Editor de información básica próximamente', 'Cerrar', { duration: 3000 });
  }

  editContactInfo(): void {
    this.snackBar.open('Editor de información de contacto próximamente', 'Cerrar', { duration: 3000 });
  }

  editMedicalInfo(): void {
    this.snackBar.open('Editor de información médica próximamente', 'Cerrar', { duration: 3000 });
  }

  changeProfilePicture(): void {
    this.snackBar.open('Cambio de foto de perfil próximamente', 'Cerrar', { duration: 3000 });
  }

  downloadProfile(): void {
    this.snackBar.open('Descarga de perfil próximamente', 'Cerrar', { duration: 3000 });
  }

  viewFullProfile(): void {
    this.snackBar.open('Vista completa de perfil próximamente', 'Cerrar', { duration: 3000 });
  }

  addEmergencyContact(): void {
    this.snackBar.open('Agregar contacto de emergencia próximamente', 'Cerrar', { duration: 3000 });
  }

  editEmergencyContact(contact: EmergencyContact): void {
    this.snackBar.open('Editar contacto de emergencia próximamente', 'Cerrar', { duration: 3000 });
  }

  deleteEmergencyContact(contactId: number): void {
    if (confirm('¿Está seguro de que desea eliminar este contacto de emergencia?')) {
      if (this.selectedChild) {
        this.selectedChild.contactosEmergencia = this.selectedChild.contactosEmergencia.filter(c => c.id !== contactId);
        this.snackBar.open('Contacto eliminado exitosamente', 'Cerrar', { duration: 3000 });
      }
    }
  }

  contactTeacher(teacher: Teacher): void {
    this.snackBar.open(`Contactando a ${teacher.nombre}...`, 'Cerrar', { duration: 3000 });
  }

  updateSettings(): void {
    this.snackBar.open('Configuración actualizada', 'Cerrar', { duration: 2000 });
  }

  uploadDocument(): void {
    this.snackBar.open('Subida de documentos próximamente', 'Cerrar', { duration: 3000 });
  }

  downloadDocument(document: Document): void {
    this.snackBar.open(`Descargando ${document.nombre}...`, 'Cerrar', { duration: 3000 });
  }

  viewDocument(document: Document): void {
    this.snackBar.open(`Abriendo ${document.nombre}...`, 'Cerrar', { duration: 3000 });
  }

  deleteDocument(documentId: number): void {
    if (confirm('¿Está seguro de que desea eliminar este documento?')) {
      if (this.selectedChild) {
        this.selectedChild.documentos = this.selectedChild.documentos.filter(d => d.id !== documentId);
        this.snackBar.open('Documento eliminado exitosamente', 'Cerrar', { duration: 3000 });
      }
    }
  }
}