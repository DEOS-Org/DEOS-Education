import express, { Request, Response, NextFunction } from 'express';
import { sequelize } from '../models';
import {
  getNotasAlumno,
  getNotasHijos,
  getPromediosAlumno,
  crearNota,
  actualizarNota,
  eliminarNota,
  getTiposEvaluacion
} from '../controllers/notasController';

const router = express.Router();

// Las rutas de notas ya tienen autenticación aplicada desde app.ts

// Middleware para verificar roles específicos
const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction): any => {
    if (!req.user || !req.user.roles) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }
    
    const userRoles = req.user.roles.map((role: any) => role.nombre);
    const hasRequiredRole = roles.some((role: any) => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
      return;
    }
    
    next();
  };
};

// Middleware para verificar acceso a datos del alumno
const verifyStudentAccess = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { alumnoId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles.map((role: any) => role.nombre);
    
    // Admin y preceptor pueden ver cualquier alumno
    if (userRoles.includes('admin') || userRoles.includes('preceptor')) {
      return next();
    }
    
    // Profesor puede ver alumnos de sus materias
    if (userRoles.includes('profesor')) {
      const [results] = await sequelize.query(`
        SELECT 1 FROM profesor_materia pm
        JOIN usuario_curso uc ON pm.curso_id = uc.curso_id
        WHERE pm.profesor_usuario_id = ? AND uc.usuario_id = ?
      `, {
        replacements: [userId, alumnoId]
      });
      
      if ((results as any[]).length > 0) {
        return next();
      }
    }
    
    // Alumno puede ver solo sus propias notas
    if (userRoles.includes('estudiante') && parseInt(alumnoId) === userId) {
      return next();
    }
    
    // Padre puede ver notas de sus hijos
    if (userRoles.includes('padre')) {
      const [results] = await sequelize.query(`
        SELECT 1 FROM usuario_familia 
        WHERE tutor_usuario_id = ? AND alumno_usuario_id = ?
      `, {
        replacements: [userId, alumnoId]
      });
      
      if ((results as any[]).length > 0) {
        return next();
      }
    }
    
    res.status(403).json({
      success: false,
      message: 'No tiene permisos para acceder a las notas de este alumno'
    });
    return;
    
  } catch (error) {
    console.error('Error verificando acceso del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
    return;
  }
};

// Middleware para verificar acceso a datos de hijos (para padres)
const verifyParentAccess = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { padreId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles.map((role: any) => role.nombre);
    
    // Admin y preceptor pueden ver cualquier padre
    if (userRoles.includes('admin') || userRoles.includes('preceptor')) {
      return next();
    }
    
    // El padre solo puede ver sus propios hijos
    if (userRoles.includes('padre') && parseInt(padreId) === userId) {
      return next();
    }
    
    res.status(403).json({
      success: false,
      message: 'No tiene permisos para acceder a esta información'
    });
    return;
    
  } catch (error) {
    console.error('Error verificando acceso del padre:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
    return;
  }
};

// RUTAS

// Obtener tipos de evaluación (todos los roles autenticados)
router.get('/tipos-evaluacion', getTiposEvaluacion);

// Obtener notas de un alumno específico
router.get('/alumno/:alumnoId', verifyStudentAccess, getNotasAlumno);

// Obtener promedios de un alumno específico
router.get('/alumno/:alumnoId/promedios', verifyStudentAccess, getPromediosAlumno);

// Obtener notas de los hijos de un padre
router.get('/padre/:padreId/hijos', verifyParentAccess, getNotasHijos);

// Crear una nueva nota (solo profesor y admin)
router.post('/', requireRole(['profesor', 'admin']), crearNota);

// Actualizar una nota existente (solo profesor y admin)
router.put('/:notaId', requireRole(['profesor', 'admin']), actualizarNota);

// Eliminar una nota (solo profesor y admin)
router.delete('/:notaId', requireRole(['profesor', 'admin']), eliminarNota);

export default router;