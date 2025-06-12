import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserPayload } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      res.status(403).json({ 
        message: 'No autorizado',
        requiredRoles: roles,
        userRoles: req.user.roles
      });
      return;
    }

    next();
  };
};