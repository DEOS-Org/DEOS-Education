import { Router } from 'express';
import * as academicController from '../controllers/academicController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ===== RUTAS DE CURSOS =====
router.get('/cursos', academicController.getCursos);
router.post('/cursos', authorizeRoles('admin'), academicController.createCurso);
router.put('/cursos/:id', authorizeRoles('admin'), academicController.updateCurso);
router.delete('/cursos/:id', authorizeRoles('admin'), academicController.deleteCurso);

// ===== RUTAS DE DIVISIONES =====
router.get('/divisiones', academicController.getDivisiones);
router.get('/divisiones/:id/detail', academicController.getDivisionDetail);
router.get('/divisiones/:id/attendance/:fecha', academicController.getDailyAttendanceDetail);
router.get('/cursos/:cursoId/divisiones', academicController.getDivisionesByCurso);
router.post('/divisiones', authorizeRoles('admin'), academicController.createDivision);
router.put('/divisiones/:id', authorizeRoles('admin'), academicController.updateDivision);
router.delete('/divisiones/:id', authorizeRoles('admin'), academicController.deleteDivision);

// ===== RUTAS DE MATERIAS =====
router.get('/materias', academicController.getMaterias);
router.post('/materias', authorizeRoles('admin'), academicController.createMateria);
router.put('/materias/:id', authorizeRoles('admin'), academicController.updateMateria);
router.delete('/materias/:id', authorizeRoles('admin'), academicController.deleteMateria);

// ===== RUTAS DE HORARIOS =====
router.get('/horarios', academicController.getHorarios);
router.get('/cursos/:cursoId/horarios', academicController.getHorariosByCurso);
router.post('/horarios', authorizeRoles('admin'), academicController.createHorario);
router.put('/horarios/:id', authorizeRoles('admin'), academicController.updateHorario);
router.delete('/horarios/:id', authorizeRoles('admin'), academicController.deleteHorario);

// ===== RUTAS PARA NAVEGACIÓN DE CURSO-DIVISIÓN =====
router.get('/curso-division/:cursoDivisionId/details', academicController.getCursoDivisionDetails);
router.get('/curso-division/:cursoDivisionId/estudiantes', academicController.getEstudiantesByCursoDivision);
router.get('/curso-division/:cursoDivisionId/profesores', academicController.getProfesoresByCursoDivision);
router.get('/curso-division/:cursoDivisionId/asistencia', academicController.getRegistrosAsistenciaByCursoDivision);

// ===== RUTAS DE ASIGNACIONES =====
router.get('/asignaciones', academicController.getAsignaciones);
router.post('/asignaciones', authorizeRoles('admin'), academicController.assignProfesorToMateria);
router.delete('/asignaciones/:profesorId/:materiaId', authorizeRoles('admin'), academicController.removeProfesorFromMateria);

// ===== RUTA TEMPORAL PARA DATOS DE PRUEBA =====
router.post('/create-test-data', authorizeRoles('admin'), academicController.createTestData);

export default router; 