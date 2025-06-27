import { Request, Response } from 'express';
import * as mensajeriaService from '../services/mensajeriaService';
import { AppError } from '../utils/AppError';

// ========== CONTROLADORES DE MENSAJES ==========

export const enviarMensaje = async (req: Request, res: Response) => {
  try {
    const usuarioEmisorId = (req as any).user.id;
    const { 
      contenido, 
      tipo,
      usuarioReceptorId,
      grupoChatId,
      mensajePadreId,
      archivoUrl,
      archivoNombre,
      archivoTamano
    } = req.body;

    // Validación básica
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ message: 'El contenido del mensaje es requerido' });
    }

    const mensaje = await mensajeriaService.enviarMensaje({
      contenido,
      tipo,
      usuarioEmisorId,
      usuarioReceptorId,
      grupoChatId,
      mensajePadreId,
      archivoUrl,
      archivoNombre,
      archivoTamano
    });

    res.status(201).json(mensaje);
  } catch (error) {
    console.error('Error in enviarMensaje:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getMensajesConversacion = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const { otroUsuarioId, grupoChatId } = req.query;
    const limite = parseInt(req.query.limite as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const mensajes = await mensajeriaService.getMensajesConversacion(
      usuarioId,
      otroUsuarioId ? parseInt(otroUsuarioId as string) : undefined,
      grupoChatId ? parseInt(grupoChatId as string) : undefined,
      limite,
      offset
    );

    res.json(mensajes);
  } catch (error) {
    console.error('Error in getMensajesConversacion:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const marcarMensajesComoLeidos = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const { mensajeIds } = req.body;

    if (!mensajeIds || !Array.isArray(mensajeIds)) {
      return res.status(400).json({ message: 'mensajeIds debe ser un array' });
    }

    await mensajeriaService.marcarMensajesComoLeidos(mensajeIds, usuarioId);

    res.json({ message: 'Mensajes marcados como leídos' });
  } catch (error) {
    console.error('Error in marcarMensajesComoLeidos:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const editarMensaje = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const { id } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({ message: 'El contenido del mensaje es requerido' });
    }

    const mensaje = await mensajeriaService.editarMensaje(
      parseInt(id),
      usuarioId,
      contenido
    );

    res.json(mensaje);
  } catch (error) {
    console.error('Error in editarMensaje:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const eliminarMensaje = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;
    const { id } = req.params;

    const result = await mensajeriaService.eliminarMensaje(
      parseInt(id),
      usuarioId
    );

    res.json(result);
  } catch (error) {
    console.error('Error in eliminarMensaje:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getMensajesNoLeidos = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;

    const count = await mensajeriaService.getMensajesNoLeidos(usuarioId);

    res.json({ count });
  } catch (error) {
    console.error('Error in getMensajesNoLeidos:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getConversacionesRecientes = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;

    const conversaciones = await mensajeriaService.getConversacionesRecientes(usuarioId);

    res.json(conversaciones);
  } catch (error) {
    console.error('Error in getConversacionesRecientes:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

// ========== CONTROLADORES DE GRUPOS ==========

export const crearGrupoChat = async (req: Request, res: Response) => {
  try {
    const usuarioCreadorId = (req as any).user.id;
    const { 
      nombre, 
      descripcion,
      tipo,
      cursoDivisionMateriaId,
      cursoDivisionId,
      miembrosIds
    } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre del grupo es requerido' });
    }

    const grupo = await mensajeriaService.crearGrupoChat({
      nombre,
      descripcion,
      tipo,
      usuarioCreadorId,
      cursoDivisionMateriaId,
      cursoDivisionId,
      miembrosIds
    });

    res.status(201).json(grupo);
  } catch (error) {
    console.error('Error in crearGrupoChat:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getGrupoChat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const grupo = await mensajeriaService.getGrupoChatById(parseInt(id));

    if (!grupo) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    res.json(grupo);
  } catch (error) {
    console.error('Error in getGrupoChat:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const getGruposUsuario = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user.id;

    const grupos = await mensajeriaService.getGruposUsuario(usuarioId);

    res.json(grupos);
  } catch (error) {
    console.error('Error in getGruposUsuario:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const agregarMiembroGrupo = async (req: Request, res: Response) => {
  try {
    const usuarioAdminId = (req as any).user.id;
    const { id: grupoId } = req.params;
    const { usuarioId, rol } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ message: 'usuarioId es requerido' });
    }

    const miembro = await mensajeriaService.agregarMiembroGrupo(
      parseInt(grupoId),
      usuarioId,
      usuarioAdminId,
      rol
    );

    res.json(miembro);
  } catch (error) {
    console.error('Error in agregarMiembroGrupo:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const quitarMiembroGrupo = async (req: Request, res: Response) => {
  try {
    const usuarioAdminId = (req as any).user.id;
    const { id: grupoId, usuarioId } = req.params;

    const result = await mensajeriaService.quitarMiembroGrupo(
      parseInt(grupoId),
      parseInt(usuarioId),
      usuarioAdminId
    );

    res.json(result);
  } catch (error) {
    console.error('Error in quitarMiembroGrupo:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};