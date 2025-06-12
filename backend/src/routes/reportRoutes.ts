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

export default router;