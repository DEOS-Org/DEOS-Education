import { Router } from 'express';
import {
  assignSubjectToProfessor,
  removeSubjectFromProfessor,
  getProfessorAssignments,
  assignProfessorToClass,
  removeProfessorFromClass,
  assignStudentToCourse,
  removeStudentFromCourse,
  getAllProfessors,
  getAllStudents,
  getAllSubjects,
  getAllClasses,
  getAllCourseDivisions
} from '../controllers/adminAssignmentController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(requireRole(['admin']));

// Gestión de asignaciones de materias a profesores
router.post('/professors/subjects', assignSubjectToProfessor);
router.delete('/professors/:professorId/subjects/:materiaId', removeSubjectFromProfessor);
router.get('/professors/:professorId/assignments', getProfessorAssignments);

// Gestión de asignaciones de profesores a clases
router.post('/professors/classes', assignProfessorToClass);
router.delete('/classes/:cursoDivisionMateriaId/professor', removeProfessorFromClass);

// Gestión de asignaciones de estudiantes a cursos
router.post('/students/courses', assignStudentToCourse);
router.delete('/students/:studentId/courses/:cursoDivisionId', removeStudentFromCourse);

// Endpoints para obtener datos de referencia
router.get('/professors', getAllProfessors);
router.get('/students', getAllStudents);
router.get('/subjects', getAllSubjects);
router.get('/classes', getAllClasses);
router.get('/course-divisions', getAllCourseDivisions);

export default router;