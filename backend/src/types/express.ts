export interface UserPayload {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    usuario_id: number;
    email: string;
    nombre: string;
    apellido: string;
    roles: string[];
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}