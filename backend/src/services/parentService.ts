import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';
import { Nota, TipoEvaluacion, PromedioAlumno } from '../models';

export const obtenerHijos = async (parentId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [hijos] = await sequelize.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.dni,
        u.email,
        u.telefono,
        CONCAT(c.año, '° ', d.division) as curso_division,
        cd.id as curso_division_id
      FROM usuario u
      INNER JOIN alumno_padre ap ON u.id = ap.alumno_usuario_id
      LEFT JOIN usuario_curso uc ON u.id = uc.usuario_id
      LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
      LEFT JOIN curso c ON cd.curso_id = c.id
      LEFT JOIN division d ON cd.division_id = d.id
      WHERE ap.padre_usuario_id = ? AND u.rol_id = 4
      ORDER BY u.apellido, u.nombre
    `, { replacements: [parentId] });

    return hijos || [];
  } catch (error) {
    console.error('Error en obtenerHijos:', error);
    throw new AppError('Error al obtener información de los hijos', 500);
  }
};

export const obtenerCalificacionesHijo = async (parentId: number, hijoId: number, materiaId?: number, trimestre?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar relación padre-hijo
    const [relacion] = await sequelize.query(`
      SELECT 1 FROM alumno_padre ap
      WHERE ap.padre_usuario_id = ? AND ap.alumno_usuario_id = ?
    `, { replacements: [parentId, hijoId] });

    if (!relacion.length) {
      throw new AppError('No tienes permisos para acceder a las calificaciones de este estudiante', 403);
    }

    let whereClause = 'WHERE n.alumno_usuario_id = ?';
    let replacements = [hijoId];

    if (materiaId) {
      whereClause += ' AND n.materia_id = ?';
      replacements.push(materiaId);
    }

    if (trimestre) {
      whereClause += ' AND n.trimestre = ?';
      replacements.push(trimestre);
    }

    const [calificaciones] = await sequelize.query(`
      SELECT 
        n.id,
        n.calificacion,
        n.concepto,
        n.fecha,
        n.observaciones,
        n.trimestre,
        m.nombre as materia_nombre,
        m.descripcion as materia_descripcion,
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

    return calificaciones || [];
  } catch (error) {
    console.error('Error en obtenerCalificacionesHijo:', error);
    throw new AppError('Error al obtener calificaciones del hijo', 500);
  }
};

export const obtenerBoletinHijo = async (parentId: number, hijoId: number, trimestre?: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar relación padre-hijo
    const [relacion] = await sequelize.query(`
      SELECT 1 FROM alumno_padre ap
      WHERE ap.padre_usuario_id = ? AND ap.alumno_usuario_id = ?
    `, { replacements: [parentId, hijoId] });

    if (!relacion.length) {
      throw new AppError('No tienes permisos para acceder al boletín de este estudiante', 403);
    }

    const boletin = await PromedioAlumno.obtenerBoletinCompleto(hijoId, trimestre);
    
    if (!boletin.alumno) {
      throw new AppError('Estudiante no encontrado', 404);
    }

    return boletin;
  } catch (error) {
    console.error('Error en obtenerBoletinHijo:', error);
    throw new AppError('Error al obtener el boletín del hijo', 500);
  }
};

export const obtenerEstadisticasHijo = async (parentId: number, hijoId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Verificar relación padre-hijo
    const [relacion] = await sequelize.query(`
      SELECT 1 FROM alumno_padre ap
      WHERE ap.padre_usuario_id = ? AND ap.alumno_usuario_id = ?
    `, { replacements: [parentId, hijoId] });

    if (!relacion.length) {
      throw new AppError('No tienes permisos para acceder a las estadísticas de este estudiante', 403);
    }

    const [estadisticas] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT n.id) as total_notas,
        COUNT(DISTINCT n.materia_id) as materias_con_notas,
        ROUND(AVG(n.calificacion), 2) as promedio_general,
        COUNT(CASE WHEN n.calificacion >= 7 THEN 1 END) as notas_aprobadas,
        COUNT(CASE WHEN n.calificacion < 4 THEN 1 END) as notas_desaprobadas,
        COUNT(CASE WHEN n.calificacion BETWEEN 4 AND 6.99 THEN 1 END) as notas_pendientes,
        MAX(n.calificacion) as mejor_nota,
        MIN(n.calificacion) as peor_nota,
        n.trimestre
      FROM nota n
      WHERE n.alumno_usuario_id = ?
      GROUP BY n.trimestre
      ORDER BY n.trimestre
    `, { replacements: [hijoId] });

    return estadisticas || [];
  } catch (error) {
    console.error('Error en obtenerEstadisticasHijo:', error);
    throw new AppError('Error al obtener estadísticas del hijo', 500);
  }
};

export const obtenerResumenAcademicoHijos = async (parentId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [resumen] = await sequelize.query(`
      SELECT 
        u.id as hijo_id,
        CONCAT(u.nombre, ' ', u.apellido) as hijo_nombre,
        CONCAT(c.año, '° ', d.division) as curso_division,
        COUNT(DISTINCT n.id) as total_notas,
        COUNT(DISTINCT n.materia_id) as materias_evaluadas,
        ROUND(AVG(n.calificacion), 2) as promedio_general,
        COUNT(CASE WHEN n.calificacion >= 7 THEN 1 END) as notas_aprobadas,
        COUNT(CASE WHEN n.calificacion < 4 THEN 1 END) as notas_desaprobadas,
        MAX(n.fecha) as ultima_evaluacion,
        CASE 
          WHEN AVG(n.calificacion) >= 7 THEN 'Excelente'
          WHEN AVG(n.calificacion) >= 6 THEN 'Bueno'
          WHEN AVG(n.calificacion) >= 4 THEN 'Regular'
          ELSE 'Necesita Apoyo'
        END as estado_academico
      FROM usuario u
      INNER JOIN alumno_padre ap ON u.id = ap.alumno_usuario_id
      LEFT JOIN usuario_curso uc ON u.id = uc.usuario_id
      LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
      LEFT JOIN curso c ON cd.curso_id = c.id
      LEFT JOIN division d ON cd.division_id = d.id
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id
      WHERE ap.padre_usuario_id = ? AND u.rol_id = 4
      GROUP BY u.id, u.nombre, u.apellido, c.año, d.division
      ORDER BY u.apellido, u.nombre
    `, { replacements: [parentId] });

    return resumen || [];
  } catch (error) {
    console.error('Error en obtenerResumenAcademicoHijos:', error);
    throw new AppError('Error al obtener resumen académico de los hijos', 500);
  }
};

export const obtenerComparativaHermanos = async (parentId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [comparativa] = await sequelize.query(`
      SELECT 
        u.id as hijo_id,
        CONCAT(u.nombre, ' ', u.apellido) as hijo_nombre,
        CONCAT(c.año, '° ', d.division) as curso_division,
        n.trimestre,
        m.nombre as materia_nombre,
        ROUND(AVG(n.calificacion), 2) as promedio_materia,
        COUNT(n.id) as cantidad_notas
      FROM usuario u
      INNER JOIN alumno_padre ap ON u.id = ap.alumno_usuario_id
      LEFT JOIN usuario_curso uc ON u.id = uc.usuario_id
      LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
      LEFT JOIN curso c ON cd.curso_id = c.id
      LEFT JOIN division d ON cd.division_id = d.id
      LEFT JOIN nota n ON u.id = n.alumno_usuario_id
      LEFT JOIN materia m ON n.materia_id = m.id
      WHERE ap.padre_usuario_id = ? AND u.rol_id = 4
      GROUP BY u.id, u.nombre, u.apellido, c.año, d.division, n.trimestre, m.id, m.nombre
      HAVING COUNT(n.id) > 0
      ORDER BY u.apellido, u.nombre, n.trimestre, m.nombre
    `, { replacements: [parentId] });

    return comparativa || [];
  } catch (error) {
    console.error('Error en obtenerComparativaHermanos:', error);
    throw new AppError('Error al obtener comparativa entre hermanos', 500);
  }
};

export const obtenerNotificacionesAcademicas = async (parentId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    const [notificaciones] = await sequelize.query(`
      SELECT 
        u.id as hijo_id,
        CONCAT(u.nombre, ' ', u.apellido) as hijo_nombre,
        m.nombre as materia_nombre,
        n.calificacion,
        n.concepto,
        n.fecha,
        n.observaciones,
        CASE 
          WHEN n.calificacion < 4 THEN 'Nota Baja'
          WHEN n.calificacion >= 9 THEN 'Excelente Desempeño'
          WHEN n.observaciones IS NOT NULL AND n.observaciones != '' THEN 'Observación del Profesor'
          ELSE 'Evaluación Regular'
        END as tipo_notificacion,
        CASE 
          WHEN n.calificacion < 4 THEN 'alta'
          WHEN n.calificacion >= 9 THEN 'baja'
          ELSE 'media'
        END as prioridad
      FROM usuario u
      INNER JOIN alumno_padre ap ON u.id = ap.alumno_usuario_id
      INNER JOIN nota n ON u.id = n.alumno_usuario_id
      INNER JOIN materia m ON n.materia_id = m.id
      WHERE ap.padre_usuario_id = ? 
        AND u.rol_id = 4
        AND (
          n.calificacion < 4 
          OR n.calificacion >= 9 
          OR (n.observaciones IS NOT NULL AND n.observaciones != '')
        )
        AND n.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY n.fecha DESC, 
        CASE 
          WHEN n.calificacion < 4 THEN 1
          WHEN n.observaciones IS NOT NULL AND n.observaciones != '' THEN 2
          WHEN n.calificacion >= 9 THEN 3
          ELSE 4
        END
    `, { replacements: [parentId] });

    return notificaciones || [];
  } catch (error) {
    console.error('Error en obtenerNotificacionesAcademicas:', error);
    throw new AppError('Error al obtener notificaciones académicas', 500);
  }
};