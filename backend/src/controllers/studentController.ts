import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as studentService from '../services/studentService';

// ===== DASHBOARD =====
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const dashboard = await studentService.getDashboard(userId);
  res.json(dashboard);
});

// ===== ATTENDANCE =====
export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const { fechaDesde, fechaHasta } = req.query;
  const attendance = await studentService.getMyAttendance(
    userId,
    fechaDesde as string,
    fechaHasta as string
  );
  res.json(attendance);
});

export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const stats = await studentService.getAttendanceStats(userId);
  res.json(stats);
});

// ===== SCHEDULE =====
export const getMySchedule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const schedule = await studentService.getMySchedule(userId);
  res.json(schedule);
});

export const getTodaySchedule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const todaySchedule = await studentService.getTodaySchedule(userId);
  res.json(todaySchedule);
});

// ===== GRADES =====
export const getMyGrades = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const grades = await studentService.getMyGrades(userId);
  res.json(grades);
});

export const getGradesBySubject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { materiaId } = req.params;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const grades = await studentService.getGradesBySubject(userId, Number(materiaId));
  res.json(grades);
});

export const getGradesSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const summary = await studentService.getGradesSummary(userId);
  res.json(summary);
});

// ===== SUBJECTS =====
export const getMySubjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const subjects = await studentService.getMySubjects(userId);
  res.json(subjects);
});

export const getSubjectDetail = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { materiaId } = req.params;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const subjectDetail = await studentService.getSubjectDetail(userId, Number(materiaId));
  res.json(subjectDetail);
});

// ===== PROFILE =====
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const profile = await studentService.getMyProfile(userId);
  res.json(profile);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const { telefono, email, direccion } = req.body;
  const updatedProfile = await studentService.updateProfile(userId, {
    telefono,
    email,
    direccion
  });
  res.json(updatedProfile);
});

// ===== ASSIGNMENTS =====
export const getMyAssignments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const { estado, materiaId } = req.query;
  const assignments = await studentService.getMyAssignments(
    userId, 
    estado as string,
    materiaId ? Number(materiaId) : undefined
  );
  res.json(assignments);
});

export const getAssignmentDetail = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { assignmentId } = req.params;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const assignment = await studentService.getAssignmentDetail(userId, Number(assignmentId));
  res.json(assignment);
});

// ===== CALENDAR =====
export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const { fechaDesde, fechaHasta } = req.query;
  const events = await studentService.getCalendarEvents(
    userId,
    fechaDesde as string,
    fechaHasta as string
  );
  res.json(events);
});

export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const events = await studentService.getUpcomingEvents(userId);
  res.json(events);
});

// ===== ACADEMIC INFO =====
export const getMyCourse = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const course = await studentService.getMyCourse(userId);
  res.json(course);
});

export const getClassmates = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const classmates = await studentService.getClassmates(userId);
  res.json(classmates);
});

// ===== COMMUNICATIONS =====
export const getComunicados = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const comunicados = await studentService.getComunicados(userId);
  res.json(comunicados);
});

export const getMensajes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const mensajes = await studentService.getMensajes(userId);
  res.json(mensajes);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const { destinatario_id, asunto, mensaje } = req.body;
  if (!destinatario_id || !asunto || !mensaje) {
    throw new AppError('Destinatario, asunto y mensaje son requeridos', 400);
  }
  
  const newMessage = await studentService.sendMessage(userId, {
    destinatario_id,
    asunto,
    mensaje
  });
  res.status(201).json(newMessage);
});