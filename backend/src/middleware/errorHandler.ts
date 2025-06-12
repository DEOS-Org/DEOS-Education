import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { ValidationError, UniqueConstraintError } from 'sequelize';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  // Errores personalizados de la aplicación
  if (err instanceof AppError) {
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
      errors: err.errors
    });
    return;
  }

  // Errores de validación de Sequelize
  if (err instanceof ValidationError) {
    res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
    return;
  }

  // Errores de unicidad de Sequelize
  if (err instanceof UniqueConstraintError) {
    res.status(400).json({
      status: 'error',
      message: 'Error de unicidad',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
    return;
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido'
    });
    return;
  }

  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Token expirado'
    });
    return;
  }

  // Error por defecto
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor'
  });
}; 