import { Request, Response } from 'express';
import * as sancionService from '../services/sancionService';
import { AppError } from '../utils/AppError';

export const getSanciones = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      usuarioId,
      tipo,
      estado,
      gravedad,
      fechaDesde,
      fechaHasta
    } = req.query;

    const filters = {
      ...(usuarioId && { usuarioId: parseInt(usuarioId as string) }),
      ...(tipo && { tipo }),
      ...(estado && { estado }),
      ...(gravedad && { gravedad }),
      ...(fechaDesde && { fechaDesde }),
      ...(fechaHasta && { fechaHasta })
    };

    const result = await sancionService.getSanciones(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error) {
    console.error('Error in getSanciones:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getSancionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sancion = await sancionService.getSancionById(parseInt(id));

    res.json(sancion);
  } catch (error) {
    console.error('Error in getSancionById:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const createSancion = async (req: Request, res: Response) => {
  try {
    const usuarioSancionadorId = (req as any).user.id;
    const datos = req.body;

    // Validaciones básicas
    if (!datos.usuario_id || !datos.tipo || !datos.motivo || !datos.descripcion || !datos.gravedad) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: usuario_id, tipo, motivo, descripcion y gravedad son obligatorios' 
      });
    }

    const sancion = await sancionService.createSancion(datos, usuarioSancionadorId);

    res.status(201).json(sancion);
  } catch (error) {
    console.error('Error in createSancion:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const updateSancion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;
    const datos = req.body;

    const sancion = await sancionService.updateSancion(
      parseInt(id),
      datos,
      usuarioId
    );

    res.json(sancion);
  } catch (error) {
    console.error('Error in updateSancion:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const deleteSancion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;

    const result = await sancionService.deleteSancion(
      parseInt(id),
      usuarioId
    );

    res.json(result);
  } catch (error) {
    console.error('Error in deleteSancion:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getSancionesByEstudiante = async (req: Request, res: Response) => {
  try {
    const { estudianteId } = req.params;

    const sanciones = await sancionService.getSancionesByEstudiante(
      parseInt(estudianteId)
    );

    res.json(sanciones);
  } catch (error) {
    console.error('Error in getSancionesByEstudiante:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getSancionesActivas = async (req: Request, res: Response) => {
  try {
    const { estudianteId } = req.query;

    const sanciones = await sancionService.getSancionesActivas(
      estudianteId ? parseInt(estudianteId as string) : undefined
    );

    res.json(sanciones);
  } catch (error) {
    console.error('Error in getSancionesActivas:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const marcarSancionComoCumplida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;

    const sancion = await sancionService.marcarSancionComoCumplida(
      parseInt(id),
      usuarioId
    );

    res.json(sancion);
  } catch (error) {
    console.error('Error in marcarSancionComoCumplida:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getEstadisticasSanciones = async (req: Request, res: Response) => {
  try {
    const { cursoDivisionId } = req.query;

    const estadisticas = await sancionService.getEstadisticasSanciones(
      cursoDivisionId ? parseInt(cursoDivisionId as string) : undefined
    );

    res.json(estadisticas);
  } catch (error) {
    console.error('Error in getEstadisticasSanciones:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const notificarPadres = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await sancionService.notificarPadres(parseInt(id));

    res.json(result);
  } catch (error) {
    console.error('Error in notificarPadres:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};