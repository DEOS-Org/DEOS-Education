import { Router, Request, Response, NextFunction } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// Wrapper para manejar errores async y evitar el error de tipado
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/login', asyncHandler(login));

export default router;