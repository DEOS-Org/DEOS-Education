import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';
import { Nota, TipoEvaluacion, PromedioAlumno } from '../models';

export const getDashboardData = async (professorId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Obtener estadísticas básicas
    const [statsResult] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT cdm.id) as total_clases,
        COUNT(DISTINCT u.id) as total_estudiantes,
        COUNT(DISTINCT n.id) as total_calificaciones,
        COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) as asistencias_presente,
        COUNT(DISTINCT a.id) as total_asistencias
      FROM curso_division_materia cdm
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id 
      INNER JOIN usuario prof ON h.profesor_usuario_id = prof.id
      LEFT JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
      LEFT JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id AND cdm.materia_id = n.materia_id
      LEFT JOIN asistencia a ON u.id = a.alumno_usuario_id AND cdm.curso_division_id = a.curso_division_id
      WHERE prof.id = ?
    `, { replacements: [professorId] });

    // Obtener clases recientes
    const [clasesRecientes] = await sequelize.query(`
      SELECT 
        cdm.id,
        m.nombre as materia,
        CONCAT(c.año, '° ', d.division) as curso_division,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        h.aula
      FROM curso_division_materia cdm
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN curso c ON cd.curso_id = c.id
      INNER JOIN division d ON cd.division_id = d.id
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      INNER JOIN usuario prof ON h.profesor_usuario_id = prof.id
      WHERE prof.id = ?
      ORDER BY 
        CASE h.dia 
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2 
          WHEN 'miercoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sabado' THEN 6
          ELSE 7
        END,
        h.hora_inicio
      LIMIT 5
    `, { replacements: [professorId] });

    // Obtener actividad reciente (calificaciones y asistencias)
    const [actividadReciente] = await sequelize.query(`
      SELECT 
        'calificacion' as tipo,
        CONCAT(u.nombre, ' ', u.apellido) as estudiante,
        m.nombre as materia,
        n.calificacion as detalle,
        n.fecha as fecha
      FROM nota n
      INNER JOIN usuario u ON n.alumno_usuario_id = u.id
      INNER JOIN materia m ON n.materia_id = m.id
      INNER JOIN curso_division_materia cdm ON m.id = cdm.materia_id
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      WHERE h.profesor_usuario_id = ?
      
      UNION ALL
      
      SELECT 
        'asistencia' as tipo,
        CONCAT(u.nombre, ' ', u.apellido) as estudiante,
        'Asistencia' as materia,
        a.estado as detalle,
        a.fecha as fecha
      FROM asistencia a
      INNER JOIN usuario u ON a.alumno_usuario_id = u.id
      INNER JOIN curso_division cd ON a.curso_division_id = cd.id
      INNER JOIN curso_division_materia cdm ON cd.id = cdm.curso_division_id
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      WHERE h.profesor_usuario_id = ?
      
      ORDER BY fecha DESC
      LIMIT 10
    `, { replacements: [professorId, professorId] });

    const stats = statsResult[0] || {};
    
    return {
      estadisticas: {
        totalClases: parseInt(stats.total_clases) || 0,
        totalEstudiantes: parseInt(stats.total_estudiantes) || 0,
        totalCalificaciones: parseInt(stats.total_calificaciones) || 0,
        porcentajeAsistencia: stats.total_asistencias > 0 
          ? Math.round((stats.asistencias_presente / stats.total_asistencias) * 100)
          : 0
      },
      clasesRecientes: clasesRecientes || [],
      actividadReciente: actividadReciente || []
    };
  } catch (error) {
    console.error('Error en getDashboardData:', error);
    throw new AppError('Error al obtener datos del dashboard', 500);
  }
};

export const getClasesAsignadas = async (professorId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [clases] = await sequelize.query(`
      SELECT 
        cdm.id,
        m.nombre as materia,
        CONCAT(c.año, '° ', d.division) as curso_division,
        c.año as curso,
        d.division,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        h.aula,
        COUNT(DISTINCT uc.usuario_id) as total_estudiantes
      FROM curso_division_materia cdm
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN curso c ON cd.curso_id = c.id
      INNER JOIN division d ON cd.division_id = d.id
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      LEFT JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      WHERE h.profesor_usuario_id = ?
      GROUP BY cdm.id, m.nombre, c.año, d.division, h.dia, h.hora_inicio, h.hora_fin, h.aula
      ORDER BY 
        CASE h.dia 
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2 
          WHEN 'miercoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sabado' THEN 6
          ELSE 7
        END,
        h.hora_inicio
    `, { replacements: [professorId] });

    return clases || [];
  } catch (error) {
    console.error('Error en getClasesAsignadas:', error);
    throw new AppError('Error al obtener clases asignadas', 500);
  }
};

export const getClaseDetail = async (claseId: number, professorId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [claseDetail] = await sequelize.query(`
      SELECT 
        cdm.id,
        m.nombre as materia,
        CONCAT(c.año, '° ', d.division) as curso_division,
        c.año as curso,
        d.division,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        h.aula,
        CONCAT(prof.nombre, ' ', prof.apellido) as profesor,
        COUNT(DISTINCT uc.usuario_id) as total_estudiantes
      FROM curso_division_materia cdm
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN curso c ON cd.curso_id = c.id
      INNER JOIN division d ON cd.division_id = d.id
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      INNER JOIN usuario prof ON h.profesor_usuario_id = prof.id
      LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      LEFT JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      WHERE cdm.id = ? ${professorId ? 'AND prof.id = ?' : ''}
      GROUP BY cdm.id, m.nombre, c.año, d.division, h.dia, h.hora_inicio, h.hora_fin, h.aula, prof.nombre, prof.apellido
    `, { 
      replacements: professorId ? [claseId, professorId] : [claseId]
    });

    if (!claseDetail.length) {
      throw new AppError('Clase no encontrada o no tienes permisos', 404);
    }

    return claseDetail[0];
  } catch (error) {
    console.error('Error en getClaseDetail:', error);
    throw new AppError('Error al obtener detalle de la clase', 500);
  }
};

export const getEstudiantesByClase = async (claseId: number, professorId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar que el profesor tiene acceso a esta clase
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM curso_division_materia cdm
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE cdm.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [claseId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para acceder a esta clase', 403);
      }
    }

    const [estudiantes] = await sequelize.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.dni,
        u.email,
        u.telefono,
        uc.fecha_inscripcion,
        COALESCE(AVG(n.calificacion), 0) as promedio,
        COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) as asistencias_presente,
        COUNT(DISTINCT a.id) as total_asistencias,
        CASE 
          WHEN COUNT(DISTINCT a.id) > 0 
          THEN ROUND((COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) * 100.0 / COUNT(DISTINCT a.id)), 2)
          ELSE 0 
        END as porcentaje_asistencia
      FROM curso_division_materia cdm
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      INNER JOIN usuario u ON uc.usuario_id = u.id
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id AND cdm.materia_id = n.materia_id
      LEFT JOIN asistencia a ON u.id = a.alumno_usuario_id AND cd.id = a.curso_division_id
      WHERE cdm.id = ? AND u.rol_id = 4
      GROUP BY u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono, uc.fecha_inscripcion
      ORDER BY u.apellido, u.nombre
    `, { replacements: [claseId] });

    return estudiantes || [];
  } catch (error) {
    console.error('Error en getEstudiantesByClase:', error);
    throw new AppError('Error al obtener estudiantes de la clase', 500);
  }
};

export const getEstudianteDetail = async (estudianteId: number, professorId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [estudianteDetail] = await sequelize.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.dni,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        CONCAT(c.año, '° ', d.division) as curso_division
      FROM usuario u
      INNER JOIN usuario_curso uc ON u.id = uc.usuario_id
      INNER JOIN curso_division cd ON uc.curso_division_id = cd.id
      INNER JOIN curso c ON cd.curso_id = c.id
      INNER JOIN division d ON cd.division_id = d.id
      WHERE u.id = ? AND u.rol_id = 4
    `, { replacements: [estudianteId] });

    if (!estudianteDetail.length) {
      throw new AppError('Estudiante no encontrado', 404);
    }

    return estudianteDetail[0];
  } catch (error) {
    console.error('Error en getEstudianteDetail:', error);
    throw new AppError('Error al obtener detalle del estudiante', 500);
  }
};

export const getAsistenciaByClase = async (
  claseId: number, 
  professorId?: number, 
  fechaDesde?: string, 
  fechaHasta?: string
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar acceso
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM curso_division_materia cdm
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE cdm.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [claseId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para acceder a esta clase', 403);
      }
    }

    let fechaFilter = '';
    const replacements = [claseId];
    
    if (fechaDesde && fechaHasta) {
      fechaFilter = 'AND a.fecha BETWEEN ? AND ?';
      replacements.push(fechaDesde, fechaHasta);
    } else if (fechaDesde) {
      fechaFilter = 'AND a.fecha >= ?';
      replacements.push(fechaDesde);
    } else if (fechaHasta) {
      fechaFilter = 'AND a.fecha <= ?';
      replacements.push(fechaHasta);
    }

    const [asistencia] = await sequelize.query(`
      SELECT 
        a.id,
        a.fecha,
        a.estado,
        a.observaciones,
        u.id as estudiante_id,
        CONCAT(u.nombre, ' ', u.apellido) as estudiante_nombre,
        u.dni as estudiante_dni
      FROM curso_division_materia cdm
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      INNER JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      LEFT JOIN asistencia a ON u.id = a.alumno_usuario_id AND cd.id = a.curso_division_id
      WHERE cdm.id = ? ${fechaFilter}
      ORDER BY a.fecha DESC, u.apellido, u.nombre
    `, { replacements });

    return asistencia || [];
  } catch (error) {
    console.error('Error en getAsistenciaByClase:', error);
    throw new AppError('Error al obtener asistencia de la clase', 500);
  }
};

export const registrarAsistencia = async (data: {
  claseId: number;
  estudianteId: number;
  professorId?: number;
  fecha: string;
  estado: string;
  observaciones?: string;
}) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar acceso y obtener curso_division_id
    const [claseInfo] = await sequelize.query(`
      SELECT cdm.curso_division_id
      FROM curso_division_materia cdm
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      WHERE cdm.id = ? ${data.professorId ? 'AND h.profesor_usuario_id = ?' : ''}
    `, { 
      replacements: data.professorId ? [data.claseId, data.professorId] : [data.claseId]
    });

    if (!claseInfo.length) {
      throw new AppError('Clase no encontrada o sin permisos', 404);
    }

    const cursoDivisionId = claseInfo[0].curso_division_id;

    // Verificar si ya existe un registro para esta fecha
    const [existingRecord] = await sequelize.query(`
      SELECT id FROM asistencia 
      WHERE alumno_usuario_id = ? AND curso_division_id = ? AND fecha = ?
    `, { replacements: [data.estudianteId, cursoDivisionId, data.fecha] });

    if (existingRecord.length) {
      // Actualizar registro existente
      await sequelize.query(`
        UPDATE asistencia 
        SET estado = ?, observaciones = ?, updated_at = NOW()
        WHERE id = ?
      `, { replacements: [data.estado, data.observaciones, existingRecord[0].id] });

      return { id: existingRecord[0].id, ...data };
    } else {
      // Crear nuevo registro
      const [result] = await sequelize.query(`
        INSERT INTO asistencia (alumno_usuario_id, curso_division_id, fecha, estado, observaciones, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, { replacements: [data.estudianteId, cursoDivisionId, data.fecha, data.estado, data.observaciones] });

      return { id: result.insertId, ...data };
    }
  } catch (error) {
    console.error('Error en registrarAsistencia:', error);
    throw new AppError('Error al registrar asistencia', 500);
  }
};

export const updateAsistencia = async (
  asistenciaId: number, 
  professorId?: number, 
  data: { estado?: string; observaciones?: string }
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar permisos si es necesario
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM asistencia a
        INNER JOIN curso_division cd ON a.curso_division_id = cd.id
        INNER JOIN curso_division_materia cdm ON cd.id = cdm.curso_division_id
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE a.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [asistenciaId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para modificar esta asistencia', 403);
      }
    }

    await sequelize.query(`
      UPDATE asistencia 
      SET estado = COALESCE(?, estado), 
          observaciones = COALESCE(?, observaciones),
          updated_at = NOW()
      WHERE id = ?
    `, { replacements: [data.estado, data.observaciones, asistenciaId] });

    return { id: asistenciaId, ...data };
  } catch (error) {
    console.error('Error en updateAsistencia:', error);
    throw new AppError('Error al actualizar asistencia', 500);
  }
};

export const getCalificacionesByClase = async (
  claseId: number, 
  professorId?: number, 
  periodo?: string
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar acceso
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM curso_division_materia cdm
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE cdm.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [claseId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para acceder a esta clase', 403);
      }
    }

    let periodoFilter = '';
    const replacements = [claseId];
    
    if (periodo) {
      periodoFilter = 'AND te.nombre = ?';
      replacements.push(periodo);
    }

    const [calificaciones] = await sequelize.query(`
      SELECT 
        n.id,
        n.calificacion,
        n.fecha,
        n.observaciones,
        u.id as estudiante_id,
        CONCAT(u.nombre, ' ', u.apellido) as estudiante_nombre,
        u.dni as estudiante_dni,
        te.nombre as tipo_evaluacion,
        te.descripcion as tipo_descripcion
      FROM curso_division_materia cdm
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      INNER JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id AND m.id = n.materia_id
      LEFT JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE cdm.id = ? ${periodoFilter}
      ORDER BY n.fecha DESC, u.apellido, u.nombre
    `, { replacements });

    return calificaciones || [];
  } catch (error) {
    console.error('Error en getCalificacionesByClase:', error);
    throw new AppError('Error al obtener calificaciones de la clase', 500);
  }
};

export const crearCalificacion = async (data: {
  claseId: number;
  estudianteId: number;
  professorId?: number;
  tipo_evaluacion_id: number;
  calificacion: number;
  fecha: string;
  observaciones?: string;
}) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar acceso y obtener materia_id
    const [claseInfo] = await sequelize.query(`
      SELECT cdm.materia_id
      FROM curso_division_materia cdm
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      WHERE cdm.id = ? ${data.professorId ? 'AND h.profesor_usuario_id = ?' : ''}
    `, { 
      replacements: data.professorId ? [data.claseId, data.professorId] : [data.claseId]
    });

    if (!claseInfo.length) {
      throw new AppError('Clase no encontrada o sin permisos', 404);
    }

    const materiaId = claseInfo[0].materia_id;

    // Crear calificación
    const [result] = await sequelize.query(`
      INSERT INTO nota (alumno_usuario_id, materia_id, tipo_evaluacion_id, calificacion, fecha, observaciones, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, { 
      replacements: [
        data.estudianteId, 
        materiaId, 
        data.tipo_evaluacion_id, 
        data.calificacion, 
        data.fecha, 
        data.observaciones
      ] 
    });

    return { id: result.insertId, ...data };
  } catch (error) {
    console.error('Error en crearCalificacion:', error);
    throw new AppError('Error al crear calificación', 500);
  }
};

export const updateCalificacion = async (
  calificacionId: number, 
  professorId?: number, 
  data: { calificacion?: number; observaciones?: string }
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar permisos si es necesario
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM nota n
        INNER JOIN materia m ON n.materia_id = m.id
        INNER JOIN curso_division_materia cdm ON m.id = cdm.materia_id
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE n.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [calificacionId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para modificar esta calificación', 403);
      }
    }

    await sequelize.query(`
      UPDATE nota 
      SET calificacion = COALESCE(?, calificacion), 
          observaciones = COALESCE(?, observaciones),
          updated_at = NOW()
      WHERE id = ?
    `, { replacements: [data.calificacion, data.observaciones, calificacionId] });

    return { id: calificacionId, ...data };
  } catch (error) {
    console.error('Error en updateCalificacion:', error);
    throw new AppError('Error al actualizar calificación', 500);
  }
};

export const deleteCalificacion = async (calificacionId: number, professorId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar permisos si es necesario
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM nota n
        INNER JOIN materia m ON n.materia_id = m.id
        INNER JOIN curso_division_materia cdm ON m.id = cdm.materia_id
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE n.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [calificacionId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para eliminar esta calificación', 403);
      }
    }

    await sequelize.query(`DELETE FROM nota WHERE id = ?`, { replacements: [calificacionId] });
    
    return { message: 'Calificación eliminada exitosamente' };
  } catch (error) {
    console.error('Error en deleteCalificacion:', error);
    throw new AppError('Error al eliminar calificación', 500);
  }
};

export const getHorarios = async (professorId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [horarios] = await sequelize.query(`
      SELECT 
        h.id,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        h.aula,
        m.nombre as materia,
        CONCAT(c.año, '° ', d.division) as curso_division
      FROM horario h
      INNER JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN curso c ON cd.curso_id = c.id
      INNER JOIN division d ON cd.division_id = d.id
      WHERE h.profesor_usuario_id = ?
      ORDER BY 
        CASE h.dia 
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2 
          WHEN 'miercoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sabado' THEN 6
          ELSE 7
        END,
        h.hora_inicio
    `, { replacements: [professorId] });

    return horarios || [];
  } catch (error) {
    console.error('Error en getHorarios:', error);
    throw new AppError('Error al obtener horarios', 500);
  }
};

export const getReporteAsistencia = async (
  claseId: number, 
  professorId?: number, 
  fechaDesde?: string, 
  fechaHasta?: string
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar acceso
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM curso_division_materia cdm
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE cdm.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [claseId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para acceder a esta clase', 403);
      }
    }

    let fechaFilter = '';
    const replacements = [claseId];
    
    if (fechaDesde && fechaHasta) {
      fechaFilter = 'AND a.fecha BETWEEN ? AND ?';
      replacements.push(fechaDesde, fechaHasta);
    }

    const [reporte] = await sequelize.query(`
      SELECT 
        u.id as estudiante_id,
        CONCAT(u.nombre, ' ', u.apellido) as estudiante_nombre,
        u.dni,
        COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) as presente,
        COUNT(DISTINCT CASE WHEN a.estado = 'ausente' THEN a.id END) as ausente,
        COUNT(DISTINCT CASE WHEN a.estado = 'tardanza' THEN a.id END) as tardanza,
        COUNT(DISTINCT a.id) as total_dias,
        CASE 
          WHEN COUNT(DISTINCT a.id) > 0 
          THEN ROUND((COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) * 100.0 / COUNT(DISTINCT a.id)), 2)
          ELSE 0 
        END as porcentaje_asistencia
      FROM curso_division_materia cdm
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      INNER JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      LEFT JOIN asistencia a ON u.id = a.alumno_usuario_id AND cd.id = a.curso_division_id ${fechaFilter}
      WHERE cdm.id = ?
      GROUP BY u.id, u.nombre, u.apellido, u.dni
      ORDER BY u.apellido, u.nombre
    `, { replacements });

    return reporte || [];
  } catch (error) {
    console.error('Error en getReporteAsistencia:', error);
    throw new AppError('Error al generar reporte de asistencia', 500);
  }
};

export const getReporteCalificaciones = async (
  claseId: number, 
  professorId?: number, 
  periodo?: string
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar acceso
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM curso_division_materia cdm
        INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
        WHERE cdm.id = ? AND h.profesor_usuario_id = ?
      `, { replacements: [claseId, professorId] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para acceder a esta clase', 403);
      }
    }

    let periodoFilter = '';
    const replacements = [claseId];
    
    if (periodo) {
      periodoFilter = 'AND te.nombre = ?';
      replacements.push(periodo);
    }

    const [reporte] = await sequelize.query(`
      SELECT 
        u.id as estudiante_id,
        CONCAT(u.nombre, ' ', u.apellido) as estudiante_nombre,
        u.dni,
        COALESCE(AVG(n.calificacion), 0) as promedio,
        COUNT(n.id) as total_calificaciones,
        MIN(n.calificacion) as nota_minima,
        MAX(n.calificacion) as nota_maxima
      FROM curso_division_materia cdm
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      INNER JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id AND m.id = n.materia_id
      LEFT JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE cdm.id = ? ${periodoFilter}
      GROUP BY u.id, u.nombre, u.apellido, u.dni
      ORDER BY promedio DESC, u.apellido, u.nombre
    `, { replacements });

    return reporte || [];
  } catch (error) {
    console.error('Error en getReporteCalificaciones:', error);
    throw new AppError('Error al generar reporte de calificaciones', 500);
  }
};

export const getReporteEstudiante = async (
  estudianteId: number, 
  professorId?: number, 
  periodo?: string
) => {
  const { sequelize } = require('../models/db');
  
  try {
    let periodoFilter = '';
    const replacements = [estudianteId];
    
    if (periodo) {
      periodoFilter = 'AND te.nombre = ?';
      replacements.push(periodo);
    }

    const [reporte] = await sequelize.query(`
      SELECT 
        u.id,
        CONCAT(u.nombre, ' ', u.apellido) as nombre,
        u.dni,
        m.nombre as materia,
        COALESCE(AVG(n.calificacion), 0) as promedio,
        COUNT(n.id) as total_calificaciones,
        COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) as asistencias_presente,
        COUNT(DISTINCT a.id) as total_asistencias,
        CASE 
          WHEN COUNT(DISTINCT a.id) > 0 
          THEN ROUND((COUNT(DISTINCT CASE WHEN a.estado = 'presente' THEN a.id END) * 100.0 / COUNT(DISTINCT a.id)), 2)
          ELSE 0 
        END as porcentaje_asistencia
      FROM usuario u
      INNER JOIN usuario_curso uc ON u.id = uc.usuario_id
      INNER JOIN curso_division cd ON uc.curso_division_id = cd.id
      INNER JOIN curso_division_materia cdm ON cd.id = cdm.curso_division_id
      INNER JOIN materia m ON cdm.materia_id = m.id
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id AND m.id = n.materia_id
      LEFT JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      LEFT JOIN asistencia a ON u.id = a.alumno_usuario_id AND cd.id = a.curso_division_id
      WHERE u.id = ? AND u.rol_id = 4 ${periodoFilter}
      GROUP BY u.id, u.nombre, u.apellido, u.dni, m.id, m.nombre
      ORDER BY m.nombre
    `, { replacements });

    return reporte || [];
  } catch (error) {
    console.error('Error en getReporteEstudiante:', error);
    throw new AppError('Error al generar reporte del estudiante', 500);
  }
};

export const getConfiguracion = async (professorId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [config] = await sequelize.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        COALESCE(cs.notificaciones_email, true) as notificaciones,
        COALESCE(cs.tema, 'claro') as tema,
        COALESCE(cs.idioma, 'es') as idioma
      FROM usuario u
      LEFT JOIN configuracion_sistema cs ON u.id = cs.usuario_id
      WHERE u.id = ?
    `, { replacements: [professorId] });

    return config[0] || {
      id: professorId,
      notificaciones: true,
      tema: 'claro',
      idioma: 'es'
    };
  } catch (error) {
    console.error('Error en getConfiguracion:', error);
    throw new AppError('Error al obtener configuración', 500);
  }
};

export const updateConfiguracion = async (
  professorId: number, 
  data: { notificaciones?: boolean; tema?: string; idioma?: string }
) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar si existe configuración
    const [existing] = await sequelize.query(`
      SELECT id FROM configuracion_sistema WHERE usuario_id = ?
    `, { replacements: [professorId] });

    if (existing.length) {
      // Actualizar
      await sequelize.query(`
        UPDATE configuracion_sistema 
        SET notificaciones_email = COALESCE(?, notificaciones_email),
            tema = COALESCE(?, tema),
            idioma = COALESCE(?, idioma),
            updated_at = NOW()
        WHERE usuario_id = ?
      `, { replacements: [data.notificaciones, data.tema, data.idioma, professorId] });
    } else {
      // Crear
      await sequelize.query(`
        INSERT INTO configuracion_sistema (usuario_id, notificaciones_email, tema, idioma, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, { replacements: [professorId, data.notificaciones, data.tema, data.idioma] });
    }

    return { professorId, ...data };
  } catch (error) {
    console.error('Error en updateConfiguracion:', error);
    throw new AppError('Error al actualizar configuración', 500);
  }
};

export const getTiposEvaluacion = async () => {
  const { sequelize } = require('../models/db');
  
  try {
    const [tipos] = await sequelize.query(`
      SELECT id, nombre, descripcion 
      FROM tipo_evaluacion 
      ORDER BY nombre
    `);

    return tipos || [];
  } catch (error) {
    console.error('Error en getTiposEvaluacion:', error);
    throw new AppError('Error al obtener tipos de evaluación', 500);
  }
};

// ===== NUEVAS FUNCIONES PARA SISTEMA AVANZADO DE CALIFICACIONES =====

export const crearNotaAvanzada = async (data: {
  alumno_usuario_id: number;
  materia_id: number;
  tipo_evaluacion_id: number;
  calificacion: number;
  observaciones?: string;
  trimestre?: number;
  fecha?: Date;
}, professorId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar permisos del profesor
    if (professorId) {
      const [access] = await sequelize.query(`
        SELECT 1 FROM profesor_materia pm
        WHERE pm.usuario_id = ? AND pm.materia_id = ?
      `, { replacements: [professorId, data.materia_id] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para calificar en esta materia', 403);
      }
    }

    // Crear la nota usando el modelo Sequelize
    const nota = await Nota.create({
      alumno_usuario_id: data.alumno_usuario_id,
      materia_id: data.materia_id,
      tipo_evaluacion_id: data.tipo_evaluacion_id,
      calificacion: data.calificacion,
      observaciones: data.observaciones,
      trimestre: data.trimestre || 1,
      fecha: data.fecha || new Date()
    });

    // Actualizar promedios automáticamente
    await PromedioAlumno.actualizarPromedios(
      data.alumno_usuario_id,
      data.materia_id,
      data.trimestre || 1
    );

    return nota;
  } catch (error) {
    console.error('Error en crearNotaAvanzada:', error);
    throw new AppError('Error al crear la calificación', 500);
  }
};

export const updateNotaAvanzada = async (
  notaId: number,
  data: Partial<{
    calificacion: number;
    observaciones: string;
    trimestre: number;
    fecha: Date;
  }>,
  professorId?: number
) => {
  try {
    const nota = await Nota.findByPk(notaId, {
      include: [
        { model: require('../models').Usuario, as: 'alumno' },
        { model: require('../models').Materia, as: 'materia' }
      ]
    });

    if (!nota) {
      throw new AppError('Calificación no encontrada', 404);
    }

    // Verificar permisos
    if (professorId) {
      const { sequelize } = require('../models/db');
      const [access] = await sequelize.query(`
        SELECT 1 FROM profesor_materia pm
        WHERE pm.usuario_id = ? AND pm.materia_id = ?
      `, { replacements: [professorId, nota.materia_id] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para modificar esta calificación', 403);
      }
    }

    // Actualizar la nota
    await nota.update(data);

    // Recalcular promedios
    await PromedioAlumno.actualizarPromedios(
      nota.alumno_usuario_id,
      nota.materia_id,
      nota.trimestre
    );

    return nota;
  } catch (error) {
    console.error('Error en updateNotaAvanzada:', error);
    throw new AppError('Error al actualizar la calificación', 500);
  }
};

export const deleteNotaAvanzada = async (notaId: number, professorId?: number) => {
  try {
    const nota = await Nota.findByPk(notaId);

    if (!nota) {
      throw new AppError('Calificación no encontrada', 404);
    }

    // Verificar permisos
    if (professorId) {
      const { sequelize } = require('../models/db');
      const [access] = await sequelize.query(`
        SELECT 1 FROM profesor_materia pm
        WHERE pm.usuario_id = ? AND pm.materia_id = ?
      `, { replacements: [professorId, nota.materia_id] });
      
      if (!access.length) {
        throw new AppError('No tienes permisos para eliminar esta calificación', 403);
      }
    }

    const alumnoId = nota.alumno_usuario_id;
    const materiaId = nota.materia_id;
    const trimestre = nota.trimestre;

    // Eliminar la nota
    await nota.destroy();

    // Recalcular promedios
    await PromedioAlumno.actualizarPromedios(alumnoId, materiaId, trimestre);

    return { success: true };
  } catch (error) {
    console.error('Error en deleteNotaAvanzada:', error);
    throw new AppError('Error al eliminar la calificación', 500);
  }
};

export const calcularPromediosClase = async (claseId: number, trimestre?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const whereClause = trimestre ? 'AND n.trimestre = ?' : '';
    const replacements = trimestre ? [claseId, trimestre] : [claseId];

    const [promedios] = await sequelize.query(`
      SELECT 
        u.id as alumno_id,
        CONCAT(u.nombre, ' ', u.apellido) as alumno_nombre,
        u.dni,
        m.id as materia_id,
        m.nombre as materia_nombre,
        COUNT(n.id) as cantidad_notas,
        ROUND(AVG(n.calificacion), 2) as promedio,
        CASE 
          WHEN AVG(n.calificacion) >= 7 THEN 'Aprobado'
          WHEN AVG(n.calificacion) >= 4 THEN 'Pendiente'
          ELSE 'Desaprobado'
        END as estado
      FROM curso_division_materia cdm
      INNER JOIN materia m ON cdm.materia_id = m.id
      INNER JOIN curso_division cd ON cdm.curso_division_id = cd.id
      INNER JOIN usuario_curso uc ON cd.id = uc.curso_division_id
      INNER JOIN usuario u ON uc.usuario_id = u.id AND u.rol_id = 4
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id AND m.id = n.materia_id ${whereClause}
      WHERE cdm.id = ?
      GROUP BY u.id, u.nombre, u.apellido, u.dni, m.id, m.nombre
      ORDER BY u.apellido, u.nombre
    `, { replacements });

    return promedios || [];
  } catch (error) {
    console.error('Error en calcularPromediosClase:', error);
    throw new AppError('Error al calcular promedios de la clase', 500);
  }
};

export const generarBoletinEstudiante = async (estudianteId: number, trimestre?: number) => {
  try {
    const boletin = await PromedioAlumno.obtenerBoletinCompleto(estudianteId, trimestre);
    
    if (!boletin.alumno) {
      throw new AppError('Estudiante no encontrado', 404);
    }

    return boletin;
  } catch (error) {
    console.error('Error en generarBoletinEstudiante:', error);
    throw new AppError('Error al generar el boletín del estudiante', 500);
  }
};

export const obtenerEstadisticasCalificaciones = async (professorId: number, claseId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    let whereClause = '';
    let replacements = [professorId];

    if (claseId) {
      whereClause = 'AND cdm.id = ?';
      replacements.push(claseId);
    }

    const [estadisticas] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT n.id) as total_notas,
        COUNT(DISTINCT n.alumno_usuario_id) as estudiantes_calificados,
        ROUND(AVG(n.calificacion), 2) as promedio_general,
        COUNT(CASE WHEN n.calificacion >= 7 THEN 1 END) as aprobados,
        COUNT(CASE WHEN n.calificacion < 4 THEN 1 END) as desaprobados,
        COUNT(CASE WHEN n.calificacion BETWEEN 4 AND 6.99 THEN 1 END) as pendientes,
        MAX(n.calificacion) as nota_maxima,
        MIN(n.calificacion) as nota_minima
      FROM curso_division_materia cdm
      INNER JOIN horario h ON cdm.id = h.curso_division_materia_id
      INNER JOIN materia m ON cdm.materia_id = m.id
      LEFT JOIN nota n ON m.id = n.materia_id
      WHERE h.profesor_usuario_id = ? ${whereClause}
    `, { replacements });

    return estadisticas[0] || {};
  } catch (error) {
    console.error('Error en obtenerEstadisticasCalificaciones:', error);
    throw new AppError('Error al obtener estadísticas de calificaciones', 500);
  }
};

export const obtenerHistorialNotas = async (estudianteId: number, materiaId?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    let whereClause = 'WHERE n.alumno_usuario_id = ?';
    let replacements = [estudianteId];

    if (materiaId) {
      whereClause += ' AND n.materia_id = ?';
      replacements.push(materiaId);
    }

    const [historial] = await sequelize.query(`
      SELECT 
        n.id,
        n.calificacion,
        n.concepto,
        n.fecha,
        n.observaciones,
        n.trimestre,
        m.nombre as materia_nombre,
        te.nombre as tipo_evaluacion,
        te.descripcion as tipo_descripcion,
        CONCAT(prof.nombre, ' ', prof.apellido) as profesor_nombre
      FROM nota n
      INNER JOIN materia m ON n.materia_id = m.id
      INNER JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      LEFT JOIN profesor_materia pm ON m.id = pm.materia_id
      LEFT JOIN usuario prof ON pm.usuario_id = prof.id
      ${whereClause}
      ORDER BY n.fecha DESC, m.nombre, n.trimestre
    `, { replacements });

    return historial || [];
  } catch (error) {
    console.error('Error en obtenerHistorialNotas:', error);
    throw new AppError('Error al obtener historial de notas', 500);
  }
};