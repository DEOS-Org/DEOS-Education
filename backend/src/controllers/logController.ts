import { Request, Response } from 'express';
import * as logService from '../services/logService';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const {
      usuario_id,
      tipo,
      origen,
      fecha_desde,
      fecha_hasta,
      limit,
      offset
    } = req.query;

    const filters: any = {};

    if (usuario_id) {
      filters.usuario_id = parseInt(usuario_id as string);
    }
    if (tipo) {
      filters.tipo = tipo;
    }
    if (origen) {
      filters.origen = origen;
    }
    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const logs = await logService.getLogs(filters);

    res.json(logs);
  } catch (error: any) {
    console.error('Error in getLogs:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const createLog = async (req: Request, res: Response) => {
  try {
    const { usuario_id, tipo, descripcion, origen } = req.body;

    if (!tipo || !descripcion) {
      return res.status(400).json({ 
        message: 'tipo y descripcion son requeridos' 
      });
    }

    const log = await logService.createLog({
      usuario_id,
      tipo,
      descripcion,
      origen,
      ip_origen: req.ip
    });

    res.status(201).json({
      message: 'Log creado exitosamente',
      log: {
        id: log.id,
        usuario_id: log.usuario_id,
        tipo: log.tipo,
        descripcion: log.descripcion,
        origen: log.origen,
        fecha: log.fecha,
        ip_origen: log.ip_origen
      }
    });
  } catch (error: any) {
    console.error('Error in createLog:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const getLogsByUser = async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.params;
    const { tipo, fecha_desde, fecha_hasta, limit, offset } = req.query;

    const filters: any = {
      usuario_id: parseInt(usuario_id)
    };

    if (tipo) {
      filters.tipo = tipo;
    }
    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const logs = await logService.getLogs(filters);

    res.json(logs);
  } catch (error: any) {
    console.error('Error in getLogsByUser:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const { tipo, origen, fecha_desde, fecha_hasta, limit, offset } = req.query;

    const filters: any = {
      usuario_id: null // Solo logs del sistema
    };

    if (tipo) {
      filters.tipo = tipo;
    }
    if (origen) {
      filters.origen = origen;
    }
    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const logs = await logService.getLogs(filters);

    res.json(logs);
  } catch (error: any) {
    console.error('Error in getSystemLogs:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const getErrorLogs = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, limit, offset } = req.query;

    const filters: any = {
      tipo: 'error'
    };

    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const logs = await logService.getLogs(filters);

    res.json(logs);
  } catch (error: any) {
    console.error('Error in getErrorLogs:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const getSecurityLogs = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, limit, offset } = req.query;

    const filters: any = {
      tipo: 'seguridad'
    };

    if (fecha_desde) {
      filters.fecha_desde = new Date(fecha_desde as string);
    }
    if (fecha_hasta) {
      filters.fecha_hasta = new Date(fecha_hasta as string);
    }
    if (limit) {
      filters.limit = parseInt(limit as string);
    }
    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    const logs = await logService.getLogs(filters);

    res.json(logs);
  } catch (error: any) {
    console.error('Error in getSecurityLogs:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};