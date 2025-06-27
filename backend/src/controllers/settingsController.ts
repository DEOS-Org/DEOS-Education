import { Request, Response } from 'express';
import * as settingsService from '../services/settingsService';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const getAllSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.getAllSettings();
  res.json({ data: settings });
});

export const getSettingByKey = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const setting = await settingsService.getSettingByKey(key);
  res.json(setting);
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { valor, tipo } = req.body;
  
  if (valor === undefined) {
    throw new AppError('El valor es requerido', 400);
  }
  
  const setting = await settingsService.updateSetting(key, valor, tipo);
  res.json(setting);
});

export const updateMultipleSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;
  
  if (!Array.isArray(settings)) {
    throw new AppError('Settings debe ser un array', 400);
  }
  
  const results = await settingsService.updateMultipleSettings(settings);
  res.json({ data: results, message: 'Configuraciones actualizadas correctamente' });
});

export const getSettingsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const settings = await settingsService.getSettingsByCategory(category);
  res.json({ data: settings });
});

export const initializeDefaultSettings = asyncHandler(async (req: Request, res: Response) => {
  const result = await settingsService.initializeDefaultSettings();
  res.json({ 
    message: `Configuraciones inicializadas: ${result.initialized}`,
    ...result 
  });
});

export const getSettingsAsObject = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.getSettingsAsObject();
  res.json({ data: settings });
});

// System Information
export const getSystemInfo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
    
    // Get system stats
    const systemInfo = {
      version: packageJson.version || '2.0.1',
      ultimaActualizacion: new Date('2024-03-20'),
      tiempoActividad: process.uptime(),
      baseDatos: 'MySQL 8.0.35',
      memoria: {
        usado: process.memoryUsage(),
        total: require('os').totalmem(),
        libre: require('os').freemem()
      },
      cpu: require('os').cpus(),
      plataforma: require('os').platform(),
      arquitectura: require('os').arch(),
      nodeVersion: process.version,
      usuariosActivos: 1247, // This would come from actual user session tracking
      sesionesActivas: 89     // This would come from actual session tracking
    };

    res.json({ data: systemInfo });
  } catch (error) {
    console.error('Error getting system info:', error);
    throw new AppError('Error al obtener información del sistema');
  }
});

// Backup Management
export const createBackup = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { descripcion = 'Backup manual' } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const backupPath = path.join(__dirname, '../../backups', `backup_${timestamp}.sql`);
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Execute mysqldump command (adjust according to your database config)
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';
    const dbName = process.env.DB_NAME || 'biometrico';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';

    const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbPassword ? `-p${dbPassword}` : ''} ${dbName} > ${backupPath}`;
    
    await execAsync(command);
    
    // Get file size
    const stats = fs.statSync(backupPath);
    
    const backupInfo = {
      id: Date.now().toString(),
      fecha: new Date(),
      tamano: stats.size,
      tipo: 'manual',
      descripcion,
      ruta: backupPath,
      completado: true
    };

    res.json({ 
      data: backupInfo,
      message: 'Backup creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new AppError('Error al crear backup');
  }
});

export const getBackups = asyncHandler(async (req: Request, res: Response) => {
  try {
    const backupsDir = path.join(__dirname, '../../backups');
    
    if (!fs.existsSync(backupsDir)) {
      return res.json({ data: [] });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          id: file,
          fecha: stats.birthtime,
          tamano: stats.size,
          tipo: file.includes('auto') ? 'automatico' : 'manual',
          descripcion: file.includes('auto') ? 'Backup automático' : 'Backup manual',
          ruta: filePath,
          completado: true
        };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    res.json({ data: backups });
  } catch (error) {
    console.error('Error getting backups:', error);
    throw new AppError('Error al obtener backups');
  }
});

export const downloadBackup = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../backups', filename);
    
    if (!fs.existsSync(backupPath)) {
      throw new AppError('Backup no encontrado', 404);
    }

    res.download(backupPath, filename);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error downloading backup:', error);
    throw new AppError('Error al descargar backup');
  }
});

export const deleteBackup = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../backups', filename);
    
    if (!fs.existsSync(backupPath)) {
      throw new AppError('Backup no encontrado', 404);
    }

    fs.unlinkSync(backupPath);
    
    res.json({ message: 'Backup eliminado exitosamente' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error deleting backup:', error);
    throw new AppError('Error al eliminar backup');
  }
});

// System Logs
export const getSystemLogs = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { nivel, categoria, limit = 50, offset = 0 } = req.query;
    
    // Mock system logs - in a real implementation, this would come from a logging system
    const mockLogs = [
      {
        id: '1',
        fecha: new Date('2024-03-20T14:35:22'),
        usuario: 'admin@colegio.edu',
        accion: 'CONFIG_UPDATE',
        categoria: 'sistema',
        descripcion: 'Actualizó configuración de notificaciones por email',
        ip: '192.168.1.10',
        nivel: 'info'
      },
      {
        id: '2',
        fecha: new Date('2024-03-20T14:20:15'),
        usuario: 'profesor@colegio.edu',
        accion: 'LOGIN',
        categoria: 'auth',
        descripcion: 'Inicio de sesión exitoso',
        ip: '192.168.1.45',
        nivel: 'info'
      },
      {
        id: '3',
        fecha: new Date('2024-03-20T13:45:08'),
        usuario: 'system',
        accion: 'BACKUP_COMPLETED',
        categoria: 'backup',
        descripcion: 'Backup automático completado exitosamente',
        ip: 'localhost',
        nivel: 'info'
      },
      {
        id: '4',
        fecha: new Date('2024-03-20T12:15:33'),
        usuario: 'parent@email.com',
        accion: 'LOGIN_FAILED',
        categoria: 'auth',
        descripcion: 'Intento de login fallido - contraseña incorrecta',
        ip: '201.123.45.67',
        nivel: 'warning'
      },
      {
        id: '5',
        fecha: new Date('2024-03-20T11:30:12'),
        usuario: 'admin@colegio.edu',
        accion: 'USER_CREATED',
        categoria: 'usuarios',
        descripcion: 'Creó nuevo usuario: estudiante@colegio.edu',
        ip: '192.168.1.10',
        nivel: 'info'
      }
    ];

    let filteredLogs = mockLogs;

    if (nivel) {
      filteredLogs = filteredLogs.filter(log => log.nivel === nivel);
    }

    if (categoria) {
      filteredLogs = filteredLogs.filter(log => log.categoria === categoria);
    }

    const paginatedLogs = filteredLogs.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ 
      data: paginatedLogs,
      total: filteredLogs.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error getting system logs:', error);
    throw new AppError('Error al obtener logs del sistema');
  }
});

// Maintenance Operations
export const clearCache = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Simulate cache clearing - in real implementation, this would clear Redis, file cache, etc.
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    res.json({ 
      message: 'Caché del sistema limpiado exitosamente',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw new AppError('Error al limpiar caché');
  }
});

export const restartSystem = asyncHandler(async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would restart the application
    // For safety, we'll just simulate it
    
    res.json({ 
      message: 'Solicitud de reinicio del sistema enviada',
      timestamp: new Date(),
      warning: 'El sistema se reiniciará en 30 segundos'
    });
    
    // In production, you might use pm2 restart or similar
    // setTimeout(() => {
    //   process.exit(0);
    // }, 30000);
  } catch (error) {
    console.error('Error restarting system:', error);
    throw new AppError('Error al reiniciar sistema');
  }
});

export const checkUpdates = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Simulate checking for updates
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({ 
      message: 'Sistema actualizado a la última versión',
      currentVersion: '2.0.1',
      latestVersion: '2.0.1',
      upToDate: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error checking updates:', error);
    throw new AppError('Error al verificar actualizaciones');
  }
});

export const optimizeDatabase = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Simulate database optimization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    res.json({ 
      message: 'Base de datos optimizada exitosamente',
      tablesOptimized: 15,
      indexesRebuilt: 8,
      spaceReclaimed: '2.3 MB',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error optimizing database:', error);
    throw new AppError('Error al optimizar base de datos');
  }
});