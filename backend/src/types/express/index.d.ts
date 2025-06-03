import 'express';

// Ajusta el tipo UserPayload según lo que guardes en el JWT
export interface UserPayload {
  id: number;
  email: string;
  roles: string[];
  [key: string]: any;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}
