import { Huella, HuellaInstance, Usuario } from '../models';
import { AppError } from '../utils/AppError';
import * as logService from './logService';

interface HuellaEnrollmentData {
  usuario_id: number;
  sensor_id?: number;
  template: string;
}

export const enrollFingerprint = async (data: HuellaEnrollmentData): Promise<HuellaInstance> => {
  try {
    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(data.usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado');
    }

    // Verificar si ya existe una huella para este usuario
    const existingHuella = await Huella.findOne({ 
      where: { usuario_id: data.usuario_id } 
    });
    
    if (existingHuella) {
      throw new AppError('El usuario ya tiene una huella registrada');
    }

    // Crear la huella
    const huella = await Huella.create({
      usuario_id: data.usuario_id,
      sensor_id: data.sensor_id,
      template: data.template,
      fecha_registro: new Date()
    });

    // Log del evento
    await logService.logUserAction(
      data.usuario_id,
      'Huella dactilar registrada exitosamente',
      'SISTEMA_BIOMETRICO'
    );

    return huella;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error enrolling fingerprint:', error);
    throw new AppError('Error al registrar la huella dactilar');
  }
};

export const updateFingerprint = async (
  usuario_id: number, 
  data: { sensor_id?: number; template: string }
): Promise<HuellaInstance> => {
  try {
    const huella = await Huella.findOne({ 
      where: { usuario_id } 
    });
    
    if (!huella) {
      throw new AppError('No se encontró huella registrada para este usuario');
    }

    // Actualizar la huella
    await huella.update({
      sensor_id: data.sensor_id,
      template: data.template,
      fecha_registro: new Date()
    });

    // Log del evento
    await logService.logUserAction(
      usuario_id,
      'Huella dactilar actualizada',
      'SISTEMA_BIOMETRICO'
    );

    return huella;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating fingerprint:', error);
    throw new AppError('Error al actualizar la huella dactilar');
  }
};

export const deleteFingerprint = async (usuario_id: number): Promise<void> => {
  try {
    const huella = await Huella.findOne({ 
      where: { usuario_id } 
    });
    
    if (!huella) {
      throw new AppError('No se encontró huella registrada para este usuario');
    }

    await huella.destroy();

    // Log del evento
    await logService.logUserAction(
      usuario_id,
      'Huella dactilar eliminada',
      'SISTEMA_BIOMETRICO'
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error deleting fingerprint:', error);
    throw new AppError('Error al eliminar la huella dactilar');
  }
};

export const getFingerprintByUser = async (usuario_id: number): Promise<HuellaInstance | null> => {
  try {
    return await Huella.findOne({
      where: { usuario_id },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni']
        }
      ]
    });
  } catch (error) {
    console.error('Error getting fingerprint:', error);
    throw new AppError('Error al obtener la huella dactilar');
  }
};

export const getAllFingerprints = async (): Promise<HuellaInstance[]> => {
  try {
    return await Huella.findAll({
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email']
        }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  } catch (error) {
    console.error('Error getting all fingerprints:', error);
    throw new AppError('Error al obtener las huellas dactilares');
  }
};

// Función auxiliar para identificar usuario por template (usado por ESP32)
export const identifyUserByTemplate = async (template: string): Promise<HuellaInstance | null> => {
  try {
    // En un sistema real, esto requeriría un algoritmo de comparación biométrica
    // Por ahora, hacemos una comparación directa del template
    return await Huella.findOne({
      where: { template },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni']
        }
      ]
    });
  } catch (error) {
    console.error('Error identifying user by template:', error);
    return null;
  }
};