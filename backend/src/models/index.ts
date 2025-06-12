import { sequelize } from './db';
import Usuario from './Usuario';
import Rol from './Rol';
import UsuarioRol from './UsuarioRol';
import AlumnoPadre from './AlumnoPadre';
import Curso from './Curso';
import Division from './Division';
import CursoDivision from './CursoDivision';
import Materia from './Materia';
import CursoDivisionMateria from './CursoDivisionMateria';
import ProfesorMateria from './ProfesorMateria';
import UsuarioCurso from './UsuarioCurso';
import DispositivoFichaje from './DispositivoFichaje';
import Huella from './Huella';
import Registro from './Registro';
import Horario from './Horario';
import Log from './Log';

// Re-exportar las interfaces
export type { UsuarioInstance } from './Usuario';
export type { RolInstance } from './Rol';
export type { UsuarioRolInstance } from './UsuarioRol';
export type { CursoInstance } from './Curso';
export type { DivisionInstance } from './Division';
export type { CursoDivisionInstance } from './CursoDivision';
export type { MateriaInstance } from './Materia';
export type { CursoDivisionMateriaInstance } from './CursoDivisionMateria';
export type { ProfesorMateriaInstance } from './ProfesorMateria';
export type { UsuarioCursoInstance } from './UsuarioCurso';
export type { DispositivoFichajeInstance } from './DispositivoFichaje';
export type { HuellaInstance } from './Huella';
export type { RegistroInstance } from './Registro';
export type { HorarioInstance } from './Horario';
export type { LogInstance } from './Log';

// Re-exportar enums y tipos
export { TipoRegistro, TipoLog, DiaSemana } from './types';

// Establecer relaciones Usuario-Rol
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: 'usuario_id',
  otherKey: 'rol_id'
});

Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: 'rol_id',
  otherKey: 'usuario_id'
});

// Relaciones Alumno-Padre
Usuario.belongsToMany(Usuario, {
  through: AlumnoPadre,
  as: 'AlumnoRelaciones',
  foreignKey: 'alumno_usuario_id',
  otherKey: 'padre_usuario_id'
});

Usuario.belongsToMany(Usuario, {
  through: AlumnoPadre,
  as: 'PadreRelaciones',
  foreignKey: 'padre_usuario_id',
  otherKey: 'alumno_usuario_id'
});

// Relaciones Curso-División
Curso.belongsToMany(Division, {
  through: CursoDivision,
  foreignKey: 'curso_id',
  otherKey: 'division_id'
});

Division.belongsToMany(Curso, {
  through: CursoDivision,
  foreignKey: 'division_id',
  otherKey: 'curso_id'
});

// Relaciones directas para CursoDivision
CursoDivision.belongsTo(Curso, { foreignKey: 'curso_id' });
CursoDivision.belongsTo(Division, { foreignKey: 'division_id' });
Curso.hasMany(CursoDivision, { foreignKey: 'curso_id' });
Division.hasMany(CursoDivision, { foreignKey: 'division_id' });

// Relaciones CursoDivision-Materia
CursoDivision.belongsToMany(Materia, {
  through: CursoDivisionMateria,
  foreignKey: 'curso_division_id',
  otherKey: 'materia_id'
});

Materia.belongsToMany(CursoDivision, {
  through: CursoDivisionMateria,
  foreignKey: 'materia_id',
  otherKey: 'curso_division_id'
});

// Relaciones básicas sin conflictos
// Comentadas temporalmente las relaciones complejas para evitar conflictos de alias

// Relaciones para Huella
Usuario.hasOne(Huella, { foreignKey: 'usuario_id', as: 'Huella' });
Huella.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones para Registro
Usuario.hasMany(Registro, { foreignKey: 'usuario_id', as: 'Registros' });
Registro.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });
DispositivoFichaje.hasMany(Registro, { foreignKey: 'dispositivo_fichaje_id', as: 'RegistrosDispositivo' });
Registro.belongsTo(DispositivoFichaje, { foreignKey: 'dispositivo_fichaje_id', as: 'DispositivoFichaje' });

// Relaciones ProfesorMateria
ProfesorMateria.belongsTo(Usuario, { foreignKey: 'usuario_id' });
ProfesorMateria.belongsTo(Materia, { foreignKey: 'materia_id' });
Usuario.hasMany(ProfesorMateria, { foreignKey: 'usuario_id' });
Materia.hasMany(ProfesorMateria, { foreignKey: 'materia_id' });

// Relaciones básicas para funcionalidad mínima
Usuario.hasMany(Horario, { foreignKey: 'profesor_usuario_id', as: 'HorariosProfesor' });
Horario.belongsTo(Usuario, { foreignKey: 'profesor_usuario_id', as: 'Profesor' });

// Relaciones para Log
Usuario.hasMany(Log, { foreignKey: 'usuario_id', as: 'Logs' });
Log.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

export {
  sequelize,
  Usuario,
  Rol,
  UsuarioRol,
  AlumnoPadre,
  Curso,
  Division,
  CursoDivision,
  Materia,
  CursoDivisionMateria,
  ProfesorMateria,
  UsuarioCurso,
  DispositivoFichaje,
  Huella,
  Registro,
  Horario,
  Log
};