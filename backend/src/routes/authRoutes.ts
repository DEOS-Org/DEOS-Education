import { Router, Request, Response, NextFunction } from 'express';
import { login, register, requestPasswordReset, resetPassword, changePassword } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Wrapper para manejar errores async y evitar el error de tipado
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rutas públicas
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/request-password-reset', asyncHandler(requestPasswordReset));
router.post('/reset-password', asyncHandler(resetPassword));

// Rutas protegidas
router.post('/change-password', authenticate, asyncHandler(changePassword));

export default router;