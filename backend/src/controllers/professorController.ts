import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as professorService from '../services/professorService';

// ===== DASHBOARD =====
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  if (!professorId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const dashboardData = await professorService.getDashboardData(professorId);
  res.json(dashboardData);
});

// ===== CLASES ASIGNADAS =====
export const getClases = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  if (!professorId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const clases = await professorService.getClasesAsignadas(professorId);
  res.json(clases);
});

export const getClaseDetail = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const professorId = req.user?.id;
  
  const claseDetail = await professorService.getClaseDetail(Number(claseId), professorId);
  res.json(claseDetail);
});

// ===== ESTUDIANTES =====
export const getEstudiantesByClase = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const professorId = req.user?.id;
  
  const estudiantes = await professorService.getEstudiantesByClase(Number(claseId), professorId);
  res.json(estudiantes);
});

export const getEstudianteDetail = asyncHandler(async (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const professorId = req.user?.id;
  
  const estudianteDetail = await professorService.getEstudianteDetail(Number(estudianteId), professorId);
  res.json(estudianteDetail);
});

// ===== ASISTENCIA =====
export const getAsistencia = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const { fechaDesde, fechaHasta } = req.query;
  const professorId = req.user?.id;
  
  const asistencia = await professorService.getAsistenciaByClase(
    Number(claseId),
    professorId,
    fechaDesde as string,
    fechaHasta as string
  );
  res.json(asistencia);
});

export const registrarAsistencia = asyncHandler(async (req: Request, res: Response) => {
  const { claseId, estudianteId, fecha, estado, observaciones } = req.body;
  const professorId = req.user?.id;
  
  if (!claseId || !estudianteId || !fecha || !estado) {
    throw new AppError('Clase, estudiante, fecha y estado son requeridos', 400);
  }
  
  const asistencia = await professorService.registrarAsistencia({
    claseId: Number(claseId),
    estudianteId: Number(estudianteId),
    professorId,
    fecha,
    estado,
    observaciones
  });
  
  res.status(201).json(asistencia);
});

export const updateAsistencia = asyncHandler(async (req: Request, res: Response) => {
  const { asistenciaId } = req.params;
  const { estado, observaciones } = req.body;
  const professorId = req.user?.id;
  
  const asistencia = await professorService.updateAsistencia(
    Number(asistenciaId),
    professorId,
    { estado, observaciones }
  );
  
  res.json(asistencia);
});

// ===== CALIFICACIONES =====
export const getCalificaciones = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const { periodo } = req.query;
  const professorId = req.user?.id;
  
  const calificaciones = await professorService.getCalificacionesByClase(
    Number(claseId),
    professorId,
    periodo as string
  );
  res.json(calificaciones);
});

export const crearCalificacion = asyncHandler(async (req: Request, res: Response) => {
  const { claseId, estudianteId, tipo_evaluacion_id, calificacion, fecha, observaciones } = req.body;
  const professorId = req.user?.id;
  
  if (!claseId || !estudianteId || !tipo_evaluacion_id || !calificacion || !fecha) {
    throw new AppError('Todos los campos obligatorios son requeridos', 400);
  }
  
  const nuevaCalificacion = await professorService.crearCalificacion({
    claseId: Number(claseId),
    estudianteId: Number(estudianteId),
    professorId,
    tipo_evaluacion_id: Number(tipo_evaluacion_id),
    calificacion: Number(calificacion),
    fecha,
    observaciones
  });
  
  res.status(201).json(nuevaCalificacion);
});

export const updateCalificacion = asyncHandler(async (req: Request, res: Response) => {
  const { calificacionId } = req.params;
  const { calificacion, observaciones } = req.body;
  const professorId = req.user?.id;
  
  const calificacionUpdated = await professorService.updateCalificacion(
    Number(calificacionId),
    professorId,
    { calificacion: Number(calificacion), observaciones }
  );
  
  res.json(calificacionUpdated);
});

export const deleteCalificacion = asyncHandler(async (req: Request, res: Response) => {
  const { calificacionId } = req.params;
  const professorId = req.user?.id;
  
  await professorService.deleteCalificacion(Number(calificacionId), professorId);
  res.json({ message: 'Calificación eliminada exitosamente' });
});

// ===== HORARIOS =====
export const getHorarios = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  if (!professorId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const horarios = await professorService.getHorarios(professorId);
  res.json(horarios);
});

// ===== REPORTES =====
export const getReporteAsistencia = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const { fechaDesde, fechaHasta } = req.query;
  const professorId = req.user?.id;
  
  const reporte = await professorService.getReporteAsistencia(
    Number(claseId),
    professorId,
    fechaDesde as string,
    fechaHasta as string
  );
  res.json(reporte);
});

export const getReporteCalificaciones = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const { periodo } = req.query;
  const professorId = req.user?.id;
  
  const reporte = await professorService.getReporteCalificaciones(
    Number(claseId),
    professorId,
    periodo as string
  );
  res.json(reporte);
});

export const getReporteEstudiante = asyncHandler(async (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const { periodo } = req.query;
  const professorId = req.user?.id;
  
  const reporte = await professorService.getReporteEstudiante(
    Number(estudianteId),
    professorId,
    periodo as string
  );
  res.json(reporte);
});

// ===== CONFIGURACIÓN =====
export const getConfiguracion = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  if (!professorId) {
    throw new AppError('Usuario no autenticado', 401);
  }
  
  const configuracion = await professorService.getConfiguracion(professorId);
  res.json(configuracion);
});

export const updateConfiguracion = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  const { notificaciones, tema, idioma } = req.body;
  
  const configuracion = await professorService.updateConfiguracion(professorId, {
    notificaciones,
    tema,
    idioma
  });
  
  res.json(configuracion);
});

// ===== TIPOS DE EVALUACIÓN =====
export const getTiposEvaluacion = asyncHandler(async (_req: Request, res: Response) => {
  const tiposEvaluacion = await professorService.getTiposEvaluacion();
  res.json(tiposEvaluacion);
});

// ===== SISTEMA AVANZADO DE CALIFICACIONES =====

export const crearNotaAvanzada = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  const {
    alumno_usuario_id,
    materia_id,
    tipo_evaluacion_id,
    calificacion,
    observaciones,
    trimestre,
    fecha
  } = req.body;

  const nota = await professorService.crearNotaAvanzada({
    alumno_usuario_id,
    materia_id,
    tipo_evaluacion_id,
    calificacion,
    observaciones,
    trimestre,
    fecha
  }, professorId);

  res.status(201).json(nota);
});

export const updateNotaAvanzada = asyncHandler(async (req: Request, res: Response) => {
  const { notaId } = req.params;
  const professorId = req.user?.id;
  const { calificacion, observaciones, trimestre, fecha } = req.body;

  const nota = await professorService.updateNotaAvanzada(
    Number(notaId),
    { calificacion, observaciones, trimestre, fecha },
    professorId
  );

  res.json(nota);
});

export const deleteNotaAvanzada = asyncHandler(async (req: Request, res: Response) => {
  const { notaId } = req.params;
  const professorId = req.user?.id;

  const result = await professorService.deleteNotaAvanzada(Number(notaId), professorId);
  res.json(result);
});

export const calcularPromediosClase = asyncHandler(async (req: Request, res: Response) => {
  const { claseId } = req.params;
  const { trimestre } = req.query;

  const promedios = await professorService.calcularPromediosClase(
    Number(claseId),
    trimestre ? Number(trimestre) : undefined
  );

  res.json(promedios);
});

export const obtenerEstadisticasCalificaciones = asyncHandler(async (req: Request, res: Response) => {
  const professorId = req.user?.id;
  const { claseId } = req.query;

  if (!professorId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const estadisticas = await professorService.obtenerEstadisticasCalificaciones(
    professorId,
    claseId ? Number(claseId) : undefined
  );

  res.json(estadisticas);
});

export const generarBoletinEstudiante = asyncHandler(async (req: Request, res: Response) => {
  const { estudianteId } = req.params;
  const { trimestre } = req.query;

  const boletin = await professorService.generarBoletinEstudiante(
    Number(estudianteId),
    trimestre ? Number(trimestre) : undefined
  );

  res.json(boletin);
});