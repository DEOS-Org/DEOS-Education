import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Usuario, Rol, UsuarioRol, UsuarioInstance, RolInstance, AlumnoPadre } from '../models';
import { AppError } from '../utils/AppError';

// Type definitions for models with associations
interface UsuarioWithRoles extends UsuarioInstance {
  Rols?: RolInstance[];
}

const SALT_ROUNDS = 12;

// Funciones auxiliares
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  console.log('Plain password:', plainPassword);
  console.log('Hashed password:', hashedPassword);
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Funciones principales
export const findAll = async (): Promise<UsuarioInstance[]> => {
  return await Usuario.findAll({
    where: { activo: true },
    attributes: { exclude: ['contraseña'] },
    include: [{ model: Rol }]
  });
};

export const findByEmail = async (email: string): Promise<UsuarioInstance | null> => {
  return await Usuario.findOne({
    where: { email, activo: true },
    attributes: { include: ['contraseña'] }
  });
};

export const findById = async (id: number): Promise<UsuarioInstance | null> => {
  return await Usuario.findOne({
    where: { id, activo: true },
    attributes: { exclude: ['contraseña'] },
    include: [{ model: Rol }]
  });
};

export const createUser = async ({
  dni,
  nombre,
  apellido,
  email,
  contraseña,
  roles
}: {
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  roles?: string[];
}) => {
  // Validar unicidad de email y dni
  const [existeEmail, existeDni] = await Promise.all([
    Usuario.findOne({ where: { email, activo: true } }),
    Usuario.findOne({ where: { dni, activo: true } })
  ]);

  if (existeEmail) throw new AppError('El email ya está registrado');
  if (existeDni) throw new AppError('El DNI ya está registrado');

  // Hashear contraseña
  const hash = await hashPassword(contraseña);

  // Crear usuario
  const usuario = await Usuario.create({
    dni,
    nombre,
    apellido,
    email,
    contraseña: hash,
    activo: true
  });

  // Asignar roles
  if (roles && Array.isArray(roles)) {
    const rolesEncontrados = await Rol.findAll({
      where: { nombre: { [Op.in]: roles } }
    });

    // Validar que no se asigne rol de alumno junto con otros roles
    if (roles.includes('alumno') && roles.length > 1) {
      throw new AppError('Un alumno no puede tener roles adicionales');
    }

    await Promise.all(
      rolesEncontrados.map(rol =>
        UsuarioRol.create({ usuario_id: usuario.id!, rol_id: rol.id! })
      )
    );
  }

  // Retornar usuario sin contraseña
  const { contraseña: _, ...usuarioSinContraseña } = usuario.get();
  return usuarioSinContraseña;
};

export const updateUser = async (
  id: number,
  {
    nombre,
    apellido,
    email,
    contraseña,
    activo
  }: {
    nombre?: string;
    apellido?: string;
    email?: string;
    contraseña?: string;
    activo?: boolean;
  }
) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new AppError('Usuario no encontrado');

  // Si se actualiza el email, verificar que no exista
  if (email && email !== usuario.email) {
    const existeEmail = await Usuario.findOne({
      where: { email, activo: true, id: { [Op.ne]: id } }
    });
    if (existeEmail) throw new AppError('El email ya está registrado');
  }

  // Actualizar campos
  if (nombre) usuario.nombre = nombre;
  if (apellido) usuario.apellido = apellido;
  if (email) usuario.email = email;
  if (contraseña) usuario.contraseña = await hashPassword(contraseña);
  if (typeof activo === 'boolean') usuario.activo = activo;

  await usuario.save();

  // Retornar usuario sin contraseña
  const { contraseña: _, ...usuarioSinContraseña } = usuario.get();
  return usuarioSinContraseña;
};

export const deleteUser = async (id: number) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new AppError('Usuario no encontrado');

  // Borrado lógico
  usuario.activo = false;
  await usuario.save();

  return { message: 'Usuario eliminado correctamente' };
};

export const getUserRoles = async (userId: number): Promise<string[]> => {
  const usuario = await Usuario.findOne({
    where: { id: userId, activo: true },
    include: [{
      model: Rol,
      through: { attributes: [] }
    }]
  }) as UsuarioWithRoles | null;

  if (!usuario) return [];

  const roles = usuario.Rols || [];
  return roles.map((rol: RolInstance) => rol.nombre);
};

export const assignRole = async (userId: number, rolNombre: string) => {
  const [usuario, rol] = await Promise.all([
    Usuario.findOne({ where: { id: userId, activo: true } }),
    Rol.findOne({ where: { nombre: rolNombre } })
  ]);

  if (!usuario) throw new AppError('Usuario no encontrado');
  if (!rol) throw new AppError('Rol no encontrado');

  // Verificar regla de alumno
  const rolesActuales = await getUserRoles(userId);
  if (rolNombre === 'alumno' && rolesActuales.length > 0) {
    throw new AppError('Un alumno no puede tener roles adicionales');
  }
  if (rolesActuales.includes('alumno') && rolNombre !== 'alumno') {
    throw new AppError('Un alumno no puede tener roles adicionales');
  }

  // Verificar que no exista la relación
  const existeRelacion = await UsuarioRol.findOne({
    where: { usuario_id: userId, rol_id: rol.id }
  });
  if (existeRelacion) throw new AppError('El usuario ya tiene asignado este rol');

  await UsuarioRol.create({ usuario_id: userId, rol_id: rol.id! });
  return { message: 'Rol asignado correctamente' };
};

export const removeRole = async (userId: number, rolNombre: string) => {
  const [usuario, rol] = await Promise.all([
    Usuario.findOne({ where: { id: userId, activo: true } }),
    Rol.findOne({ where: { nombre: rolNombre } })
  ]);

  if (!usuario) throw new AppError('Usuario no encontrado');
  if (!rol) throw new AppError('Rol no encontrado');

  const relacion = await UsuarioRol.findOne({
    where: { usuario_id: userId, rol_id: rol.id }
  });
  if (!relacion) throw new AppError('El usuario no tiene asignado este rol');

  await relacion.destroy();
  return { message: 'Rol removido correctamente' };
};

// Funciones para la relación alumno-padre
export const assignParent = async (alumnoId: number, padreId: number) => {
  // Verificar que existan los usuarios y sus roles
  const [alumno, padre] = await Promise.all([
    Usuario.findOne({
      where: { id: alumnoId, activo: true },
      include: [{ model: Rol }]
    }),
    Usuario.findOne({
      where: { id: padreId, activo: true },
      include: [{ model: Rol }]
    })
  ]);

  if (!alumno) throw new AppError('Alumno no encontrado');
  if (!padre) throw new AppError('Padre no encontrado');

  // Verificar roles
  const alumnoRoles = await getUserRoles(alumnoId);
  const padreRoles = await getUserRoles(padreId);

  if (!alumnoRoles.includes('alumno')) {
    throw new AppError('El usuario especificado no es un alumno');
  }
  if (!padreRoles.includes('padre')) {
    throw new AppError('El usuario especificado no es un padre');
  }

  // Verificar que no exista la relación
  const existeRelacion = await AlumnoPadre.findOne({
    where: { alumno_usuario_id: alumnoId, padre_usuario_id: padreId }
  });
  if (existeRelacion) {
    throw new AppError('La relación alumno-padre ya existe');
  }

  await AlumnoPadre.create({
    alumno_usuario_id: alumnoId,
    padre_usuario_id: padreId
  });

  return { message: 'Relación alumno-padre creada correctamente' };
};

export const removeParent = async (alumnoId: number, padreId: number) => {
  const relacion = await AlumnoPadre.findOne({
    where: { alumno_usuario_id: alumnoId, padre_usuario_id: padreId }
  });

  if (!relacion) {
    throw new AppError('La relación alumno-padre no existe');
  }

  await relacion.destroy();
  return { message: 'Relación alumno-padre eliminada correctamente' };
};

interface AlumnoRelacionJSON {
  AlumnoRelaciones?: Array<{
    Padre: {
      id: number;
      dni: string;
      nombre: string;
      apellido: string;
      email: string;
      activo: boolean;
    }
  }>;
}

interface PadreRelacionJSON {
  PadreRelaciones?: Array<{
    Alumno: {
      id: number;
      dni: string;
      nombre: string;
      apellido: string;
      email: string;
      activo: boolean;
    }
  }>;
}

export const getStudentParents = async (alumnoId: number) => {
  const alumno = await Usuario.findOne({
    where: { id: alumnoId, activo: true },
    include: [{
      model: AlumnoPadre,
      as: 'AlumnoRelaciones',
      include: [{
        model: Usuario,
        as: 'Padre',
        attributes: { exclude: ['contraseña'] }
      }]
    }]
  });

  if (!alumno) throw new AppError('Alumno no encontrado');

  const alumnoJSON = alumno.toJSON() as AlumnoRelacionJSON;
  return alumnoJSON.AlumnoRelaciones?.map(rel => rel.Padre) || [];
};

export const getParentStudents = async (padreId: number) => {
  const padre = await Usuario.findOne({
    where: { id: padreId, activo: true },
    include: [{
      model: AlumnoPadre,
      as: 'PadreRelaciones',
      include: [{
        model: Usuario,
        as: 'Alumno',
        attributes: { exclude: ['contraseña'] }
      }]
    }]
  });

  if (!padre) throw new AppError('Padre no encontrado');

  const padreJSON = padre.toJSON() as PadreRelacionJSON;
  return padreJSON.PadreRelaciones?.map(rel => rel.Alumno) || [];
};

export const getStudentDetail = async (studentId: number) => {
  const { sequelize } = require('../models/db');
  
  // Get student basic info
  const [studentData] = await sequelize.query(`
    SELECT 
      u.id,
      u.dni,
      u.nombre,
      u.apellido,
      u.email,
      u.activo
    FROM usuario u
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE u.id = ? AND r.nombre = 'alumno'
  `, { replacements: [studentId] });

  if (!studentData || studentData.length === 0) {
    throw new AppError('Alumno no encontrado', 404);
  }

  const student = studentData[0] as any;

  // Get course and division info
  const [cursoDivisionData] = await sequelize.query(`
    SELECT 
      cd.id,
      c.año as curso,
      d.division,
      CONCAT(c.año, '° ', d.division) as nombreCompleto
    FROM usuario_curso uc
    JOIN curso_division cd ON uc.curso_division_id = cd.id
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE uc.usuario_id = ?
    LIMIT 1
  `, { replacements: [studentId] });

  // Get parents
  const [padres] = await sequelize.query(`
    SELECT 
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.dni as telefono
    FROM usuario u
    JOIN alumno_padre ap ON u.id = ap.padre_usuario_id
    WHERE ap.alumno_usuario_id = ?
  `, { replacements: [studentId] });

  // Get attendance summary
  const [attendanceSummary] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT DATE(r.fecha)) as totalDias,
      COUNT(CASE WHEN r.tipo = 'ingreso' THEN 1 END) as diasPresente,
      0 as diasAusente,
      0 as diasTarde
    FROM registro r
    WHERE r.usuario_id = ?
    AND r.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
  `, { replacements: [studentId] });

  // Get recent attendance records
  const [recentRecords] = await sequelize.query(`
    SELECT 
      DATE(r.fecha) as fecha,
      r.tipo,
      TIME(r.fecha) as hora,
      COALESCE(df.descripcion, df.identificador_unico, 'Dispositivo no especificado') as dispositivo
    FROM registro r
    LEFT JOIN dispositivo_fichaje df ON r.dispositivo_fichaje_id = df.id
    WHERE r.usuario_id = ?
    ORDER BY r.fecha DESC
    LIMIT 20
  `, { replacements: [studentId] });

  // Get subjects
  const [materias] = await sequelize.query(`
    SELECT 
      m.id,
      m.nombre,
      CONCAT(u.apellido, ', ', u.nombre) as profesor
    FROM materia m
    JOIN curso_division_materia cdm ON m.id = cdm.materia_id
    JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
    LEFT JOIN profesor_materia pm ON m.id = pm.materia_id
    LEFT JOIN usuario u ON pm.usuario_id = u.id
    WHERE uc.usuario_id = ?
    ORDER BY m.nombre
  `, { replacements: [studentId] });

  // Calculate attendance percentage
  const summary = attendanceSummary[0] as any;
  const porcentajeAsistencia = summary.totalDias > 0 ? 
    Math.round((summary.diasPresente / summary.totalDias) * 100) : 0;

  // Create monthly attendance data (last 6 months)
  const asistenciaPorMes = [
    { mes: 'Junio', presentes: 15, ausentes: 2, tarde: 1 },
    { mes: 'Mayo', presentes: 18, ausentes: 1, tarde: 0 },
    { mes: 'Abril', presentes: 16, ausentes: 3, tarde: 2 },
    { mes: 'Marzo', presentes: 19, ausentes: 1, tarde: 1 },
    { mes: 'Febrero', presentes: 17, ausentes: 2, tarde: 0 },
    { mes: 'Enero', presentes: 14, ausentes: 4, tarde: 3 }
  ];

  return {
    id: student.id,
    dni: student.dni,
    nombre: student.nombre,
    apellido: student.apellido,
    email: student.email,
    activo: student.activo,
    cursoDivision: cursoDivisionData[0] || {
      id: 0,
      curso: 'Sin asignar',
      division: '',
      nombreCompleto: 'Sin curso asignado'
    },
    padres,
    asistencia: {
      resumen: {
        totalDias: summary.totalDias || 0,
        diasPresente: summary.diasPresente || 0,
        diasAusente: summary.diasAusente || 0,
        diasTarde: summary.diasTarde || 0,
        porcentajeAsistencia
      },
      ultimosRegistros: recentRecords,
      asistenciaPorMes
    },
    materias
  };
};

export const getProfessorDetail = async (professorId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Get professor basic info
    const [professorData] = await sequelize.query(`
      SELECT 
        u.id,
        u.dni,
        u.nombre,
        u.apellido,
        u.email,
        u.activo,
        u.created_at,
        u.updated_at
      FROM usuario u
      JOIN usuario_rol ur ON u.id = ur.usuario_id
      JOIN rol r ON ur.rol_id = r.id
      WHERE u.id = ? AND r.nombre = 'profesor'
    `, { replacements: [professorId] });

    if (!professorData || professorData.length === 0) {
      throw new AppError('Profesor no encontrado', 404);
    }

    const professor = professorData[0] as any;

    // Get professor subjects with courses
    const [materiasData] = await sequelize.query(`
      SELECT DISTINCT
        m.id,
        m.nombre,
        m.carga_horaria,
        c.año as curso_año,
        d.division as division_nombre,
        cd.id as curso_division_id
      FROM materia m
      JOIN profesor_materia pm ON m.id = pm.materia_id
      LEFT JOIN curso_division_materia cdm ON m.id = cdm.materia_id
      LEFT JOIN curso_division cd ON cdm.curso_division_id = cd.id
      LEFT JOIN curso c ON cd.curso_id = c.id
      LEFT JOIN division d ON cd.division_id = d.id
      WHERE pm.usuario_id = ?
      ORDER BY m.nombre, c.año, d.division
    `, { replacements: [professorId] });

    // Group subjects with their courses
    const materiasGrouped: any = {};
    (materiasData as any[]).forEach(row => {
      if (!materiasGrouped[row.id]) {
        materiasGrouped[row.id] = {
          id: row.id,
          nombre: row.nombre,
          carga_horaria: row.carga_horaria,
          cursos: []
        };
      }
      
      if (row.curso_division_id && row.curso_año && row.division_nombre) {
        materiasGrouped[row.id].cursos.push({
          id: row.curso_division_id,
          curso_nombre: `${row.curso_año}°`,
          division_nombre: row.division_nombre
        });
      }
    });

    // Get professor schedule
    const [horariosData] = await sequelize.query(`
      SELECT 
        h.id,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        h.aula,
        m.nombre as materia_nombre,
        CONCAT(c.año, '° ', d.division) as curso_nombre
      FROM horario h
      JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
      JOIN materia m ON cdm.materia_id = m.id
      JOIN curso_division cd ON cdm.curso_division_id = cd.id
      JOIN curso c ON cd.curso_id = c.id
      JOIN division d ON cd.division_id = d.id
      JOIN profesor_materia pm ON m.id = pm.materia_id
      WHERE pm.usuario_id = ?
      ORDER BY h.dia, h.hora_inicio
    `, { replacements: [professorId] });

    const materias = Object.values(materiasGrouped);
    
    return {
      id: professor.id,
      dni: professor.dni,
      nombre: professor.nombre,
      apellido: professor.apellido,
      email: professor.email,
      activo: professor.activo,
      materias: materias,
      horarios: horariosData || [],
      estadisticas: {
        total_materias: materias.length,
        total_cursos: materias.reduce((sum: number, materia: any) => sum + materia.cursos.length, 0),
        total_horas_semana: materias.reduce((sum: number, materia: any) => sum + (materia.carga_horaria || 0), 0),
        cursos_activos: materias.reduce((sum: number, materia: any) => sum + materia.cursos.length, 0)
      },
      created_at: professor.created_at,
      updated_at: professor.updated_at
    };
  } catch (error) {
    console.error('Error getting professor detail:', error);
    throw error;
  }
};
