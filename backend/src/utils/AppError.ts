export class AppError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number = 400, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'AppError';
  }
} 