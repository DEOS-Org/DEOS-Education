import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as preceptorService from '../services/preceptorService';

// ===== DASHBOARD =====
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const dashboard = await preceptorService.getDashboard(userId);
  res.json(dashboard);
});

// ===== CURSOS ASIGNADOS =====
export const getAssignedCourses = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const courses = await preceptorService.getAssignedCourses(userId);
  res.json(courses);
});

export const getCourseDetail = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { userId } = req.user as any;
  const courseDetail = await preceptorService.getCourseDetail(Number(courseId), userId);
  res.json(courseDetail);
});

// ===== ESTUDIANTES =====
export const getStudentsByCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { userId } = req.user as any;
  const students = await preceptorService.getStudentsByCourse(Number(courseId), userId);
  res.json(students);
});

export const getStudentDetail = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { userId } = req.user as any;
  const studentDetail = await preceptorService.getStudentDetail(Number(studentId), userId);
  res.json(studentDetail);
});

export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const students = await preceptorService.getAllStudents(userId);
  res.json(students);
});

// ===== ASISTENCIA MANUAL =====
export const registerManualAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, courseId, date, status, observations } = req.body;
  const { userId } = req.user as any;
  
  if (!studentId || !courseId || !date || !status) {
    throw new AppError('Todos los campos obligatorios deben ser proporcionados', 400);
  }
  
  const attendance = await preceptorService.registerManualAttendance({
    studentId,
    courseId,
    date,
    status,
    observations,
    preceptorId: userId
  });
  
  res.status(201).json(attendance);
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { recordId } = req.params;
  const { status, observations } = req.body;
  const { userId } = req.user as any;
  
  const attendance = await preceptorService.updateAttendance(Number(recordId), {
    status,
    observations,
    preceptorId: userId
  });
  
  res.json(attendance);
});

export const getAttendanceRecords = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, date, studentId } = req.query;
  const { userId } = req.user as any;
  
  const records = await preceptorService.getAttendanceRecords({
    courseId: courseId ? Number(courseId) : undefined,
    date: date as string,
    studentId: studentId ? Number(studentId) : undefined,
    preceptorId: userId
  });
  
  res.json(records);
});

export const getDailyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, date } = req.params;
  const { userId } = req.user as any;
  
  const dailyAttendance = await preceptorService.getDailyAttendance(Number(courseId), date, userId);
  res.json(dailyAttendance);
});

// ===== REPORTES =====
export const getAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, startDate, endDate, studentId } = req.query;
  const { userId } = req.user as any;
  
  const report = await preceptorService.getAttendanceReport({
    courseId: courseId ? Number(courseId) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    studentId: studentId ? Number(studentId) : undefined,
    preceptorId: userId
  });
  
  res.json(report);
});

export const getBehaviorReport = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, startDate, endDate, studentId } = req.query;
  const { userId } = req.user as any;
  
  const report = await preceptorService.getBehaviorReport({
    courseId: courseId ? Number(courseId) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    studentId: studentId ? Number(studentId) : undefined,
    preceptorId: userId
  });
  
  res.json(report);
});

export const getAcademicReport = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, startDate, endDate } = req.query;
  const { userId } = req.user as any;
  
  const report = await preceptorService.getAcademicReport({
    courseId: courseId ? Number(courseId) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    preceptorId: userId
  });
  
  res.json(report);
});

// ===== ALERTAS =====
export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { type, priority, status } = req.query;
  const { userId } = req.user as any;
  
  const alerts = await preceptorService.getAlerts({
    type: type as string,
    priority: priority as string,
    status: status as string,
    preceptorId: userId
  });
  
  res.json(alerts);
});

export const createAlert = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, courseId, type, priority, title, description } = req.body;
  const { userId } = req.user as any;
  
  if (!studentId || !type || !priority || !title) {
    throw new AppError('Los campos obligatorios deben ser proporcionados', 400);
  }
  
  const alert = await preceptorService.createAlert({
    studentId,
    courseId,
    type,
    priority,
    title,
    description,
    preceptorId: userId
  });
  
  res.status(201).json(alert);
});

export const updateAlert = asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const { status, comments } = req.body;
  const { userId } = req.user as any;
  
  const alert = await preceptorService.updateAlert(Number(alertId), {
    status,
    comments,
    preceptorId: userId
  });
  
  res.json(alert);
});

export const deleteAlert = asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const { userId } = req.user as any;
  
  await preceptorService.deleteAlert(Number(alertId), userId);
  res.json({ message: 'Alerta eliminada exitosamente' });
});

// ===== SANCIONES =====
export const getSanctions = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, courseId, status } = req.query;
  const { userId } = req.user as any;
  
  const sanctions = await preceptorService.getSanctions({
    studentId: studentId ? Number(studentId) : undefined,
    courseId: courseId ? Number(courseId) : undefined,
    status: status as string,
    preceptorId: userId
  });
  
  res.json(sanctions);
});

export const createSanction = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, courseId, type, severity, description, startDate, endDate } = req.body;
  const { userId } = req.user as any;
  
  if (!studentId || !type || !severity || !description || !startDate) {
    throw new AppError('Los campos obligatorios deben ser proporcionados', 400);
  }
  
  const sanction = await preceptorService.createSanction({
    studentId,
    courseId,
    type,
    severity,
    description,
    startDate,
    endDate,
    preceptorId: userId
  });
  
  res.status(201).json(sanction);
});

export const updateSanction = asyncHandler(async (req: Request, res: Response) => {
  const { sanctionId } = req.params;
  const { status, comments } = req.body;
  const { userId } = req.user as any;
  
  const sanction = await preceptorService.updateSanction(Number(sanctionId), {
    status,
    comments,
    preceptorId: userId
  });
  
  res.json(sanction);
});

// ===== COMUNICADOS =====
export const getCommunications = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, type, status } = req.query;
  const { userId } = req.user as any;
  
  const communications = await preceptorService.getCommunications({
    courseId: courseId ? Number(courseId) : undefined,
    type: type as string,
    status: status as string,
    preceptorId: userId
  });
  
  res.json(communications);
});

export const createCommunication = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, type, title, content, targetAudience, priority } = req.body;
  const { userId } = req.user as any;
  
  if (!type || !title || !content || !targetAudience) {
    throw new AppError('Los campos obligatorios deben ser proporcionados', 400);
  }
  
  const communication = await preceptorService.createCommunication({
    courseId,
    type,
    title,
    content,
    targetAudience,
    priority,
    preceptorId: userId
  });
  
  res.status(201).json(communication);
});

export const updateCommunication = asyncHandler(async (req: Request, res: Response) => {
  const { communicationId } = req.params;
  const { status } = req.body;
  const { userId } = req.user as any;
  
  const communication = await preceptorService.updateCommunication(Number(communicationId), {
    status,
    preceptorId: userId
  });
  
  res.json(communication);
});

// ===== ESTADÍSTICAS =====
export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, period } = req.query;
  const { userId } = req.user as any;
  
  const statistics = await preceptorService.getStatistics({
    courseId: courseId ? Number(courseId) : undefined,
    period: period as string,
    preceptorId: userId
  });
  
  res.json(statistics);
});