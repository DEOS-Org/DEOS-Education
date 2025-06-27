import { 
  Usuario, 
  UsuarioCurso,
  CursoDivision,
  Curso,
  Division,
  Horario,
  CursoDivisionMateria,
  Materia,
  Registro,
  UsuarioInstance
} from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

// ===== DASHBOARD =====
export const getDashboard = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    // Get student basic info with course
    const [studentInfo] = await sequelize.query(`
      SELECT 
        u.*,
        c.año as curso_año,
        d.division as division_nombre,
        cd.id as curso_division_id
      FROM usuario u
      LEFT JOIN usuario_curso uc ON u.id = uc.usuario_id
      LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
      LEFT JOIN curso c ON cd.curso_id = c.id
      LEFT JOIN division d ON cd.division_id = d.id
      WHERE u.id = ?
    `, { replacements: [userId] });

    if (!studentInfo || studentInfo.length === 0) {
      throw new AppError('Estudiante no encontrado', 404);
    }

    const student = studentInfo[0];
    const cursoDivisionId = student.curso_division_id;

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const [todayAttendance] = await sequelize.query(`
      SELECT COUNT(*) as presente_hoy
      FROM registro r
      WHERE r.usuario_id = ? 
      AND DATE(r.fecha_hora) = ?
      AND r.tipo = 'entrada'
    `, { replacements: [userId, today] });

    // Get this week's attendance percentage
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const [weeklyAttendance] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT DATE(r.fecha_hora)) as dias_presente,
        (SELECT COUNT(DISTINCT DATE(h.dia)) 
         FROM horario h 
         JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
         WHERE cdm.curso_division_id = ?
         AND h.dia BETWEEN ? AND ?) as dias_clase
      FROM registro r
      WHERE r.usuario_id = ?
      AND DATE(r.fecha_hora) BETWEEN ? AND ?
      AND r.tipo = 'entrada'
    `, { 
      replacements: [
        cursoDivisionId, 
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0],
        userId,
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      ] 
    });

    // Get upcoming classes today
    const dayOfWeek = new Date().getDay();
    const [todayClasses] = await sequelize.query(`
      SELECT 
        h.*,
        m.nombre as materia_nombre,
        u.nombre as profesor_nombre,
        u.apellido as profesor_apellido
      FROM horario h
      JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
      JOIN materia m ON cdm.materia_id = m.id
      LEFT JOIN usuario u ON h.profesor_usuario_id = u.id
      WHERE cdm.curso_division_id = ?
      AND h.dia = ?
      ORDER BY h.hora_inicio
    `, { replacements: [cursoDivisionId, dayOfWeek] });

    // Get recent grades
    const [recentGrades] = await sequelize.query(`
      SELECT 
        n.*,
        m.nombre as materia_nombre,
        te.descripcion as tipo_evaluacion
      FROM nota n
      JOIN materia m ON n.materia_id = m.id
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ?
      ORDER BY n.fecha DESC
      LIMIT 5
    `, { replacements: [userId] });

    // Get upcoming assignments/evaluations
    const [upcomingAssignments] = await sequelize.query(`
      SELECT 
        n.*,
        m.nombre as materia_nombre,
        te.descripcion as tipo_evaluacion
      FROM nota n
      JOIN materia m ON n.materia_id = m.id
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ?
      AND n.fecha >= CURDATE()
      ORDER BY n.fecha ASC
      LIMIT 5
    `, { replacements: [userId] });

    const attendancePercentage = weeklyAttendance[0]?.dias_clase > 0 
      ? Math.round((weeklyAttendance[0].dias_presente / weeklyAttendance[0].dias_clase) * 100)
      : 100;

    return {
      student: {
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        dni: student.dni,
        curso: student.curso_año,
        division: student.division_nombre
      },
      attendance: {
        presenteHoy: todayAttendance[0]?.presente_hoy > 0,
        porcentajeSemanal: attendancePercentage,
        diasPresenteSemana: weeklyAttendance[0]?.dias_presente || 0,
        diasClaseSemana: weeklyAttendance[0]?.dias_clase || 0
      },
      todayClasses: todayClasses,
      recentGrades: recentGrades,
      upcomingAssignments: upcomingAssignments
    };

  } catch (error) {
    console.error('Error getting student dashboard:', error);
    throw new AppError('Error al obtener el dashboard del estudiante', 500);
  }
};

// ===== ATTENDANCE =====
export const getMyAttendance = async (userId: number, fechaDesde?: string, fechaHasta?: string) => {
  const { sequelize } = require('../models/db');

  try {
    const whereDate = fechaDesde && fechaHasta 
      ? `AND DATE(r.fecha_hora) BETWEEN '${fechaDesde}' AND '${fechaHasta}'`
      : `AND DATE(r.fecha_hora) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;

    const [attendanceRecords] = await sequelize.query(`
      SELECT 
        DATE(r.fecha_hora) as fecha,
        TIME(MIN(CASE WHEN r.tipo = 'entrada' THEN r.fecha_hora END)) as hora_entrada,
        TIME(MAX(CASE WHEN r.tipo = 'salida' THEN r.fecha_hora END)) as hora_salida,
        COUNT(CASE WHEN r.tipo = 'entrada' THEN 1 END) as entradas,
        COUNT(CASE WHEN r.tipo = 'salida' THEN 1 END) as salidas,
        CASE 
          WHEN COUNT(CASE WHEN r.tipo = 'entrada' THEN 1 END) > 0 THEN 'presente'
          ELSE 'ausente'
        END as estado
      FROM registro r
      WHERE r.usuario_id = ?
      ${whereDate}
      GROUP BY DATE(r.fecha_hora)
      ORDER BY fecha DESC
    `, { replacements: [userId] });

    return attendanceRecords;

  } catch (error) {
    console.error('Error getting student attendance:', error);
    throw new AppError('Error al obtener la asistencia del estudiante', 500);
  }
};

export const getAttendanceStats = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    // Get current month stats
    const [monthlyStats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT DATE(r.fecha_hora)) as dias_presente,
        (SELECT COUNT(DISTINCT DATE(h.dia)) 
         FROM horario h 
         JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
         JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
         WHERE uc.usuario_id = ?
         AND MONTH(CURDATE()) = MONTH(NOW())
         AND YEAR(CURDATE()) = YEAR(NOW())) as dias_clase_mes
      FROM registro r
      WHERE r.usuario_id = ?
      AND MONTH(r.fecha_hora) = MONTH(CURDATE())
      AND YEAR(r.fecha_hora) = YEAR(CURDATE())
      AND r.tipo = 'entrada'
    `, { replacements: [userId, userId] });

    // Get yearly stats
    const [yearlyStats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT DATE(r.fecha_hora)) as dias_presente_año,
        (SELECT COUNT(DISTINCT DATE(h.dia)) 
         FROM horario h 
         JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
         JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
         WHERE uc.usuario_id = ?
         AND YEAR(CURDATE()) = YEAR(NOW())) as dias_clase_año
      FROM registro r
      WHERE r.usuario_id = ?
      AND YEAR(r.fecha_hora) = YEAR(CURDATE())
      AND r.tipo = 'entrada'
    `, { replacements: [userId, userId] });

    const monthlyPercentage = monthlyStats[0]?.dias_clase_mes > 0 
      ? Math.round((monthlyStats[0].dias_presente / monthlyStats[0].dias_clase_mes) * 100)
      : 100;

    const yearlyPercentage = yearlyStats[0]?.dias_clase_año > 0 
      ? Math.round((yearlyStats[0].dias_presente_año / yearlyStats[0].dias_clase_año) * 100)
      : 100;

    return {
      mensual: {
        diasPresente: monthlyStats[0]?.dias_presente || 0,
        diasClase: monthlyStats[0]?.dias_clase_mes || 0,
        porcentaje: monthlyPercentage
      },
      anual: {
        diasPresente: yearlyStats[0]?.dias_presente_año || 0,
        diasClase: yearlyStats[0]?.dias_clase_año || 0,
        porcentaje: yearlyPercentage
      }
    };

  } catch (error) {
    console.error('Error getting attendance stats:', error);
    throw new AppError('Error al obtener estadísticas de asistencia', 500);
  }
};

// ===== SCHEDULE =====
export const getMySchedule = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [schedule] = await sequelize.query(`
      SELECT 
        h.*,
        m.nombre as materia_nombre,
        m.carga_horaria,
        u.nombre as profesor_nombre,
        u.apellido as profesor_apellido,
        u.email as profesor_email
      FROM horario h
      JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
      JOIN materia m ON cdm.materia_id = m.id
      JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
      LEFT JOIN usuario u ON h.profesor_usuario_id = u.id
      WHERE uc.usuario_id = ?
      ORDER BY h.dia, h.hora_inicio
    `, { replacements: [userId] });

    // Group by day
    const scheduleByDay = schedule.reduce((acc: any, item: any) => {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = dayNames[item.dia];
      
      if (!acc[dayName]) {
        acc[dayName] = [];
      }
      
      acc[dayName].push(item);
      return acc;
    }, {});

    return scheduleByDay;

  } catch (error) {
    console.error('Error getting student schedule:', error);
    throw new AppError('Error al obtener el horario del estudiante', 500);
  }
};

export const getTodaySchedule = async (userId: number) => {
  const { sequelize } = require('../models/db');
  const today = new Date().getDay();

  try {
    const [todaySchedule] = await sequelize.query(`
      SELECT 
        h.*,
        m.nombre as materia_nombre,
        u.nombre as profesor_nombre,
        u.apellido as profesor_apellido
      FROM horario h
      JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
      JOIN materia m ON cdm.materia_id = m.id
      JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
      LEFT JOIN usuario u ON h.profesor_usuario_id = u.id
      WHERE uc.usuario_id = ?
      AND h.dia = ?
      ORDER BY h.hora_inicio
    `, { replacements: [userId, today] });

    return todaySchedule;

  } catch (error) {
    console.error('Error getting today schedule:', error);
    throw new AppError('Error al obtener el horario de hoy', 500);
  }
};

// ===== GRADES =====
export const getMyGrades = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [grades] = await sequelize.query(`
      SELECT 
        n.*,
        m.nombre as materia_nombre,
        te.descripcion as tipo_evaluacion,
        te.peso
      FROM nota n
      JOIN materia m ON n.materia_id = m.id
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ?
      ORDER BY n.fecha DESC, m.nombre
    `, { replacements: [userId] });

    // Group by subject
    const gradesBySubject = grades.reduce((acc: any, grade: any) => {
      if (!acc[grade.materia_nombre]) {
        acc[grade.materia_nombre] = [];
      }
      acc[grade.materia_nombre].push(grade);
      return acc;
    }, {});

    return gradesBySubject;

  } catch (error) {
    console.error('Error getting student grades:', error);
    throw new AppError('Error al obtener las calificaciones del estudiante', 500);
  }
};

export const getGradesBySubject = async (userId: number, materiaId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [grades] = await sequelize.query(`
      SELECT 
        n.*,
        te.descripcion as tipo_evaluacion,
        te.peso
      FROM nota n
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ? AND n.materia_id = ?
      ORDER BY n.fecha DESC
    `, { replacements: [userId, materiaId] });

    return grades;

  } catch (error) {
    console.error('Error getting grades by subject:', error);
    throw new AppError('Error al obtener las calificaciones por materia', 500);
  }
};

export const getGradesSummary = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [summary] = await sequelize.query(`
      SELECT 
        m.nombre as materia_nombre,
        AVG(n.nota) as promedio,
        COUNT(n.id) as total_notas,
        MIN(n.nota) as nota_minima,
        MAX(n.nota) as nota_maxima
      FROM nota n
      JOIN materia m ON n.materia_id = m.id
      WHERE n.usuario_id = ?
      GROUP BY m.id, m.nombre
      ORDER BY promedio DESC
    `, { replacements: [userId] });

    // Calculate overall average
    const [overallAvg] = await sequelize.query(`
      SELECT AVG(n.nota) as promedio_general
      FROM nota n
      WHERE n.usuario_id = ?
    `, { replacements: [userId] });

    return {
      promedioGeneral: overallAvg[0]?.promedio_general || 0,
      materias: summary
    };

  } catch (error) {
    console.error('Error getting grades summary:', error);
    throw new AppError('Error al obtener el resumen de calificaciones', 500);
  }
};

// ===== SUBJECTS =====
export const getMySubjects = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [subjects] = await sequelize.query(`
      SELECT DISTINCT
        m.*,
        u.nombre as profesor_nombre,
        u.apellido as profesor_apellido,
        u.email as profesor_email,
        COUNT(h.id) as horas_semanales
      FROM materia m
      JOIN curso_division_materia cdm ON m.id = cdm.materia_id
      JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
      LEFT JOIN horario h ON cdm.id = h.curso_division_materia_id
      LEFT JOIN usuario u ON h.profesor_usuario_id = u.id
      WHERE uc.usuario_id = ?
      GROUP BY m.id
      ORDER BY m.nombre
    `, { replacements: [userId] });

    return subjects;

  } catch (error) {
    console.error('Error getting student subjects:', error);
    throw new AppError('Error al obtener las materias del estudiante', 500);
  }
};

export const getSubjectDetail = async (userId: number, materiaId: number) => {
  const { sequelize } = require('../models/db');

  try {
    // Get subject info
    const [subjectInfo] = await sequelize.query(`
      SELECT 
        m.*,
        u.nombre as profesor_nombre,
        u.apellido as profesor_apellido,
        u.email as profesor_email
      FROM materia m
      JOIN curso_division_materia cdm ON m.id = cdm.materia_id
      JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
      LEFT JOIN horario h ON cdm.id = h.curso_division_materia_id
      LEFT JOIN usuario u ON h.profesor_usuario_id = u.id
      WHERE uc.usuario_id = ? AND m.id = ?
      LIMIT 1
    `, { replacements: [userId, materiaId] });

    if (!subjectInfo || subjectInfo.length === 0) {
      throw new AppError('Materia no encontrada', 404);
    }

    // Get subject schedule
    const [schedule] = await sequelize.query(`
      SELECT h.*
      FROM horario h
      JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
      JOIN usuario_curso uc ON cdm.curso_division_id = uc.curso_division_id
      WHERE uc.usuario_id = ? AND cdm.materia_id = ?
      ORDER BY h.dia, h.hora_inicio
    `, { replacements: [userId, materiaId] });

    // Get recent grades for this subject
    const [grades] = await sequelize.query(`
      SELECT 
        n.*,
        te.descripcion as tipo_evaluacion
      FROM nota n
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ? AND n.materia_id = ?
      ORDER BY n.fecha DESC
      LIMIT 10
    `, { replacements: [userId, materiaId] });

    return {
      subject: subjectInfo[0],
      schedule: schedule,
      recentGrades: grades
    };

  } catch (error) {
    console.error('Error getting subject detail:', error);
    throw new AppError('Error al obtener el detalle de la materia', 500);
  }
};

// ===== PROFILE =====
export const getMyProfile = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [profile] = await sequelize.query(`
      SELECT 
        u.*,
        c.año as curso_año,
        d.division as division_nombre,
        GROUP_CONCAT(r.nombre SEPARATOR ', ') as roles
      FROM usuario u
      LEFT JOIN usuario_curso uc ON u.id = uc.usuario_id
      LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
      LEFT JOIN curso c ON cd.curso_id = c.id
      LEFT JOIN division d ON cd.division_id = d.id
      LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
      LEFT JOIN rol r ON ur.rol_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `, { replacements: [userId] });

    if (!profile || profile.length === 0) {
      throw new AppError('Perfil no encontrado', 404);
    }

    return profile[0];

  } catch (error) {
    console.error('Error getting student profile:', error);
    throw new AppError('Error al obtener el perfil del estudiante', 500);
  }
};

export const updateProfile = async (userId: number, profileData: any) => {
  try {
    const user = await Usuario.findByPk(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    await user.update(profileData);
    return user;

  } catch (error) {
    console.error('Error updating student profile:', error);
    throw new AppError('Error al actualizar el perfil del estudiante', 500);
  }
};

// ===== ASSIGNMENTS =====
export const getMyAssignments = async (userId: number, estado?: string, materiaId?: number) => {
  // This would need an assignments table, for now return empty array
  return [];
};

export const getAssignmentDetail = async (userId: number, assignmentId: number) => {
  // This would need an assignments table, for now return null
  return null;
};

// ===== CALENDAR =====
export const getCalendarEvents = async (userId: number, fechaDesde?: string, fechaHasta?: string) => {
  const { sequelize } = require('../models/db');

  try {
    const whereDate = fechaDesde && fechaHasta 
      ? `AND n.fecha BETWEEN '${fechaDesde}' AND '${fechaHasta}'`
      : `AND n.fecha >= CURDATE()`;

    const [events] = await sequelize.query(`
      SELECT 
        n.fecha,
        n.descripcion as titulo,
        m.nombre as materia_nombre,
        te.descripcion as tipo,
        'evaluacion' as evento_tipo
      FROM nota n
      JOIN materia m ON n.materia_id = m.id
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ?
      ${whereDate}
      ORDER BY n.fecha
    `, { replacements: [userId] });

    return events;

  } catch (error) {
    console.error('Error getting calendar events:', error);
    throw new AppError('Error al obtener los eventos del calendario', 500);
  }
};

export const getUpcomingEvents = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [events] = await sequelize.query(`
      SELECT 
        n.fecha,
        n.descripcion as titulo,
        m.nombre as materia_nombre,
        te.descripcion as tipo
      FROM nota n
      JOIN materia m ON n.materia_id = m.id
      JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
      WHERE n.usuario_id = ?
      AND n.fecha >= CURDATE()
      ORDER BY n.fecha
      LIMIT 10
    `, { replacements: [userId] });

    return events;

  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw new AppError('Error al obtener los próximos eventos', 500);
  }
};

// ===== ACADEMIC INFO =====
export const getMyCourse = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [courseInfo] = await sequelize.query(`
      SELECT 
        c.*,
        d.division as division_nombre,
        cd.id as curso_division_id,
        COUNT(DISTINCT uc2.usuario_id) as total_estudiantes
      FROM usuario u
      JOIN usuario_curso uc ON u.id = uc.usuario_id
      JOIN curso_division cd ON uc.curso_division_id = cd.id
      JOIN curso c ON cd.curso_id = c.id
      JOIN division d ON cd.division_id = d.id
      LEFT JOIN usuario_curso uc2 ON cd.id = uc2.curso_division_id
      WHERE u.id = ?
      GROUP BY c.id, d.id
    `, { replacements: [userId] });

    return courseInfo[0] || null;

  } catch (error) {
    console.error('Error getting student course:', error);
    throw new AppError('Error al obtener el curso del estudiante', 500);
  }
};

export const getClassmates = async (userId: number) => {
  const { sequelize } = require('../models/db');

  try {
    const [classmates] = await sequelize.query(`
      SELECT 
        u2.id,
        u2.nombre,
        u2.apellido,
        u2.email
      FROM usuario u
      JOIN usuario_curso uc ON u.id = uc.usuario_id
      JOIN usuario_curso uc2 ON uc.curso_division_id = uc2.curso_division_id
      JOIN usuario u2 ON uc2.usuario_id = u2.id
      WHERE u.id = ? AND u2.id != ?
      ORDER BY u2.apellido, u2.nombre
    `, { replacements: [userId, userId] });

    return classmates;

  } catch (error) {
    console.error('Error getting classmates:', error);
    throw new AppError('Error al obtener los compañeros de clase', 500);
  }
};

// ===== COMMUNICATIONS =====
export const getComunicados = async (userId: number) => {
  // This would need a comunicados table, for now return empty array
  return [];
};

export const getMensajes = async (userId: number) => {
  // This would need a mensajes table, for now return empty array
  return [];
};

export const sendMessage = async (userId: number, messageData: any) => {
  // This would need a mensajes table, for now return null
  return null;
};