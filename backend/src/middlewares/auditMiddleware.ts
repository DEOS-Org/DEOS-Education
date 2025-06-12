import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/logService';

// Middleware para auditar automáticamente las acciones de los usuarios
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Capturar la respuesta original
  const originalSend = res.send;
  
  // Interceptar el envío de la respuesta
  res.send = function(data: any) {
    // Solo loguear si la operación fue exitosa (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Determinar la acción basada en el método y la ruta
      const action = determineAction(req.method, req.path);
      
      if (action && req.user) {
        // Loguear la acción de forma asíncrona (no bloqueante)
        logService.logUserAction(
          req.user.id,
          `${action} - ${req.method} ${req.path}`,
          'API_AUDIT',
          req.ip
        ).catch(err => {
          console.error('Error logging audit:', err);
        });
      }
    }
    
    // Llamar al método original
    return originalSend.call(this, data);
  };
  
  next();
};

// Función para determinar la acción basada en método HTTP y ruta
const determineAction = (method: string, path: string): string | null => {
  // No auditar ciertas rutas
  if (path.includes('/logs') || path.includes('/health')) {
    return null;
  }
  
  const actionMap: { [key: string]: string } = {
    'POST': 'Crear',
    'PUT': 'Actualizar',
    'PATCH': 'Modificar',
    'DELETE': 'Eliminar',
    'GET': method === 'GET' && path.includes('/users/') ? 'Consultar' : ''
  };
  
  return actionMap[method] || '';
};

// Middleware específico para operaciones críticas
export const criticalAuditMiddleware = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Capturar datos antes de la operación
    const startTime = Date.now();
    
    // Capturar la respuesta
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const duration = Date.now() - startTime;
      
      if (req.user) {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        const description = `${operation} - ${success ? 'EXITOSO' : 'FALLIDO'} (${duration}ms)`;
        
        logService.logUserAction(
          req.user.id,
          description,
          'OPERACION_CRITICA',
          req.ip
        ).catch(err => {
          console.error('Error logging critical operation:', err);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};