import { Request, Response } from 'express';
import * as huellaService from '../services/huellaService';
import * as registroService from '../services/registroService';

// Controladores para gestión de huellas
export const enrollFingerprint = async (req: Request, res: Response) => {
  try {
    const { usuario_id, sensor_id, template } = req.body;

    if (!usuario_id || !template) {
      return res.status(400).json({ 
        message: 'usuario_id y template son requeridos' 
      });
    }

    const huella = await huellaService.enrollFingerprint({
      usuario_id,
      sensor_id,
      template
    });

    res.status(201).json({
      message: 'Huella registrada exitosamente',
      huella: {
        id: huella.id,
        usuario_id: huella.usuario_id,
        sensor_id: huella.sensor_id,
        fecha_registro: huella.fecha_registro
      }
    });
  } catch (error: any) {
    console.error('Error in enrollFingerprint:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const updateFingerprint = async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.params;
    const { sensor_id, template } = req.body;

    if (!template) {
      return res.status(400).json({ 
        message: 'template es requerido' 
      });
    }

    const huella = await huellaService.updateFingerprint(
      parseInt(usuario_id),
      { sensor_id, template }
    );

    res.json({
      message: 'Huella actualizada exitosamente',
      huella: {
        id: huella.id,
        usuario_id: huella.usuario_id,
        sensor_id: huella.sensor_id,
        fecha_registro: huella.fecha_registro
      }
    });
  } catch (error: any) {
    console.error('Error in updateFingerprint:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const deleteFingerprint = async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.params;

    await huellaService.deleteFingerprint(parseInt(usuario_id));

    res.json({ message: 'Huella eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error in deleteFingerprint:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const getFingerprintByUser = async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.params;

    const huella = await huellaService.getFingerprintByUser(parseInt(usuario_id));

    if (!huella) {
      return res.status(404).json({ 
        message: 'No se encontró huella registrada para este usuario' 
      });
    }

    res.json({
      id: huella.id,
      usuario_id: huella.usuario_id,
      sensor_id: huella.sensor_id,
      fecha_registro: huella.fecha_registro,
      usuario: (huella as any).Usuario
    });
  } catch (error: any) {
    console.error('Error in getFingerprintByUser:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const getAllFingerprints = async (req: Request, res: Response) => {
  try {
    const huellas = await huellaService.getAllFingerprints();

    res.json(huellas.map(huella => ({
      id: huella.id,
      usuario_id: huella.usuario_id,
      sensor_id: huella.sensor_id,
      fecha_registro: huella.fecha_registro,
      usuario: (huella as any).Usuario
    })));
  } catch (error: any) {
    console.error('Error in getAllFingerprints:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

// Controladores para registros de fichaje
export const createRecord = async (req: Request, res: Response) => {
  try {
    const { usuario_id, dispositivo_fichaje_id, origen_manual } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ 
        message: 'usuario_id es requerido' 
      });
    }

    const registro = await registroService.createRecord({
      usuario_id,
      dispositivo_fichaje_id,
      origen_manual
    });

    res.status(201).json({
      message: 'Registro creado exitosamente',
      registro: {
        id: registro.id,
        usuario_id: registro.usuario_id,
        tipo: registro.tipo,
        fecha: registro.fecha,
        dispositivo_fichaje_id: registro.dispositivo_fichaje_id,
        origen_manual: registro.origen_manual
      }
    });
  } catch (error: any) {
    console.error('Error in createRecord:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const getRecordsByUser = async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.params;
    const { fecha_desde, fecha_hasta, tipo, limit, offset } = req.query;

    const filters: any = {};
    
    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (tipo) {
      filters.tipo = tipo;
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const registros = await registroService.getRecordsByUser(
      parseInt(usuario_id),
      filters
    );

    res.json(registros);
  } catch (error: any) {
    console.error('Error in getRecordsByUser:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const getAllRecords = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, tipo, dispositivo_id, limit, offset } = req.query;

    const filters: any = {};
    
    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (tipo) {
      filters.tipo = tipo;
    }
    if (dispositivo_id) {
      filters.dispositivo_id = parseInt(dispositivo_id as string);
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const registros = await registroService.getAllRecords(filters);

    res.json(registros);
  } catch (error: any) {
    console.error('Error in getAllRecords:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const createManualRecord = async (req: Request, res: Response) => {
  try {
    const { usuario_id, tipo, fecha, origen } = req.body;

    if (!usuario_id || !tipo || !fecha || !origen) {
      return res.status(400).json({ 
        message: 'usuario_id, tipo, fecha y origen son requeridos' 
      });
    }

    const registro = await registroService.createManualRecord(
      usuario_id,
      tipo,
      new Date(fecha),
      origen
    );

    res.status(201).json({
      message: 'Registro manual creado exitosamente',
      registro
    });
  } catch (error: any) {
    console.error('Error in createManualRecord:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

// Endpoint para ESP32
export const handleBiometricRecord = async (req: Request, res: Response) => {
  try {
    const { template, dispositivo_id } = req.body;

    if (!template || !dispositivo_id) {
      return res.status(400).json({ 
        success: false,
        message: 'template y dispositivo_id son requeridos' 
      });
    }

    const result = await registroService.handleBiometricRecord(template, dispositivo_id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error: any) {
    console.error('Error in handleBiometricRecord:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};