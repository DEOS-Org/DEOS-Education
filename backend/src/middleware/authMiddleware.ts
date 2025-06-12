import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import * as userService from '../services/userService';
import { UserPayload } from '../types/express';

// Extender el tipo Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        roles: string[];
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };

    // Obtener el usuario y sus roles
    const user = await userService.findById(decoded.id);
    if (!user) {
      throw new AppError('No autorizado - Usuario no encontrado', 401);
    }

    const roles = await userService.getUserRoles(user.id!);

    // Agregar el usuario y sus roles al request
    req.user = {
      id: user.id!,
      email: user.email!,
      roles
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('No autorizado - Token inválido', 401));
    } else {
      next(error);
    }
  }
};

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('No autorizado - Usuario no autenticado', 401);
    }

    const hasAllowedRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      throw new AppError('No autorizado - Rol no permitido', 403);
    }

    next();
  };
}; 