import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import * as professorController from '../controllers/professorController';

const router = Router();

// Aplicar middleware de autenticación y autorización para todos los endpoints
router.use(authenticate);
router.use(authorizeRoles('profesor'));

// ===== DASHBOARD =====
router.get('/dashboard', professorController.getDashboard);

// ===== CLASES =====
router.get('/classes', professorController.getClases);
router.get('/classes/:claseId', professorController.getClaseDetail);

// ===== ESTUDIANTES =====
router.get('/classes/:claseId/students', professorController.getEstudiantesByClase);
router.get('/students/:estudianteId', professorController.getEstudianteDetail);

// ===== ASISTENCIA =====
router.get('/classes/:claseId/attendance', professorController.getAsistencia);
router.post('/attendance', professorController.registrarAsistencia);
router.put('/attendance/:asistenciaId', professorController.updateAsistencia);

// ===== CALIFICACIONES =====
router.get('/classes/:claseId/grades', professorController.getCalificaciones);
router.post('/grades', professorController.crearCalificacion);
router.put('/grades/:calificacionId', professorController.updateCalificacion);
router.delete('/grades/:calificacionId', professorController.deleteCalificacion);

// ===== HORARIOS =====
router.get('/schedule', professorController.getHorarios);

// ===== REPORTES =====
router.get('/classes/:claseId/reports/attendance', professorController.getReporteAsistencia);
router.get('/classes/:claseId/reports/grades', professorController.getReporteCalificaciones);
router.get('/students/:estudianteId/report', professorController.getReporteEstudiante);

// ===== CONFIGURACIÓN =====
router.get('/settings', professorController.getConfiguracion);
router.put('/settings', professorController.updateConfiguracion);

// ===== TIPOS DE EVALUACIÓN =====
router.get('/evaluation-types', professorController.getTiposEvaluacion);

export default router;