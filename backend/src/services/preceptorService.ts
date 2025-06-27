import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

// ===== DASHBOARD =====
export const getDashboard = async (preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  // Get preceptor's assigned courses
  const [coursesResult] = await sequelize.query(`
    SELECT DISTINCT 
      cd.id,
      CONCAT(c.año, '° ', d.division) as nombre,
      c.año as curso_año,
      d.division
    FROM curso_division cd
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    JOIN usuario_curso uc ON cd.id = uc.curso_division_id
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE r.nombre = 'preceptor' AND uc.usuario_id = ?
    ORDER BY c.año, d.division
  `, { replacements: [preceptorId] });
  
  const courses = coursesResult as any[];
  
  if (courses.length === 0) {
    return {
      courses: [],
      todayStats: { presentes: 0, ausentes: 0, tarde: 0, total: 0 },
      weekStats: { presentes: 0, ausentes: 0, tarde: 0, total: 0 },
      pendingAlerts: [],
      recentActivity: [],
      summary: {
        totalCourses: 0,
        totalStudents: 0,
        todayAttendance: 0,
        pendingAlerts: 0
      }
    };
  }
  
  const courseIds = courses.map(c => c.id);
  
  // Get today's attendance statistics
  const [todayStatsResult] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN r.usuario_id END) as presentes,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN r.usuario_id END) as tarde,
      COUNT(DISTINCT uc.usuario_id) as total_estudiantes,
      (COUNT(DISTINCT uc.usuario_id) - COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' THEN r.usuario_id END)) as ausentes
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r_student ON ur.rol_id = r_student.id
    LEFT JOIN registro r ON uc.usuario_id = r.usuario_id AND DATE(r.fecha) = CURDATE()
    WHERE uc.curso_division_id IN (${courseIds.map(() => '?').join(',')})
      AND r_student.nombre = 'alumno'
  `, { replacements: courseIds });
  
  const todayStats = todayStatsResult[0] as any;
  
  // Get week attendance statistics
  const [weekStatsResult] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN CONCAT(r.usuario_id, '_', DATE(r.fecha)) END) as presentes,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN CONCAT(r.usuario_id, '_', DATE(r.fecha)) END) as tarde,
      COUNT(DISTINCT uc.usuario_id) * 5 as total_dias,
      (COUNT(DISTINCT uc.usuario_id) * 5 - COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' THEN CONCAT(r.usuario_id, '_', DATE(r.fecha)) END)) as ausentes
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r_student ON ur.rol_id = r_student.id
    LEFT JOIN registro r ON uc.usuario_id = r.usuario_id 
      AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      AND DATE(r.fecha) <= CURDATE()
      AND WEEKDAY(r.fecha) < 5
    WHERE uc.curso_division_id IN (${courseIds.map(() => '?').join(',')})
      AND r_student.nombre = 'alumno'
  `, { replacements: courseIds });
  
  const weekStats = weekStatsResult[0] as any;
  
  // Get total students
  const [totalStudentsResult] = await sequelize.query(`
    SELECT COUNT(DISTINCT uc.usuario_id) as total
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id IN (${courseIds.map(() => '?').join(',')})
      AND r.nombre = 'alumno'
  `, { replacements: courseIds });
  
  const totalStudents = (totalStudentsResult[0] as any).total;
  
  // Get recent attendance activity
  const [recentActivityResult] = await sequelize.query(`
    SELECT 
      r.id,
      r.tipo,
      r.fecha,
      r.hora,
      u.nombre,
      u.apellido,
      CONCAT(c.año, '° ', d.division) as curso,
      CASE 
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN 'presente'
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN 'tarde'
        ELSE 'presente'
      END as estado
    FROM registro r
    JOIN usuario u ON r.usuario_id = u.id
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN curso_division cd ON uc.curso_division_id = cd.id
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE uc.curso_division_id IN (${courseIds.map(() => '?').join(',')})
      AND DATE(r.fecha) = CURDATE()
      AND r.tipo = 'ingreso'
    ORDER BY r.hora DESC
    LIMIT 10
  `, { replacements: courseIds });
  
  const todayAttendancePercentage = totalStudents > 0 ? 
    Math.round(((todayStats.presentes + todayStats.tarde) / totalStudents) * 100) : 0;
  
  return {
    courses: courses.map(course => ({
      id: course.id,
      nombre: course.nombre,
      curso_año: course.curso_año,
      division: course.division
    })),
    todayStats: {
      presentes: parseInt(todayStats.presentes) || 0,
      ausentes: parseInt(todayStats.ausentes) || 0,
      tarde: parseInt(todayStats.tarde) || 0,
      total: parseInt(todayStats.total_estudiantes) || 0
    },
    weekStats: {
      presentes: parseInt(weekStats.presentes) || 0,
      ausentes: parseInt(weekStats.ausentes) || 0,
      tarde: parseInt(weekStats.tarde) || 0,
      total: parseInt(weekStats.total_dias) || 0
    },
    recentActivity: recentActivityResult,
    summary: {
      totalCourses: courses.length,
      totalStudents: parseInt(totalStudents) || 0,
      todayAttendance: todayAttendancePercentage,
      pendingAlerts: 0 // Will be implemented with alerts system
    }
  };
};

// ===== CURSOS ASIGNADOS =====
export const getAssignedCourses = async (preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  const [coursesResult] = await sequelize.query(`
    SELECT DISTINCT 
      cd.id,
      CONCAT(c.año, '° ', d.division) as nombre,
      c.año as curso_año,
      d.division,
      COUNT(DISTINCT uc.usuario_id) as total_estudiantes
    FROM curso_division cd
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    JOIN usuario_curso uc ON cd.id = uc.curso_division_id
    JOIN usuario_rol ur_preceptor ON uc.usuario_id = ur_preceptor.usuario_id
    JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
    LEFT JOIN usuario_curso uc_students ON cd.id = uc_students.curso_division_id
    LEFT JOIN usuario_rol ur_students ON uc_students.usuario_id = ur_students.usuario_id
    LEFT JOIN rol r_students ON ur_students.rol_id = r_students.id AND r_students.nombre = 'alumno'
    WHERE r_preceptor.nombre = 'preceptor' AND uc.usuario_id = ?
    GROUP BY cd.id, c.año, d.division
    ORDER BY c.año, d.division
  `, { replacements: [preceptorId] });
  
  // Get additional stats for each course
  const coursesWithStats = await Promise.all((coursesResult as any[]).map(async (course) => {
    // Get today's attendance
    const [todayAttendance] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' THEN r.usuario_id END) as presentes,
        COUNT(DISTINCT uc.usuario_id) as total
      FROM usuario_curso uc
      JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
      JOIN rol r_role ON ur.rol_id = r_role.id
      LEFT JOIN registro r ON uc.usuario_id = r.usuario_id AND DATE(r.fecha) = CURDATE()
      WHERE uc.curso_division_id = ? AND r_role.nombre = 'alumno'
    `, { replacements: [course.id] });
    
    const attendance = todayAttendance[0] as any;
    const attendancePercentage = attendance.total > 0 ? 
      Math.round((attendance.presentes / attendance.total) * 100) : 0;
    
    return {
      id: course.id,
      nombre: course.nombre,
      curso_año: course.curso_año,
      division: course.division,
      total_estudiantes: parseInt(course.total_estudiantes) || 0,
      asistencia_hoy: {
        presentes: parseInt(attendance.presentes) || 0,
        total: parseInt(attendance.total) || 0,
        porcentaje: attendancePercentage
      }
    };
  }));
  
  return coursesWithStats;
};

export const getCourseDetail = async (courseId: number, preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  // Verify preceptor has access to this course
  const [accessCheck] = await sequelize.query(`
    SELECT 1
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ? AND uc.usuario_id = ? AND r.nombre = 'preceptor'
  `, { replacements: [courseId, preceptorId] });
  
  if (!accessCheck || accessCheck.length === 0) {
    throw new AppError('No tienes acceso a este curso', 403);
  }
  
  // Get course details
  const [courseResult] = await sequelize.query(`
    SELECT 
      cd.id,
      CONCAT(c.año, '° ', d.division) as nombre,
      c.año as curso_año,
      d.division
    FROM curso_division cd
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE cd.id = ?
  `, { replacements: [courseId] });
  
  if (!courseResult || courseResult.length === 0) {
    throw new AppError('Curso no encontrado', 404);
  }
  
  const course = courseResult[0] as any;
  
  // Get students
  const [studentsResult] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      u.dni,
      u.email
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ? AND r.nombre = 'alumno'
    ORDER BY u.apellido, u.nombre
  `, { replacements: [courseId] });
  
  // Get subjects
  const [subjectsResult] = await sequelize.query(`
    SELECT DISTINCT
      m.id,
      m.nombre,
      m.carga_horaria
    FROM materia m
    JOIN curso_division_materia cdm ON m.id = cdm.materia_id
    WHERE cdm.curso_division_id = ?
    ORDER BY m.nombre
  `, { replacements: [courseId] });
  
  // Get recent attendance (last 7 days)
  const [attendanceResult] = await sequelize.query(`
    SELECT 
      DATE(r.fecha) as fecha,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN r.usuario_id END) as presentes,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN r.usuario_id END) as tarde,
      COUNT(DISTINCT uc.usuario_id) as total
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r_role ON ur.rol_id = r_role.id
    LEFT JOIN registro r ON uc.usuario_id = r.usuario_id 
      AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND DATE(r.fecha) <= CURDATE()
    WHERE uc.curso_division_id = ? AND r_role.nombre = 'alumno'
    GROUP BY DATE(r.fecha)
    ORDER BY fecha DESC
  `, { replacements: [courseId] });
  
  return {
    ...course,
    estudiantes: studentsResult,
    materias: subjectsResult,
    asistencia_reciente: attendanceResult,
    estadisticas: {
      total_estudiantes: (studentsResult as any[]).length,
      total_materias: (subjectsResult as any[]).length
    }
  };
};

// ===== ESTUDIANTES =====
export const getStudentsByCourse = async (courseId: number, preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  // Verify access
  const [accessCheck] = await sequelize.query(`
    SELECT 1
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ? AND uc.usuario_id = ? AND r.nombre = 'preceptor'
  `, { replacements: [courseId, preceptorId] });
  
  if (!accessCheck || accessCheck.length === 0) {
    throw new AppError('No tienes acceso a este curso', 403);
  }
  
  const [studentsResult] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      u.dni,
      u.email,
      u.activo,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN DATE(r.fecha) END) as dias_presentes_mes,
      COUNT(DISTINCT CASE WHEN DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN DATE(r.fecha) END) as dias_presentes_semana
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r_role ON ur.rol_id = r_role.id
    LEFT JOIN registro r ON u.id = r.usuario_id
    WHERE uc.curso_division_id = ? AND r_role.nombre = 'alumno'
    GROUP BY u.id, u.nombre, u.apellido, u.dni, u.email, u.activo
    ORDER BY u.apellido, u.nombre
  `, { replacements: [courseId] });
  
  return studentsResult;
};

export const getAllStudents = async (preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  const [studentsResult] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      u.dni,
      u.email,
      u.activo,
      CONCAT(c.año, '° ', d.division) as curso
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r_role ON ur.rol_id = r_role.id
    JOIN curso_division cd ON uc.curso_division_id = cd.id
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE r_role.nombre = 'alumno'
      AND uc.curso_division_id IN (
        SELECT DISTINCT uc_preceptor.curso_division_id
        FROM usuario_curso uc_preceptor
        JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
        JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
        WHERE uc_preceptor.usuario_id = ? AND r_preceptor.nombre = 'preceptor'
      )
    ORDER BY u.apellido, u.nombre
  `, { replacements: [preceptorId] });
  
  return studentsResult;
};

export const getStudentDetail = async (studentId: number, preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  // Verify preceptor has access to this student
  const [accessCheck] = await sequelize.query(`
    SELECT 1
    FROM usuario_curso uc_student
    JOIN usuario_curso uc_preceptor ON uc_student.curso_division_id = uc_preceptor.curso_division_id
    JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
    JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
    WHERE uc_student.usuario_id = ? AND uc_preceptor.usuario_id = ? AND r_preceptor.nombre = 'preceptor'
  `, { replacements: [studentId, preceptorId] });
  
  if (!accessCheck || accessCheck.length === 0) {
    throw new AppError('No tienes acceso a este estudiante', 403);
  }
  
  // Get student details
  const [studentResult] = await sequelize.query(`
    SELECT 
      u.id,
      u.nombre,
      u.apellido,
      u.dni,
      u.email,
      u.activo,
      CONCAT(c.año, '° ', d.division) as curso
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN curso_division cd ON uc.curso_division_id = cd.id
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE u.id = ?
  `, { replacements: [studentId] });
  
  if (!studentResult || studentResult.length === 0) {
    throw new AppError('Estudiante no encontrado', 404);
  }
  
  const student = studentResult[0] as any;
  
  // Get attendance records (last 30 days)
  const [attendanceResult] = await sequelize.query(`
    SELECT 
      DATE(r.fecha) as fecha,
      r.tipo,
      r.hora,
      CASE 
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN 'presente'
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN 'tarde'
        ELSE 'presente'
      END as estado
    FROM registro r
    WHERE r.usuario_id = ?
      AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND r.tipo = 'ingreso'
    ORDER BY r.fecha DESC, r.hora DESC
  `, { replacements: [studentId] });
  
  // Calculate attendance statistics
  const totalDays = 22; // Approximate school days in a month
  const presentDays = (attendanceResult as any[]).length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  return {
    ...student,
    asistencia: {
      registros: attendanceResult,
      estadisticas: {
        dias_presentes: presentDays,
        dias_totales: totalDays,
        porcentaje: attendancePercentage
      }
    }
  };
};

// ===== ASISTENCIA MANUAL =====
export const registerManualAttendance = async (data: {
  studentId: number;
  courseId: number;
  date: string;
  status: string;
  observations?: string;
  preceptorId: number;
}) => {
  const { sequelize } = require('../models/db');
  
  // Verify access
  const [accessCheck] = await sequelize.query(`
    SELECT 1
    FROM usuario_curso uc_student
    JOIN usuario_curso uc_preceptor ON uc_student.curso_division_id = uc_preceptor.curso_division_id
    JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
    JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
    WHERE uc_student.usuario_id = ? 
      AND uc_student.curso_division_id = ?
      AND uc_preceptor.usuario_id = ? 
      AND r_preceptor.nombre = 'preceptor'
  `, { replacements: [data.studentId, data.courseId, data.preceptorId] });
  
  if (!accessCheck || accessCheck.length === 0) {
    throw new AppError('No tienes acceso para registrar asistencia en este curso', 403);
  }
  
  // Check if attendance already exists for this date
  const [existingRecord] = await sequelize.query(`
    SELECT id
    FROM registro
    WHERE usuario_id = ? AND DATE(fecha) = ? AND tipo = 'manual'
  `, { replacements: [data.studentId, data.date] });
  
  if (existingRecord && existingRecord.length > 0) {
    // Update existing record
    await sequelize.query(`
      UPDATE registro
      SET hora = NOW(), observaciones = ?
      WHERE usuario_id = ? AND DATE(fecha) = ? AND tipo = 'manual'
    `, { replacements: [data.observations || '', data.studentId, data.date] });
    
    return { 
      message: 'Asistencia actualizada',
      studentId: data.studentId,
      date: data.date,
      status: data.status
    };
  } else {
    // Create new record
    await sequelize.query(`
      INSERT INTO registro (usuario_id, tipo, fecha, hora, observaciones)
      VALUES (?, 'manual', ?, NOW(), ?)
    `, { replacements: [data.studentId, data.date, data.observations || ''] });
    
    return {
      message: 'Asistencia registrada',
      studentId: data.studentId,
      date: data.date,
      status: data.status
    };
  }
};

export const updateAttendance = async (recordId: number, data: {
  status?: string;
  observations?: string;
  preceptorId: number;
}) => {
  const { sequelize } = require('../models/db');
  
  // Verify record exists and preceptor has access
  const [recordCheck] = await sequelize.query(`
    SELECT r.id, r.usuario_id
    FROM registro r
    JOIN usuario_curso uc_student ON r.usuario_id = uc_student.usuario_id
    JOIN usuario_curso uc_preceptor ON uc_student.curso_division_id = uc_preceptor.curso_division_id
    JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
    JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
    WHERE r.id = ? AND uc_preceptor.usuario_id = ? AND r_preceptor.nombre = 'preceptor'
  `, { replacements: [recordId, data.preceptorId] });
  
  if (!recordCheck || recordCheck.length === 0) {
    throw new AppError('No tienes acceso para modificar este registro', 403);
  }
  
  await sequelize.query(`
    UPDATE registro
    SET observaciones = ?
    WHERE id = ?
  `, { replacements: [data.observations || '', recordId] });
  
  return { message: 'Registro actualizado exitosamente' };
};

export const getAttendanceRecords = async (filters: {
  courseId?: number;
  date?: string;
  studentId?: number;
  preceptorId: number;
}) => {
  const { sequelize } = require('../models/db');
  
  let whereClause = 'WHERE 1=1';
  let replacements: any[] = [];
  
  // Base query to ensure preceptor access
  let accessFilter = `
    AND uc_student.curso_division_id IN (
      SELECT DISTINCT uc_preceptor.curso_division_id
      FROM usuario_curso uc_preceptor
      JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
      JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
      WHERE uc_preceptor.usuario_id = ? AND r_preceptor.nombre = 'preceptor'
    )
  `;
  replacements.push(filters.preceptorId);
  
  if (filters.courseId) {
    whereClause += ' AND uc_student.curso_division_id = ?';
    replacements.push(filters.courseId);
  }
  
  if (filters.date) {
    whereClause += ' AND DATE(r.fecha) = ?';
    replacements.push(filters.date);
  }
  
  if (filters.studentId) {
    whereClause += ' AND r.usuario_id = ?';
    replacements.push(filters.studentId);
  }
  
  const [recordsResult] = await sequelize.query(`
    SELECT 
      r.id,
      r.tipo,
      r.fecha,
      r.hora,
      r.observaciones,
      u.nombre,
      u.apellido,
      u.dni,
      CONCAT(c.año, '° ', d.division) as curso,
      CASE 
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN 'presente'
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN 'tarde'
        WHEN r.tipo = 'manual' THEN 'manual'
        ELSE 'presente'
      END as estado
    FROM registro r
    JOIN usuario u ON r.usuario_id = u.id
    JOIN usuario_curso uc_student ON u.id = uc_student.usuario_id
    JOIN curso_division cd ON uc_student.curso_division_id = cd.id
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    ${whereClause} ${accessFilter}
    ORDER BY r.fecha DESC, r.hora DESC
  `, { replacements });
  
  return recordsResult;
};

export const getDailyAttendance = async (courseId: number, date: string, preceptorId: number) => {
  const { sequelize } = require('../models/db');
  
  // Verify access
  const [accessCheck] = await sequelize.query(`
    SELECT 1
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ? AND uc.usuario_id = ? AND r.nombre = 'preceptor'
  `, { replacements: [courseId, preceptorId] });
  
  if (!accessCheck || accessCheck.length === 0) {
    throw new AppError('No tienes acceso a este curso', 403);
  }
  
  // Get all students in the course
  const [allStudentsResult] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      u.dni
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ? AND r.nombre = 'alumno'
    ORDER BY u.apellido, u.nombre
  `, { replacements: [courseId] });
  
  // Get attendance records for the specific date
  const [attendanceResult] = await sequelize.query(`
    SELECT 
      r.usuario_id,
      r.tipo,
      r.hora,
      CASE 
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN 'presente'
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN 'tarde'
        WHEN r.tipo = 'manual' THEN 'manual'
        ELSE 'presente'
      END as estado
    FROM registro r
    JOIN usuario_curso uc ON r.usuario_id = uc.usuario_id
    WHERE uc.curso_division_id = ? AND DATE(r.fecha) = ?
  `, { replacements: [courseId, date] });
  
  const attendanceMap = new Map();
  (attendanceResult as any[]).forEach(record => {
    attendanceMap.set(record.usuario_id, {
      estado: record.estado,
      hora: record.hora
    });
  });
  
  const studentsWithAttendance = (allStudentsResult as any[]).map(student => ({
    ...student,
    estado: attendanceMap.has(student.id) ? attendanceMap.get(student.id).estado : 'ausente',
    hora: attendanceMap.has(student.id) ? attendanceMap.get(student.id).hora : null
  }));
  
  const stats = {
    total: studentsWithAttendance.length,
    presentes: studentsWithAttendance.filter(s => s.estado === 'presente').length,
    tarde: studentsWithAttendance.filter(s => s.estado === 'tarde').length,
    ausentes: studentsWithAttendance.filter(s => s.estado === 'ausente').length,
    manual: studentsWithAttendance.filter(s => s.estado === 'manual').length
  };
  
  return {
    fecha: date,
    curso_id: courseId,
    estudiantes: studentsWithAttendance,
    estadisticas: stats
  };
};

// ===== REPORTES =====
export const getAttendanceReport = async (filters: {
  courseId?: number;
  startDate?: string;
  endDate?: string;
  studentId?: number;
  preceptorId: number;
}) => {
  const { sequelize } = require('../models/db');
  
  let whereClause = 'WHERE 1=1';
  let replacements: any[] = [];
  
  // Ensure preceptor access
  let accessFilter = `
    AND uc.curso_division_id IN (
      SELECT DISTINCT uc_preceptor.curso_division_id
      FROM usuario_curso uc_preceptor
      JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
      JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
      WHERE uc_preceptor.usuario_id = ? AND r_preceptor.nombre = 'preceptor'
    )
  `;
  replacements.push(filters.preceptorId);
  
  if (filters.courseId) {
    whereClause += ' AND uc.curso_division_id = ?';
    replacements.push(filters.courseId);
  }
  
  if (filters.startDate) {
    whereClause += ' AND DATE(r.fecha) >= ?';
    replacements.push(filters.startDate);
  }
  
  if (filters.endDate) {
    whereClause += ' AND DATE(r.fecha) <= ?';
    replacements.push(filters.endDate);
  }
  
  if (filters.studentId) {
    whereClause += ' AND u.id = ?';
    replacements.push(filters.studentId);
  }
  
  const [reportResult] = await sequelize.query(`
    SELECT 
      u.id as student_id,
      u.nombre,
      u.apellido,
      u.dni,
      CONCAT(c.año, '° ', d.division) as curso,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN DATE(r.fecha) END) as dias_presente,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN DATE(r.fecha) END) as dias_tarde,
      COUNT(DISTINCT DATE(r.fecha)) as total_registros,
      22 as dias_habiles
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r_student ON ur.rol_id = r_student.id
    JOIN curso_division cd ON uc.curso_division_id = cd.id
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    LEFT JOIN registro r ON u.id = r.usuario_id
    ${whereClause} ${accessFilter}
      AND r_student.nombre = 'alumno'
    GROUP BY u.id, u.nombre, u.apellido, u.dni, c.año, d.division
    ORDER BY u.apellido, u.nombre
  `, { replacements });
  
  const reportWithPercentages = (reportResult as any[]).map(student => ({
    ...student,
    dias_ausente: student.dias_habiles - student.total_registros,
    porcentaje_asistencia: student.dias_habiles > 0 ? 
      Math.round(((student.dias_presente + student.dias_tarde) / student.dias_habiles) * 100) : 0
  }));
  
  return {
    reporte: reportWithPercentages,
    resumen: {
      total_estudiantes: reportWithPercentages.length,
      promedio_asistencia: reportWithPercentages.length > 0 ?
        Math.round(reportWithPercentages.reduce((sum, s) => sum + s.porcentaje_asistencia, 0) / reportWithPercentages.length) : 0
    }
  };
};

export const getBehaviorReport = async (filters: {
  courseId?: number;
  startDate?: string;
  endDate?: string;
  studentId?: number;
  preceptorId: number;
}) => {
  // Placeholder for behavior reports - would require sanctions/behavior tables
  return {
    reporte: [],
    resumen: {
      total_incidentes: 0,
      estudiantes_con_incidentes: 0
    }
  };
};

export const getAcademicReport = async (filters: {
  courseId?: number;
  startDate?: string;
  endDate?: string;
  preceptorId: number;
}) => {
  // Placeholder for academic reports - would require grades tables
  return {
    reporte: [],
    resumen: {
      promedio_general: 0,
      materias_con_bajo_rendimiento: 0
    }
  };
};

// ===== ALERTAS =====
export const getAlerts = async (filters: {
  type?: string;
  priority?: string;
  status?: string;
  preceptorId: number;
}) => {
  // Placeholder for alerts system - would require alerts table
  return [];
};

export const createAlert = async (data: {
  studentId: number;
  courseId?: number;
  type: string;
  priority: string;
  title: string;
  description?: string;
  preceptorId: number;
}) => {
  // Placeholder for creating alerts
  return {
    id: 1,
    ...data,
    status: 'active',
    created_at: new Date()
  };
};

export const updateAlert = async (alertId: number, data: {
  status?: string;
  comments?: string;
  preceptorId: number;
}) => {
  // Placeholder for updating alerts
  return {
    id: alertId,
    ...data,
    updated_at: new Date()
  };
};

export const deleteAlert = async (alertId: number, preceptorId: number) => {
  // Placeholder for deleting alerts
  return { message: 'Alerta eliminada' };
};

// ===== SANCIONES =====
export const getSanctions = async (filters: {
  studentId?: number;
  courseId?: number;
  status?: string;
  preceptorId: number;
}) => {
  // Placeholder for sanctions system
  return [];
};

export const createSanction = async (data: {
  studentId: number;
  courseId?: number;
  type: string;
  severity: string;
  description: string;
  startDate: string;
  endDate?: string;
  preceptorId: number;
}) => {
  // Placeholder for creating sanctions
  return {
    id: 1,
    ...data,
    status: 'active',
    created_at: new Date()
  };
};

export const updateSanction = async (sanctionId: number, data: {
  status?: string;
  comments?: string;
  preceptorId: number;
}) => {
  // Placeholder for updating sanctions
  return {
    id: sanctionId,
    ...data,
    updated_at: new Date()
  };
};

// ===== COMUNICADOS =====
export const getCommunications = async (filters: {
  courseId?: number;
  type?: string;
  status?: string;
  preceptorId: number;
}) => {
  // Placeholder for communications system
  return [];
};

export const createCommunication = async (data: {
  courseId?: number;
  type: string;
  title: string;
  content: string;
  targetAudience: string;
  priority?: string;
  preceptorId: number;
}) => {
  // Placeholder for creating communications
  return {
    id: 1,
    ...data,
    status: 'draft',
    created_at: new Date()
  };
};

export const updateCommunication = async (communicationId: number, data: {
  status?: string;
  preceptorId: number;
}) => {
  // Placeholder for updating communications
  return {
    id: communicationId,
    ...data,
    updated_at: new Date()
  };
};

// ===== ESTADÍSTICAS =====
export const getStatistics = async (filters: {
  courseId?: number;
  period?: string;
  preceptorId: number;
}) => {
  const { sequelize } = require('../models/db');
  
  let dateFilter = '';
  switch (filters.period) {
    case 'week':
      dateFilter = 'AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      break;
    case 'month':
      dateFilter = 'AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      break;
    case 'year':
      dateFilter = 'AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
      break;
    default:
      dateFilter = 'AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
  }
  
  const [statsResult] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT uc.usuario_id) as total_estudiantes,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' THEN CONCAT(r.usuario_id, '_', DATE(r.fecha)) END) as total_asistencias,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN CONCAT(r.usuario_id, '_', DATE(r.fecha)) END) as asistencias_puntuales,
      COUNT(DISTINCT CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN CONCAT(r.usuario_id, '_', DATE(r.fecha)) END) as asistencias_tarde
    FROM usuario_curso uc
    JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
    JOIN rol r_student ON ur.rol_id = r_student.id
    LEFT JOIN registro r ON uc.usuario_id = r.usuario_id ${dateFilter}
    WHERE r_student.nombre = 'alumno'
      AND uc.curso_division_id IN (
        SELECT DISTINCT uc_preceptor.curso_division_id
        FROM usuario_curso uc_preceptor
        JOIN usuario_rol ur_preceptor ON uc_preceptor.usuario_id = ur_preceptor.usuario_id
        JOIN rol r_preceptor ON ur_preceptor.rol_id = r_preceptor.id
        WHERE uc_preceptor.usuario_id = ? AND r_preceptor.nombre = 'preceptor'
      )
      ${filters.courseId ? 'AND uc.curso_division_id = ?' : ''}
  `, { 
    replacements: filters.courseId ? [filters.preceptorId, filters.courseId] : [filters.preceptorId]
  });
  
  const stats = statsResult[0] as any;
  
  return {
    periodo: filters.period || 'month',
    total_estudiantes: parseInt(stats.total_estudiantes) || 0,
    total_asistencias: parseInt(stats.total_asistencias) || 0,
    asistencias_puntuales: parseInt(stats.asistencias_puntuales) || 0,
    asistencias_tarde: parseInt(stats.asistencias_tarde) || 0,
    porcentaje_puntualidad: stats.total_asistencias > 0 ? 
      Math.round((stats.asistencias_puntuales / stats.total_asistencias) * 100) : 0
  };
};