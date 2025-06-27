import { Request, Response, NextFunction } from 'express';

interface JWTUser {
  id: number;
  email: string;
  roles: string[];
}

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get user from JWT token (set by authenticate middleware)
      const user = (req as any).user as JWTUser;
      
      if (!user) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      // Extract roles from user object
      let userRoles: string[] = [];
      
      if (user.roles) {
        if (Array.isArray(user.roles)) {
          // JWT format: roles is array of strings
          userRoles = user.roles.filter(role => role && typeof role === 'string');
        } else if (typeof user.roles === 'string') {
          // Single role as string
          userRoles = [user.roles];
        }
      }

      // Check if user has any of the required roles
      const hasPermission = allowedRoles.some(requiredRole => 
        userRoles.includes(requiredRole)
      );

      if (!hasPermission) {
        res.status(403).json({ 
          message: 'No tienes permisos para acceder a este recurso',
          requiredRoles: allowedRoles,
          userRoles: userRoles
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error in role middleware:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Alias for backwards compatibility
export const requireRole = checkRole;