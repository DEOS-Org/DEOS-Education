import { Request, Response } from 'express';
import * as comunicadoService from '../services/comunicadoService';
import { AppError } from '../utils/AppError';

export const getComunicados = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, tipo, estado } = req.query;
    const usuarioId = (req as any).user.id;
    const rol = (req as any).user.rol;

    const filters = {
      ...(tipo && { tipo }),
      ...(estado && { estado })
    };

    const result = await comunicadoService.getComunicados(
      usuarioId,
      rol,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(result);
  } catch (error) {
    console.error('Error in getComunicados:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getComunicadoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;

    const comunicado = await comunicadoService.getComunicadoById(
      parseInt(id),
      usuarioId
    );

    res.json(comunicado);
  } catch (error) {
    console.error('Error in getComunicadoById:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const createComunicado = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const datos = req.body;

    // Validaciones básicas
    if (!datos.titulo || !datos.contenido) {
      return res.status(400).json({ 
        message: 'Título y contenido son requeridos' 
      });
    }

    const comunicado = await comunicadoService.createComunicado(datos, usuarioId);

    res.status(201).json(comunicado);
  } catch (error) {
    console.error('Error in createComunicado:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const updateComunicado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;
    const datos = req.body;

    const comunicado = await comunicadoService.updateComunicado(
      parseInt(id),
      datos,
      usuarioId
    );

    res.json(comunicado);
  } catch (error) {
    console.error('Error in updateComunicado:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const deleteComunicado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;

    const result = await comunicadoService.deleteComunicado(
      parseInt(id),
      usuarioId
    );

    res.json(result);
  } catch (error) {
    console.error('Error in deleteComunicado:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const marcarComoLeido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;

    const result = await comunicadoService.marcarComoLeido(
      parseInt(id),
      usuarioId
    );

    res.json(result);
  } catch (error) {
    console.error('Error in marcarComoLeido:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getComunicadosNoLeidos = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const rol = (req as any).user.rol;

    const comunicados = await comunicadoService.getComunicadosNoLeidos(
      usuarioId,
      rol
    );

    res.json(comunicados);
  } catch (error) {
    console.error('Error in getComunicadosNoLeidos:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getEstadisticasComunicados = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const rol = (req as any).user.rol;
    
    // Solo mostrar estadísticas propias si no es admin
    const usuarioCreadorId = rol === 'admin' ? undefined : usuarioId;

    const estadisticas = await comunicadoService.getEstadisticasComunicados(usuarioCreadorId);

    res.json(estadisticas);
  } catch (error) {
    console.error('Error in getEstadisticasComunicados:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};