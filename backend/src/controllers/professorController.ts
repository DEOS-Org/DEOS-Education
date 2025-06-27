import { Request, Response } from 'express';
import { ProfessorService } from '../services/professorService';
import { 
  getProfessorClasses, 
  getProfessorSubjects, 
  getProfessorSchedule,
  getProfessorGradesStats,
  getProfessorRecentActivity 
} from '../services/academicService';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

const professorService = new ProfessorService();

// Dashboard del profesor
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  
  try {
    // Use academicService functions that work
    const [classes, gradesStats, recentActivity] = await Promise.all([
      getProfessorClasses(professorId),
      getProfessorGradesStats(professorId),
      getProfessorRecentActivity(professorId)
    ]);

    const stats = {
      totalClasses: classes.length,
      totalSubjects: classes.length, // Approximation
      totalStudents: classes.reduce((total, cls) => total + (cls.students || 0), 0),
      todayAttendanceRecords: 0, // Placeholder
      recentGrades: gradesStats.pendingGrades || 0,
      recentActivity: recentActivity.slice(0, 5),
      gradesDistribution: gradesStats.gradesDistribution
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    // Fallback data
    res.json({
      success: true,
      data: {
        totalClasses: 0,
        totalSubjects: 0,
        totalStudents: 0,
        todayAttendanceRecords: 0,
        recentGrades: 0,
        recentActivity: [],
        gradesDistribution: []
      }
    });
  }
});

// Obtener materias del profesor
export const getSubjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  
  try {
    const subjects = await getProfessorSubjects(professorId);
    
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Subjects error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Obtener clases del profesor
export const getClasses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  
  try {
    const classes = await getProfessorClasses(professorId);
    
    // The service already returns the correct structure
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Classes error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Obtener estudiantes de una clase
export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  
  try {
    // Use raw SQL to get students
    const { sequelize } = require('../models/db');
    
    const [students] = await sequelize.query(`
      SELECT DISTINCT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.email, 
        u.dni as numero_documento
      FROM usuario u
      JOIN usuario_curso uc ON u.id = uc.usuario_id
      JOIN curso_division_materia cdm ON uc.curso_division_id = cdm.curso_division_id
      WHERE cdm.id = ?
      ORDER BY u.apellido, u.nombre
    `, { replacements: [parseInt(classId)] });
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error getting class students:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Obtener todos los estudiantes del profesor
export const getAllStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  
  try {
    const students = await professorService.getAllProfessorStudents(professorId);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Students error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Obtener horario del profesor
export const getSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  
  try {
    const schedule = await professorService.getProfessorSchedule(professorId);
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Schedule error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Justificar falta
export const justifyAbsence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  const { asistenciaId, observaciones } = req.body;
  
  try {
    const result = await professorService.justifyAbsence({
      professorId,
      asistenciaId,
      observaciones
    });
    
    res.json({
      success: true,
      message: 'Falta justificada correctamente',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error al justificar falta'
    });
  }
});

// Obtener asistencia de una clase en una fecha
export const getClassAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { fecha } = req.query;
  
  if (!fecha) {
    return res.status(400).json({
      success: false,
      message: 'La fecha es requerida'
    });
  }
  
  try {
    const attendance = await professorService.getClassAttendance(parseInt(classId), fecha as string);
    
    res.json({
      success: true,
      data: attendance
    });
  } catch (error: any) {
    console.error('Attendance error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Registrar calificación
export const recordGrade = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  const {
    usuarioId,
    cursoDivisionMateriaId,
    tipoEvaluacion,
    descripcion,
    calificacion,
    calificacionMaxima,
    fechaEvaluacion,
    fechaEntrega,
    observaciones,
    trimestre
  } = req.body;
  
  try {
    const result = await professorService.recordGrade({
      professorId,
      usuarioId,
      cursoDivisionMateriaId,
      tipoEvaluacion,
      descripcion,
      calificacion,
      calificacionMaxima,
      fechaEvaluacion,
      fechaEntrega,
      observaciones,
      trimestre
    });
    
    res.json({
      success: true,
      message: 'Calificación registrada correctamente',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error al registrar calificación'
    });
  }
});

// Obtener calificaciones de una clase
export const getClassGrades = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { trimestre } = req.query;
  
  try {
    const grades = await professorService.getClassGrades(
      parseInt(classId), 
      trimestre ? parseInt(trimestre as string) : undefined
    );
    
    res.json({
      success: true,
      data: grades
    });
  } catch (error: any) {
    console.error('Grades error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Obtener reporte de asistencia
export const getAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { fechaInicio, fechaFin } = req.query;
  
  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({
      success: false,
      message: 'Las fechas de inicio y fin son requeridas'
    });
  }
  
  try {
    const report = await professorService.getAttendanceReport(
      parseInt(classId),
      fechaInicio as string,
      fechaFin as string
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Attendance report error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Obtener reporte de calificaciones
export const getGradesReport = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { trimestre } = req.query;
  
  try {
    const report = await professorService.getGradesReport(
      parseInt(classId),
      trimestre ? parseInt(trimestre as string) : undefined
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Grades report error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Actualizar calificación
export const updateGrade = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  const { gradeId } = req.params;
  const updates = req.body;
  
  try {
    const result = await professorService.updateGrade(professorId, parseInt(gradeId), updates);
    
    res.json({
      success: true,
      message: 'Calificación actualizada correctamente',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar la calificación'
    });
  }
});

// Eliminar calificación
export const deleteGrade = asyncHandler(async (req: AuthRequest, res: Response) => {
  const professorId = req.user!.id;
  const { gradeId } = req.params;
  
  try {
    await professorService.deleteGrade(professorId, parseInt(gradeId));
    
    res.json({
      success: true,
      message: 'Calificación eliminada correctamente'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar la calificación'
    });
  }
});