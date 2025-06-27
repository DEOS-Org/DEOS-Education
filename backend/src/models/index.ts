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
import ConfiguracionSistema from './ConfiguracionSistema';
import Notificacion from './Notificacion';
import Comunicado from './Comunicado';
import Sancion from './Sancion';
import ComunicadoLectura from './ComunicadoLectura';
import GrupoChat from './GrupoChat';
import GrupoChatMiembro from './GrupoChatMiembro';
import Mensaje from './Mensaje';
import MensajeEstado from './MensajeEstado';
import Asistencia from './Asistencia';
import Calificacion from './Calificacion';

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
export type { ConfiguracionSistemaInstance } from './ConfiguracionSistema';
export type { NotificacionInstance } from './Notificacion';
export type { ComunicadoInstance } from './Comunicado';
export type { SancionInstance } from './Sancion';
export type { ComunicadoLecturaInstance } from './ComunicadoLectura';
export type { GrupoChatInstance } from './GrupoChat';
export type { GrupoChatMiembroInstance } from './GrupoChatMiembro';
export type { MensajeInstance } from './Mensaje';
export type { MensajeEstadoInstance } from './MensajeEstado';
export type { AsistenciaInstance } from './Asistencia';
export type { CalificacionInstance } from './Calificacion';

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

// Relaciones directas para CursoDivisionMateria
CursoDivisionMateria.belongsTo(Materia, { foreignKey: 'materia_id' });
CursoDivisionMateria.belongsTo(CursoDivision, { foreignKey: 'curso_division_id' });
Materia.hasMany(CursoDivisionMateria, { foreignKey: 'materia_id' });
CursoDivision.hasMany(CursoDivisionMateria, { foreignKey: 'curso_division_id' });

// Relaciones básicas para funcionalidad mínima
Usuario.hasMany(Horario, { foreignKey: 'profesor_usuario_id', as: 'HorariosProfesor' });
Horario.belongsTo(Usuario, { foreignKey: 'profesor_usuario_id', as: 'Profesor' });
CursoDivisionMateria.hasMany(Horario, { foreignKey: 'curso_division_materia_id', as: 'Horarios' });
Horario.belongsTo(CursoDivisionMateria, { foreignKey: 'curso_division_materia_id', as: 'CursoDivisionMateria' });

// Relaciones para Log
Usuario.hasMany(Log, { foreignKey: 'usuario_id', as: 'Logs' });
Log.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones para Notificaciones
Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'Notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones para Comunicados
Usuario.hasMany(Comunicado, { foreignKey: 'usuario_creador_id', as: 'ComunicadosCreados' });
Comunicado.belongsTo(Usuario, { foreignKey: 'usuario_creador_id', as: 'UsuarioCreador' });
CursoDivision.hasMany(Comunicado, { foreignKey: 'curso_division_id', as: 'Comunicados' });
Comunicado.belongsTo(CursoDivision, { foreignKey: 'curso_division_id', as: 'CursoDivision' });

// Relaciones para Sanciones
Usuario.hasMany(Sancion, { foreignKey: 'usuario_id', as: 'Sanciones' });
Sancion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'UsuarioSancionado' });
Usuario.hasMany(Sancion, { foreignKey: 'usuario_sancionador_id', as: 'SancionesAplicadas' });
Sancion.belongsTo(Usuario, { foreignKey: 'usuario_sancionador_id', as: 'UsuarioSancionador' });
CursoDivision.hasMany(Sancion, { foreignKey: 'curso_division_id', as: 'Sanciones' });
Sancion.belongsTo(CursoDivision, { foreignKey: 'curso_division_id', as: 'CursoDivision' });

// Relaciones para ComunicadoLectura
Comunicado.hasMany(ComunicadoLectura, { foreignKey: 'comunicado_id', as: 'Lecturas' });
ComunicadoLectura.belongsTo(Comunicado, { foreignKey: 'comunicado_id', as: 'Comunicado' });
Usuario.hasMany(ComunicadoLectura, { foreignKey: 'usuario_id', as: 'LecturasComunicados' });
ComunicadoLectura.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones para GrupoChat
Usuario.hasMany(GrupoChat, { foreignKey: 'usuario_creador_id', as: 'GruposCreados' });
GrupoChat.belongsTo(Usuario, { foreignKey: 'usuario_creador_id', as: 'UsuarioCreador' });
CursoDivisionMateria.hasMany(GrupoChat, { foreignKey: 'curso_division_materia_id', as: 'GruposChat' });
GrupoChat.belongsTo(CursoDivisionMateria, { foreignKey: 'curso_division_materia_id', as: 'CursoDivisionMateria' });
CursoDivision.hasMany(GrupoChat, { foreignKey: 'curso_division_id', as: 'GruposChat' });
GrupoChat.belongsTo(CursoDivision, { foreignKey: 'curso_division_id', as: 'CursoDivision' });

// Relaciones para GrupoChatMiembro
GrupoChat.hasMany(GrupoChatMiembro, { foreignKey: 'grupo_chat_id', as: 'Miembros' });
GrupoChatMiembro.belongsTo(GrupoChat, { foreignKey: 'grupo_chat_id', as: 'GrupoChat' });
Usuario.hasMany(GrupoChatMiembro, { foreignKey: 'usuario_id', as: 'GruposMiembro' });
GrupoChatMiembro.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones para Mensaje
Usuario.hasMany(Mensaje, { foreignKey: 'usuario_emisor_id', as: 'MensajesEnviados' });
Mensaje.belongsTo(Usuario, { foreignKey: 'usuario_emisor_id', as: 'UsuarioEmisor' });
Usuario.hasMany(Mensaje, { foreignKey: 'usuario_receptor_id', as: 'MensajesRecibidos' });
Mensaje.belongsTo(Usuario, { foreignKey: 'usuario_receptor_id', as: 'UsuarioReceptor' });
GrupoChat.hasMany(Mensaje, { foreignKey: 'grupo_chat_id', as: 'Mensajes' });
Mensaje.belongsTo(GrupoChat, { foreignKey: 'grupo_chat_id', as: 'GrupoChat' });
Mensaje.hasMany(Mensaje, { foreignKey: 'mensaje_padre_id', as: 'Respuestas' });
Mensaje.belongsTo(Mensaje, { foreignKey: 'mensaje_padre_id', as: 'MensajePadre' });

// Relaciones para MensajeEstado
Mensaje.hasMany(MensajeEstado, { foreignKey: 'mensaje_id', as: 'Estados' });
MensajeEstado.belongsTo(Mensaje, { foreignKey: 'mensaje_id', as: 'Mensaje' });
Usuario.hasMany(MensajeEstado, { foreignKey: 'usuario_id', as: 'EstadosMensajes' });
MensajeEstado.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

// Relaciones para Asistencia
Usuario.hasMany(Asistencia, { foreignKey: 'usuario_id', as: 'AsistenciasEstudiante' });
Asistencia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Estudiante' });
Usuario.hasMany(Asistencia, { foreignKey: 'profesor_usuario_id', as: 'AsistenciasProfesor' });
Asistencia.belongsTo(Usuario, { foreignKey: 'profesor_usuario_id', as: 'Profesor' });
CursoDivisionMateria.hasMany(Asistencia, { foreignKey: 'curso_division_materia_id', as: 'Asistencias' });
Asistencia.belongsTo(CursoDivisionMateria, { foreignKey: 'curso_division_materia_id', as: 'CursoDivisionMateria' });

// Relaciones para Calificacion
Usuario.hasMany(Calificacion, { foreignKey: 'usuario_id', as: 'CalificacionesEstudiante' });
Calificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Estudiante' });
Usuario.hasMany(Calificacion, { foreignKey: 'profesor_usuario_id', as: 'CalificacionesProfesor' });
Calificacion.belongsTo(Usuario, { foreignKey: 'profesor_usuario_id', as: 'Profesor' });
CursoDivisionMateria.hasMany(Calificacion, { foreignKey: 'curso_division_materia_id', as: 'Calificaciones' });
Calificacion.belongsTo(CursoDivisionMateria, { foreignKey: 'curso_division_materia_id', as: 'CursoDivisionMateria' });

// Relaciones para UsuarioCurso
Usuario.hasMany(UsuarioCurso, { foreignKey: 'usuario_id', as: 'UsuarioCursos' });
UsuarioCurso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });
CursoDivision.hasMany(UsuarioCurso, { foreignKey: 'curso_division_id', as: 'UsuarioCursos' });
UsuarioCurso.belongsTo(CursoDivision, { foreignKey: 'curso_division_id', as: 'CursoDivision' });

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
  Log,
  ConfiguracionSistema,
  Notificacion,
  Comunicado,
  Sancion,
  ComunicadoLectura,
  GrupoChat,
  GrupoChatMiembro,
  Mensaje,
  MensajeEstado,
  Asistencia,
  Calificacion
};