import { Registro, RegistroInstance, TipoRegistro, TipoLog, Usuario, DispositivoFichaje } from '../models';
import { AppError } from '../utils/AppError';
import * as logService from './logService';
import { Op } from 'sequelize';

interface RegistroCreationData {
  usuario_id: number;
  dispositivo_fichaje_id?: number;
  origen_manual?: string;
}

export const createRecord = async (data: RegistroCreationData): Promise<RegistroInstance> => {
  try {
    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(data.usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado');
    }

    // Verificar dispositivo si se proporciona
    if (data.dispositivo_fichaje_id) {
      const dispositivo = await DispositivoFichaje.findByPk(data.dispositivo_fichaje_id);
      if (!dispositivo || !dispositivo.activo) {
        throw new AppError('Dispositivo no encontrado o inactivo');
      }
    }

    // Determinar el tipo de registro (ingreso/egreso)
    const tipo = await determineRecordType(data.usuario_id);
    
    // Crear el registro
    const registro = await Registro.create({
      usuario_id: data.usuario_id,
      tipo,
      fecha: new Date(),
      dispositivo_fichaje_id: data.dispositivo_fichaje_id,
      origen_manual: data.origen_manual
    });

    // Log del evento
    await logService.logUserAction(
      data.usuario_id,
      `Registro de ${tipo} creado`,
      data.dispositivo_fichaje_id ? 'DISPOSITIVO_BIOMETRICO' : 'REGISTRO_MANUAL'
    );

    return registro;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating record:', error);
    throw new AppError('Error al crear el registro');
  }
};

export const determineRecordType = async (usuario_id: number): Promise<TipoRegistro> => {
  try {
    // Buscar el último registro del usuario en el día actual
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const lastRecord = await Registro.findOne({
      where: {
        usuario_id,
        fecha: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay
        }
      },
      order: [['fecha', 'DESC']]
    });

    // Si no hay registro previo en el día o el último fue egreso, es un ingreso
    if (!lastRecord || lastRecord.tipo === TipoRegistro.EGRESO) {
      return TipoRegistro.INGRESO;
    }
    
    // Si el último fue ingreso, es un egreso
    return TipoRegistro.EGRESO;
  } catch (error) {
    console.error('Error determining record type:', error);
    // Por defecto, asumir ingreso
    return TipoRegistro.INGRESO;
  }
};

export const getRecordsByUser = async (
  usuario_id: number,
  filters?: {
    fecha_desde?: Date;
    fecha_hasta?: Date;
    tipo?: TipoRegistro;
    limit?: number;
    offset?: number;
  }
): Promise<RegistroInstance[]> => {
  try {
    const whereClause: any = { usuario_id };
    
    if (filters?.tipo) {
      whereClause.tipo = filters.tipo;
    }
    
    if (filters?.fecha_desde || filters?.fecha_hasta) {
      whereClause.fecha = {};
      if (filters.fecha_desde) {
        whereClause.fecha[Op.gte] = filters.fecha_desde;
      }
      if (filters.fecha_hasta) {
        whereClause.fecha[Op.lte] = filters.fecha_hasta;
      }
    }

    return await Registro.findAll({
      where: whereClause,
      order: [['fecha', 'DESC']],
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
      include: [
        {
          model: DispositivoFichaje,
          attributes: ['id', 'identificador_unico', 'descripcion', 'ubicacion']
        }
      ]
    });
  } catch (error) {
    console.error('Error getting records by user:', error);
    throw new AppError('Error al obtener los registros del usuario');
  }
};

export const getAllRecords = async (filters?: {
  fecha_desde?: Date;
  fecha_hasta?: Date;
  tipo?: TipoRegistro;
  dispositivo_id?: number;
  limit?: number;
  offset?: number;
}): Promise<RegistroInstance[]> => {
  try {
    const whereClause: any = {};
    
    if (filters?.tipo) {
      whereClause.tipo = filters.tipo;
    }
    
    if (filters?.dispositivo_id) {
      whereClause.dispositivo_fichaje_id = filters.dispositivo_id;
    }
    
    if (filters?.fecha_desde || filters?.fecha_hasta) {
      whereClause.fecha = {};
      if (filters.fecha_desde) {
        whereClause.fecha[Op.gte] = filters.fecha_desde;
      }
      if (filters.fecha_hasta) {
        whereClause.fecha[Op.lte] = filters.fecha_hasta;
      }
    }

    return await Registro.findAll({
      where: whereClause,
      order: [['fecha', 'DESC']],
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni']
        },
        {
          model: DispositivoFichaje,
          attributes: ['id', 'identificador_unico', 'descripcion', 'ubicacion']
        }
      ]
    });
  } catch (error) {
    console.error('Error getting all records:', error);
    throw new AppError('Error al obtener los registros');
  }
};

export const createManualRecord = async (
  usuario_id: number,
  tipo: TipoRegistro,
  fecha: Date,
  origen: string
): Promise<RegistroInstance> => {
  try {
    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado');
    }

    const registro = await Registro.create({
      usuario_id,
      tipo,
      fecha,
      origen_manual: origen
    });

    // Log del evento
    await logService.logUserAction(
      usuario_id,
      `Registro manual de ${tipo} creado para fecha ${fecha.toISOString()}`,
      'REGISTRO_MANUAL'
    );

    return registro;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating manual record:', error);
    throw new AppError('Error al crear el registro manual');
  }
};

// Función para manejar fichajes desde ESP32
export const handleBiometricRecord = async (
  template: string,
  dispositivo_identificador: string
): Promise<{ success: boolean; message: string; usuario?: any }> => {
  try {
    // Importar el servicio de huellas
    const huellaService = require('./huellaService');
    
    // Identificar usuario por huella
    const huella = await huellaService.identifyUserByTemplate(template);
    if (!huella) {
      await logService.logSystemEvent(
        TipoLog.SEGURIDAD,
        `Intento de acceso con huella no registrada desde dispositivo ${dispositivo_identificador}`,
        'SISTEMA_BIOMETRICO'
      );
      return { success: false, message: 'Huella no registrada' };
    }

    // Buscar dispositivo
    const dispositivo = await DispositivoFichaje.findOne({
      where: { identificador_unico: dispositivo_identificador }
    });

    if (!dispositivo || !dispositivo.activo) {
      await logService.logSystemEvent(
        TipoLog.ERROR,
        `Intento de fichaje desde dispositivo desconocido o inactivo: ${dispositivo_identificador}`,
        'SISTEMA_BIOMETRICO'
      );
      return { success: false, message: 'Dispositivo no autorizado' };
    }

    // Crear registro
    const registro = await createRecord({
      usuario_id: huella.usuario_id,
      dispositivo_fichaje_id: dispositivo.id
    });

    return {
      success: true,
      message: `Registro de ${registro.tipo} exitoso`,
      usuario: {
        id: huella.Usuario?.id,
        nombre: huella.Usuario?.nombre,
        apellido: huella.Usuario?.apellido,
        tipo_registro: registro.tipo
      }
    };
  } catch (error) {
    console.error('Error handling biometric record:', error);
    await logService.logSystemEvent(
      TipoLog.ERROR,
      `Error procesando fichaje biométrico: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      'SISTEMA_BIOMETRICO'
    );
    return { success: false, message: 'Error interno del sistema' };
  }
};