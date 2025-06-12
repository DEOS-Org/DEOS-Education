import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import * as horarioController from '../controllers/horarioController';

const router = Router();

// Wrapper para manejar errores async
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Todas las rutas requieren autenticación
router.use(authenticate);

// === GESTIÓN DE HORARIOS ===

// Crear horario (solo admin)
router.post('/', authorizeRoles('admin'), asyncHandler(horarioController.createHorario));

// Obtener horario por ID
router.get('/:id', asyncHandler(horarioController.getHorarioById));

// Actualizar horario (solo admin)
router.put('/:id', authorizeRoles('admin'), asyncHandler(horarioController.updateHorario));

// Eliminar horario (solo admin)
router.delete('/:id', authorizeRoles('admin'), asyncHandler(horarioController.deleteHorario));

// === CONSULTAS ESPECÍFICAS ===

// Obtener horarios por curso-división
router.get('/curso/:curso_division_id', asyncHandler(horarioController.getHorariosByCurso));

// Obtener horarios por profesor
router.get('/profesor/:profesor_id', asyncHandler(horarioController.getHorariosByProfesor));

export default router;