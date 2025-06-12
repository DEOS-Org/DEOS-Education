"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.criticalAuditMiddleware = exports.auditMiddleware = void 0;
const logService = __importStar(require("../services/logService"));
// Middleware para auditar automáticamente las acciones de los usuarios
const auditMiddleware = (req, res, next) => {
    // Capturar la respuesta original
    const originalSend = res.send;
    // Interceptar el envío de la respuesta
    res.send = function (data) {
        // Solo loguear si la operación fue exitosa (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Determinar la acción basada en el método y la ruta
            const action = determineAction(req.method, req.path);
            if (action && req.user) {
                // Loguear la acción de forma asíncrona (no bloqueante)
                logService.logUserAction(req.user.id, `${action} - ${req.method} ${req.path}`, 'API_AUDIT', req.ip).catch(err => {
                    console.error('Error logging audit:', err);
                });
            }
        }
        // Llamar al método original
        return originalSend.call(this, data);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
// Función para determinar la acción basada en método HTTP y ruta
const determineAction = (method, path) => {
    // No auditar ciertas rutas
    if (path.includes('/logs') || path.includes('/health')) {
        return null;
    }
    const actionMap = {
        'POST': 'Crear',
        'PUT': 'Actualizar',
        'PATCH': 'Modificar',
        'DELETE': 'Eliminar',
        'GET': method === 'GET' && path.includes('/users/') ? 'Consultar' : ''
    };
    return actionMap[method] || '';
};
// Middleware específico para operaciones críticas
const criticalAuditMiddleware = (operation) => {
    return (req, res, next) => {
        // Capturar datos antes de la operación
        const startTime = Date.now();
        // Capturar la respuesta
        const originalSend = res.send;
        res.send = function (data) {
            const duration = Date.now() - startTime;
            if (req.user) {
                const success = res.statusCode >= 200 && res.statusCode < 300;
                const description = `${operation} - ${success ? 'EXITOSO' : 'FALLIDO'} (${duration}ms)`;
                logService.logUserAction(req.user.id, description, 'OPERACION_CRITICA', req.ip).catch(err => {
                    console.error('Error logging critical operation:', err);
                });
            }
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.criticalAuditMiddleware = criticalAuditMiddleware;
