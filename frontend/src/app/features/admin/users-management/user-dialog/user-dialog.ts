import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../../core/services/user';
import { RoleService } from '../../../../core/services/role';

export interface UserDialogData {
  user?: any;
  isEdit: boolean;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.isEdit ? 'edit' : 'person_add' }}</mat-icon>
      {{ data.isEdit ? 'Editar Usuario' : 'Nuevo Usuario' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        
        <!-- DNI -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>DNI</mat-label>
          <input matInput formControlName="dni" placeholder="Ej: 12345678">
          <mat-error *ngIf="userForm.get('dni')?.hasError('required')">
            DNI es requerido
          </mat-error>
          <mat-error *ngIf="userForm.get('dni')?.hasError('pattern')">
            DNI debe contener solo números
          </mat-error>
        </mat-form-field>

        <!-- Nombre -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Juan">
          <mat-error *ngIf="userForm.get('nombre')?.hasError('required')">
            Nombre es requerido
          </mat-error>
        </mat-form-field>

        <!-- Apellido -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="apellido" placeholder="Ej: Pérez">
          <mat-error *ngIf="userForm.get('apellido')?.hasError('required')">
            Apellido es requerido
          </mat-error>
        </mat-form-field>

        <!-- Email -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="usuario@ejemplo.com">
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">
            Email es requerido
          </mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">
            Email no válido
          </mat-error>
        </mat-form-field>

        <!-- Contraseña (solo para nuevos usuarios) -->
        <mat-form-field appearance="outline" class="full-width" *ngIf="!data.isEdit">
          <mat-label>Contraseña</mat-label>
          <input matInput formControlName="contraseña" type="password" placeholder="Mínimo 6 caracteres">
          <mat-error *ngIf="userForm.get('contraseña')?.hasError('required')">
            Contraseña es requerida
          </mat-error>
          <mat-error *ngIf="userForm.get('contraseña')?.hasError('minlength')">
            Contraseña debe tener mínimo 6 caracteres
          </mat-error>
        </mat-form-field>

        <!-- Confirmar Contraseña (solo para nuevos usuarios) -->
        <mat-form-field appearance="outline" class="full-width" *ngIf="!data.isEdit">
          <mat-label>Confirmar Contraseña</mat-label>
          <input matInput formControlName="confirmarContraseña" type="password" placeholder="Repita la contraseña">
          <mat-error *ngIf="userForm.get('confirmarContraseña')?.hasError('required')">
            Confirmación de contraseña es requerida
          </mat-error>
          <mat-error *ngIf="userForm.hasError('passwordMismatch')">
            Las contraseñas no coinciden
          </mat-error>
        </mat-form-field>

        <!-- Roles -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Roles</mat-label>
          <mat-select formControlName="roles" multiple>
            <mat-option *ngFor="let role of availableRoles" [value]="role.value">
              {{ role.viewValue }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="userForm.get('roles')?.hasError('required')">
            Debe seleccionar al menos un rol
          </mat-error>
        </mat-form-field>

        <!-- Usuario Activo -->
        <div class="checkbox-container">
          <mat-checkbox formControlName="activo">
            Usuario activo
          </mat-checkbox>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isLoading">
        Cancelar
      </button>
      <button mat-raised-button color="primary" 
              (click)="onSave()" 
              [disabled]="userForm.invalid || isLoading">
        <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
        {{ data.isEdit ? 'Actualizar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      max-width: 500px;
    }

    .full-width {
      width: 100%;
    }

    .checkbox-container {
      margin: 16px 0;
    }

    mat-dialog-content {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 20px;
      gap: 8px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 20px 20px 0;
    }
  `]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  isLoading = false;
  availableRoles = [
    { value: 'admin', viewValue: 'Administrador' },
    { value: 'profesor', viewValue: 'Profesor' },
    { value: 'alumno', viewValue: 'Alumno' },
    { value: 'padre', viewValue: 'Padre/Tutor' },
    { value: 'preceptor', viewValue: 'Preceptor' },
    { value: 'directivo', viewValue: 'Directivo' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    if (this.data.isEdit && this.data.user) {
      this.populateForm();
    }
  }

  private createForm(): FormGroup {
    const baseForm: any = {
      dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roles: [[], Validators.required],
      activo: [true]
    };

    // Solo agregar campos de contraseña para nuevos usuarios
    if (!this.data.isEdit) {
      baseForm.contraseña = ['', [Validators.required, Validators.minLength(6)]];
      baseForm.confirmarContraseña = ['', Validators.required];
    }

    const form = this.fb.group(baseForm);

    // Validador personalizado para confirmar contraseña
    if (!this.data.isEdit) {
      form.setValidators(this.passwordMatchValidator.bind(this));
    }

    return form;
  }

  private passwordMatchValidator(form: any) {
    const password = form.get('contraseña');
    const confirmPassword = form.get('confirmarContraseña');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private populateForm() {
    if (this.data.user) {
      this.userForm.patchValue({
        dni: this.data.user.dni,
        nombre: this.data.user.nombre,
        apellido: this.data.user.apellido,
        email: this.data.user.email,
        roles: this.data.user.roles || [],
        activo: this.data.user.activo !== false
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.userForm.valid) {
      this.isLoading = true;
      
      const formData = { ...this.userForm.value };
      
      // Remover confirmarContraseña del objeto a enviar
      if (formData.confirmarContraseña) {
        delete formData.confirmarContraseña;
      }

      const operation = this.data.isEdit 
        ? this.userService.updateUser(this.data.user.id, formData)
        : this.userService.createUser(formData);

      operation.subscribe({
        next: (result) => {
          this.isLoading = false;
          this.snackBar.open(
            this.data.isEdit ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
            'Cerrar',
            { duration: 3000 }
          );
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving user:', error);
          this.snackBar.open(
            error.error?.message || 'Error al guardar el usuario',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
    }
  }
}