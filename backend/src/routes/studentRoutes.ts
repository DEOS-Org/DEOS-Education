import { Router } from 'express';
import * as studentController from '../controllers/studentController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(authorizeRoles('alumno'));

// ===== DASHBOARD =====
router.get('/dashboard', studentController.getDashboard);

// ===== ATTENDANCE =====
router.get('/attendance', studentController.getMyAttendance);
router.get('/attendance/stats', studentController.getAttendanceStats);

// ===== SCHEDULE =====
router.get('/schedule', studentController.getMySchedule);
router.get('/schedule/today', studentController.getTodaySchedule);

// ===== GRADES =====
router.get('/grades', studentController.getMyGrades);
router.get('/grades/subject/:materiaId', studentController.getGradesBySubject);
router.get('/grades/summary', studentController.getGradesSummary);

// ===== SUBJECTS =====
router.get('/subjects', studentController.getMySubjects);
router.get('/subjects/:materiaId', studentController.getSubjectDetail);

// ===== PROFILE =====
router.get('/profile', studentController.getMyProfile);
router.put('/profile', studentController.updateProfile);

// ===== ASSIGNMENTS =====
router.get('/assignments', studentController.getMyAssignments);
router.get('/assignments/:assignmentId', studentController.getAssignmentDetail);

// ===== CALENDAR =====
router.get('/calendar/events', studentController.getCalendarEvents);
router.get('/calendar/upcoming', studentController.getUpcomingEvents);

// ===== ACADEMIC INFO =====
router.get('/course', studentController.getMyCourse);
router.get('/classmates', studentController.getClassmates);

// ===== COMMUNICATIONS =====
router.get('/comunicados', studentController.getComunicados);
router.get('/mensajes', studentController.getMensajes);
router.post('/mensajes', studentController.sendMessage);

export default router;