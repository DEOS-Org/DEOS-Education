import { Router } from 'express';
import {
  getDashboard,
  getSubjects,
  getClasses,
  getClassStudents,
  getAllStudents,
  getSchedule,
  justifyAbsence,
  getClassAttendance,
  recordGrade,
  getClassGrades,
  getAttendanceReport,
  getGradesReport,
  updateGrade,
  deleteGrade
} from '../controllers/professorController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y rol de profesor
router.use(authenticate);
router.use(requireRole(['profesor', 'admin']));

// Dashboard
router.get('/dashboard', getDashboard);

// Materias y clases
router.get('/subjects', getSubjects);
router.get('/classes', getClasses);
router.get('/classes/:classId/students', getClassStudents);

// Estudiantes
router.get('/students', getAllStudents);

// Horario
router.get('/schedule', getSchedule);

// Asistencia (solo consulta y justificación)
router.get('/classes/:classId/attendance', getClassAttendance);
router.post('/attendance/justify', justifyAbsence);

// Calificaciones
router.post('/grades', recordGrade);
router.get('/classes/:classId/grades', getClassGrades);
router.put('/grades/:gradeId', updateGrade);
router.delete('/grades/:gradeId', deleteGrade);

// Reportes
router.get('/classes/:classId/attendance-report', getAttendanceReport);
router.get('/classes/:classId/grades-report', getGradesReport);

export default router;