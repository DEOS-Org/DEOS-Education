import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: string;
  action: string;
  message: string;
  userId?: string;
  userEmail?: string;
  ip: string;
  userAgent?: string;
  details?: any;
  duration?: number;
  statusCode?: number;
}

interface LogFilter {
  level?: string[];
  category?: string[];
  action?: string[];
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface LogStats {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  topCategories: { category: string; count: number }[];
  topActions: { action: string; count: number }[];
  topUsers: { userId: string; userEmail: string; count: number }[];
  recentErrors: LogEntry[];
  hourlyActivity: { hour: string; count: number }[];
}

// Mock data for demonstration - in production this would come from a real logging system
const generateMockLogs = (count: number = 100): LogEntry[] => {
  const levels: Array<'error' | 'warn' | 'info' | 'debug'> = ['error', 'warn', 'info', 'debug'];
  const categories = ['auth', 'biometric', 'academic', 'reports', 'system', 'backup', 'users', 'notifications'];
  const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'SYNC', 'ERROR', 'WARNING'];
  const users = [
    { id: '1', email: 'admin@colegio.edu' },
    { id: '2', email: 'director@colegio.edu' },
    { id: '3', email: 'profesor@colegio.edu' },
    { id: '4', email: 'preceptor@colegio.edu' },
    { id: '5', email: 'secretaria@colegio.edu' }
  ];
  
  const messages = {
    error: [
      'Error de conexión con dispositivo biométrico',
      'Fallo en la autenticación del usuario',
      'Error al procesar backup automático',
      'Excepción no controlada en generación de reportes',
      'Error de base de datos en consulta de estudiantes'
    ],
    warn: [
      'Intento de login con credenciales incorrectas',
      'Dispositivo biométrico no responde',
      'Memoria del sistema por encima del 80%',
      'Usuario inactivo por más de 60 minutos',
      'Backup tardó más tiempo del esperado'
    ],
    info: [
      'Usuario inició sesión exitosamente',
      'Backup completado correctamente',
      'Reporte de asistencia generado',
      'Configuración del sistema actualizada',
      'Sincronización biométrica completada'
    ],
    debug: [
      'Consultando datos de estudiante',
      'Procesando solicitud de API',
      'Ejecutando tarea programada',
      'Validando permisos de usuario',
      'Cargando configuración del sistema'
    ]
  };

  const logs: LogEntry[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    logs.push({
      id: (i + 1).toString(),
      timestamp,
      level,
      category,
      action,
      message: messages[level][Math.floor(Math.random() * messages[level].length)],
      userId: user.id,
      userEmail: user.email,
      ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      duration: Math.floor(Math.random() * 5000) + 100,
      statusCode: level === 'error' ? 500 : level === 'warn' ? 400 : 200
    });
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const mockLogs = generateMockLogs(500);

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    level,
    category,
    action,
    userId,
    dateFrom,
    dateTo,
    search,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = req.query;

  let filteredLogs = [...mockLogs];

  // Apply filters
  if (level) {
    const levels = Array.isArray(level) ? level : [level];
    filteredLogs = filteredLogs.filter(log => levels.includes(log.level));
  }

  if (category) {
    const categories = Array.isArray(category) ? category : [category];
    filteredLogs = filteredLogs.filter(log => categories.includes(log.category));
  }

  if (action) {
    const actions = Array.isArray(action) ? action : [action];
    filteredLogs = filteredLogs.filter(log => actions.includes(log.action));
  }

  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom as string);
    filteredLogs = filteredLogs.filter(log => log.timestamp >= fromDate);
  }

  if (dateTo) {
    const toDate = new Date(dateTo as string);
    filteredLogs = filteredLogs.filter(log => log.timestamp <= toDate);
  }

  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filteredLogs = filteredLogs.filter(log =>
      log.message.toLowerCase().includes(searchTerm) ||
      log.userEmail?.toLowerCase().includes(searchTerm) ||
      log.category.toLowerCase().includes(searchTerm) ||
      log.action.toLowerCase().includes(searchTerm)
    );
  }

  // Apply sorting
  filteredLogs.sort((a, b) => {
    let aValue = a[sortBy as keyof LogEntry] as any;
    let bValue = b[sortBy as keyof LogEntry] as any;

    if (sortBy === 'timestamp') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    } else {
      return aValue > bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredLogs.length / Number(limit));

  res.json({
    data: paginatedLogs,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalItems: filteredLogs.length,
      itemsPerPage: Number(limit),
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    }
  });
});

export const getLogStats = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query;
  
  let logs = [...mockLogs];

  // Apply date filter if provided
  if (dateFrom) {
    const fromDate = new Date(dateFrom as string);
    logs = logs.filter(log => log.timestamp >= fromDate);
  }

  if (dateTo) {
    const toDate = new Date(dateTo as string);
    logs = logs.filter(log => log.timestamp <= toDate);
  }

  // Calculate statistics
  const stats: LogStats = {
    totalLogs: logs.length,
    errorCount: logs.filter(log => log.level === 'error').length,
    warnCount: logs.filter(log => log.level === 'warn').length,
    infoCount: logs.filter(log => log.level === 'info').length,
    debugCount: logs.filter(log => log.level === 'debug').length,
    topCategories: [],
    topActions: [],
    topUsers: [],
    recentErrors: logs.filter(log => log.level === 'error').slice(0, 10),
    hourlyActivity: []
  };

  // Top categories
  const categoryCount: { [key: string]: number } = {};
  logs.forEach(log => {
    categoryCount[log.category] = (categoryCount[log.category] || 0) + 1;
  });
  stats.topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top actions
  const actionCount: { [key: string]: number } = {};
  logs.forEach(log => {
    actionCount[log.action] = (actionCount[log.action] || 0) + 1;
  });
  stats.topActions = Object.entries(actionCount)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top users
  const userCount: { [key: string]: { email: string; count: number } } = {};
  logs.forEach(log => {
    if (log.userId && log.userEmail) {
      if (!userCount[log.userId]) {
        userCount[log.userId] = { email: log.userEmail, count: 0 };
      }
      userCount[log.userId].count++;
    }
  });
  stats.topUsers = Object.entries(userCount)
    .map(([userId, data]) => ({ userId, userEmail: data.email, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Hourly activity for the last 24 hours
  const hourlyCount: { [key: string]: number } = {};
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent24hLogs = logs.filter(log => log.timestamp >= last24Hours);
  
  for (let i = 0; i < 24; i++) {
    const hour = new Date(last24Hours.getTime() + i * 60 * 60 * 1000).getHours();
    hourlyCount[hour.toString().padStart(2, '0')] = 0;
  }

  recent24hLogs.forEach(log => {
    const hour = log.timestamp.getHours().toString().padStart(2, '0');
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
  });

  stats.hourlyActivity = Object.entries(hourlyCount)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  res.json({ data: stats });
});

export const getLogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const log = mockLogs.find(log => log.id === id);
  
  if (!log) {
    throw new AppError('Log no encontrado', 404);
  }
  
  res.json({ data: log });
});

export const exportLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    format = 'json',
    level,
    category,
    dateFrom,
    dateTo
  } = req.query;

  let logs = [...mockLogs];

  // Apply filters (same as getLogs)
  if (level) {
    const levels = Array.isArray(level) ? level : [level];
    logs = logs.filter(log => levels.includes(log.level));
  }

  if (category) {
    const categories = Array.isArray(category) ? category : [category];
    logs = logs.filter(log => categories.includes(log.category));
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom as string);
    logs = logs.filter(log => log.timestamp >= fromDate);
  }

  if (dateTo) {
    const toDate = new Date(dateTo as string);
    logs = logs.filter(log => log.timestamp <= toDate);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
  const filename = `logs_export_${timestamp}`;

  if (format === 'csv') {
    // Generate CSV
    const csvHeader = 'Timestamp,Level,Category,Action,Message,User,IP,Status Code\n';
    const csvData = logs.map(log => 
      `"${log.timestamp.toISOString()}","${log.level}","${log.category}","${log.action}","${log.message}","${log.userEmail || ''}","${log.ip}","${log.statusCode || ''}"`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csvHeader + csvData);
  } else {
    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({ 
      exportInfo: {
        timestamp: new Date(),
        totalLogs: logs.length,
        filters: { level, category, dateFrom, dateTo }
      },
      logs 
    });
  }
});

export const clearOldLogs = asyncHandler(async (req: Request, res: Response) => {
  const { daysOld = 30 } = req.body;
  
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const initialCount = mockLogs.length;
  
  // In a real implementation, this would delete from database
  // mockLogs.splice(0, mockLogs.length, ...mockLogs.filter(log => log.timestamp >= cutoffDate));
  
  const deletedCount = mockLogs.filter(log => log.timestamp < cutoffDate).length;
  
  res.json({
    message: `Logs más antiguos que ${daysOld} días han sido eliminados`,
    deletedCount,
    remainingCount: initialCount - deletedCount
  });
});

export const getLogCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = [...new Set(mockLogs.map(log => log.category))].sort();
  res.json({ data: categories });
});

export const getLogActions = asyncHandler(async (req: Request, res: Response) => {
  const actions = [...new Set(mockLogs.map(log => log.action))].sort();
  res.json({ data: actions });
});

export const getLogUsers = asyncHandler(async (req: Request, res: Response) => {
  const usersMap = new Map();
  
  mockLogs.forEach(log => {
    if (log.userId && log.userEmail) {
      usersMap.set(log.userId, { id: log.userId, email: log.userEmail });
    }
  });
  
  const users = Array.from(usersMap.values()).sort((a, b) => a.email.localeCompare(b.email));
  res.json({ data: users });
});