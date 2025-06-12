import { Log, LogInstance, TipoLog } from '../models';
import { AppError } from '../utils/AppError';

interface LogCreationData {
  usuario_id?: number;
  tipo: TipoLog;
  descripcion: string;
  origen?: string;
  ip_origen?: string;
}

export const createLog = async (data: LogCreationData): Promise<LogInstance> => {
  try {
    const log = await Log.create({
      ...data,
      fecha: new Date()
    });
    return log;
  } catch (error) {
    console.error('Error creating log:', error);
    throw new AppError('Error al crear el registro de log');
  }
};

export const getLogs = async (filters?: {
  usuario_id?: number;
  tipo?: TipoLog;
  origen?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  limit?: number;
  offset?: number;
}): Promise<LogInstance[]> => {
  try {
    const whereClause: any = {};
    
    if (filters?.usuario_id) {
      whereClause.usuario_id = filters.usuario_id;
    }
    
    if (filters?.tipo) {
      whereClause.tipo = filters.tipo;
    }
    
    if (filters?.origen) {
      whereClause.origen = filters.origen;
    }
    
    if (filters?.fecha_desde || filters?.fecha_hasta) {
      whereClause.fecha = {};
      if (filters.fecha_desde) {
        whereClause.fecha.gte = filters.fecha_desde;
      }
      if (filters.fecha_hasta) {
        whereClause.fecha.lte = filters.fecha_hasta;
      }
    }

    return await Log.findAll({
      where: whereClause,
      order: [['fecha', 'DESC']],
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
      include: [
        {
          model: require('../models').Usuario,
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    throw new AppError('Error al obtener los logs');
  }
};

export const logUserAction = async (
  usuario_id: number, 
  descripcion: string, 
  origen: string = 'API',
  ip_origen?: string
): Promise<void> => {
  try {
    await createLog({
      usuario_id,
      tipo: TipoLog.AUDITORIA,
      descripcion,
      origen,
      ip_origen
    });
  } catch (error) {
    // No re-lanzar error para evitar interrumpir la operación principal
    console.error('Error logging user action:', error);
  }
};

export const logSystemEvent = async (
  tipo: TipoLog,
  descripcion: string,
  origen: string = 'SISTEMA'
): Promise<void> => {
  try {
    await createLog({
      tipo,
      descripcion,
      origen
    });
  } catch (error) {
    console.error('Error logging system event:', error);
  }
};

export const logError = async (
  error: Error,
  origen: string = 'API',
  usuario_id?: number,
  ip_origen?: string
): Promise<void> => {
  try {
    await createLog({
      usuario_id,
      tipo: TipoLog.ERROR,
      descripcion: `${error.name}: ${error.message}${error.stack ? '\n' + error.stack : ''}`,
      origen,
      ip_origen
    });
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
};