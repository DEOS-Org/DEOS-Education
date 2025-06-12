import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../types/express';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);

  const error = err as AppError;

  // Si es un error de Sequelize
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    res.status(400).json({
      message: 'Error de validación',
      errors: error.errors?.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
    return;
  }

  // Si es un error personalizado con código de estado
  if (error.statusCode) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  // Error por defecto
  res.status(500).json({
    message: 'Error interno del servidor'
  });
}; 