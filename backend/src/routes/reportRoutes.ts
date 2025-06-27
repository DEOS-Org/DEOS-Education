import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import * as reportController from '../controllers/reportController';

const router = Router();

// Wrapper para manejar errores async
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Todas las rutas requieren autenticación
router.use(authenticate);

// === REPORTES DE ASISTENCIA ===

// Reporte general de asistencia (admin, preceptor, profesor)
router.get('/attendance', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.getAttendanceReport)
);

// Resumen de asistencia con estadísticas (admin, preceptor)
router.get('/attendance/summary', 
  authorizeRoles('admin', 'preceptor'), 
  asyncHandler(reportController.getAttendanceSummary)
);

// Reporte de asistencia por materia (admin, preceptor, profesor)
router.get('/attendance/subject/:curso_division_materia_id', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.getSubjectAttendanceReport)
);

// === REPORTES DE PROFESORES ===

// Reporte de horarios y materias de un profesor (admin, el mismo profesor)
router.get('/teacher/:profesor_id', 
  authorizeRoles('admin', 'profesor'), 
  asyncHandler(reportController.getTeacherReport)
);

// === NUEVOS REPORTES ===

// Reporte de rendimiento académico (admin, preceptor, profesor)
router.get('/academic-performance', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.getAcademicPerformanceReport)
);

// Reporte de estadísticas generales (admin, preceptor)
router.get('/statistics', 
  authorizeRoles('admin', 'preceptor'), 
  asyncHandler(reportController.getStatisticsReport)
);

// === EXPORTACIONES ===

// Exportar asistencia a Excel
router.get('/attendance/export/excel', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.exportAttendanceToExcel)
);

// Exportar asistencia a PDF
router.get('/attendance/export/pdf', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.exportAttendanceToPDF)
);

// Exportar rendimiento académico a Excel
router.get('/academic-performance/export/excel', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.exportPerformanceToExcel)
);

// Exportar rendimiento académico a PDF
router.get('/academic-performance/export/pdf', 
  authorizeRoles('admin', 'preceptor', 'profesor'), 
  asyncHandler(reportController.exportPerformanceToPDF)
);

export default router;