import 'express';

// Ajusta el tipo UserPayload según lo que guardes en el JWT
export interface UserPayload {
  id: number;
  email: string;
  roles: string[];
  [key: string]: any;
}

// Error personalizado de la aplicación
export interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }

  interface Response {
    error?: (statusCode: number, message: string, errors?: any[]) => void;
  }
}
