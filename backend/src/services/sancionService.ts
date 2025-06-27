import { 
  Sancion, 
  Usuario, 
  CursoDivision,
  SancionInstance
} from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

export const getSanciones = async (filters: any = {}, page: number = 1, limit: number = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    let whereCondition: any = {};

    // Filtros opcionales
    if (filters.usuarioId) {
      whereCondition.usuario_id = filters.usuarioId;
    }
    if (filters.tipo) {
      whereCondition.tipo = filters.tipo;
    }
    if (filters.estado) {
      whereCondition.estado = filters.estado;
    }
    if (filters.gravedad) {
      whereCondition.gravedad = filters.gravedad;
    }
    if (filters.fechaDesde) {
      whereCondition.fecha_sancion = { 
        [Op.gte]: new Date(filters.fechaDesde) 
      };
    }
    if (filters.fechaHasta) {
      whereCondition.fecha_sancion = { 
        ...whereCondition.fecha_sancion,
        [Op.lte]: new Date(filters.fechaHasta) 
      };
    }

    const sanciones = await Sancion.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Usuario,
          as: 'UsuarioSancionado',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email']
        },
        {
          model: Usuario,
          as: 'UsuarioSancionador',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: CursoDivision,
          as: 'CursoDivision',
          required: false,
          attributes: ['id'],
          include: [
            {
              model: require('../models').Curso,
              attributes: ['año']
            },
            {
              model: require('../models').Division,
              attributes: ['division']
            }
          ]
        }
      ],
      order: [['fecha_sancion', 'DESC']],
      limit,
      offset
    });

    return {
      sanciones: sanciones.rows,
      total: sanciones.count,
      totalPages: Math.ceil(sanciones.count / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error getting sanciones:', error);
    throw new AppError('Error al obtener sanciones', 500);
  }
};

export const getSancionById = async (sancionId: number) => {
  try {
    const sancion = await Sancion.findByPk(sancionId, {
      include: [
        {
          model: Usuario,
          as: 'UsuarioSancionado',
          attributes: ['id', 'nombre', 'apellido', 'dni', 'email']
        },
        {
          model: Usuario,
          as: 'UsuarioSancionador',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: CursoDivision,
          as: 'CursoDivision',
          required: false,
          attributes: ['id'],
          include: [
            {
              model: require('../models').Curso,
              attributes: ['año']
            },
            {
              model: require('../models').Division,
              attributes: ['division']
            }
          ]
        }
      ]
    });

    if (!sancion) {
      throw new AppError('Sanción no encontrada', 404);
    }

    return sancion;
  } catch (error) {
    console.error('Error getting sancion by ID:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al obtener sanción', 500);
  }
};

export const createSancion = async (datos: any, usuarioSancionadorId: number) => {
  try {
    // Validar que el usuario sancionado existe
    const usuarioSancionado = await Usuario.findByPk(datos.usuario_id);
    if (!usuarioSancionado) {
      throw new AppError('Usuario a sancionar no encontrado', 404);
    }

    // Calcular fechas para suspensiones
    let fechaInicio, fechaFin;
    if (datos.tipo === 'suspension' && datos.dias_suspension) {
      fechaInicio = new Date();
      fechaFin = new Date();
      fechaFin.setDate(fechaInicio.getDate() + datos.dias_suspension);
    }

    const sancionData = {
      ...datos,
      usuario_sancionador_id: usuarioSancionadorId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: 'activa'
    };

    const sancion = await Sancion.create(sancionData);
    
    return await getSancionById(sancion.id);
  } catch (error) {
    console.error('Error creating sancion:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al crear sanción', 500);
  }
};

export const updateSancion = async (sancionId: number, datos: any, usuarioId: number) => {
  try {
    const sancion = await Sancion.findByPk(sancionId);
    
    if (!sancion) {
      throw new AppError('Sanción no encontrada', 404);
    }

    // Verificar permisos (solo el sancionador original o admin pueden modificar)
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: require('../models').Rol,
        through: { attributes: [] }
      }]
    });

    const esAdmin = (usuario as any).Rols?.some((rol: any) => rol.nombre === 'admin');
    const esSancionador = sancion.usuario_sancionador_id === usuarioId;

    if (!esAdmin && !esSancionador) {
      throw new AppError('No tienes permisos para modificar esta sanción', 403);
    }

    // Recalcular fechas si cambian los días de suspensión
    if (datos.dias_suspension && datos.tipo === 'suspension') {
      const fechaInicio = datos.fecha_inicio ? new Date(datos.fecha_inicio) : sancion.fecha_inicio || new Date();
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + datos.dias_suspension);
      datos.fecha_fin = fechaFin;
    }

    await sancion.update(datos);
    
    return await getSancionById(sancionId);
  } catch (error) {
    console.error('Error updating sancion:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al actualizar sanción', 500);
  }
};

export const deleteSancion = async (sancionId: number, usuarioId: number) => {
  try {
    const sancion = await Sancion.findByPk(sancionId);
    
    if (!sancion) {
      throw new AppError('Sanción no encontrada', 404);
    }

    // Verificar permisos
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: require('../models').Rol,
        through: { attributes: [] }
      }]
    });

    const esAdmin = (usuario as any).Rols?.some((rol: any) => rol.nombre === 'admin');
    const esSancionador = sancion.usuario_sancionador_id === usuarioId;

    if (!esAdmin && !esSancionador) {
      throw new AppError('No tienes permisos para eliminar esta sanción', 403);
    }

    await sancion.destroy();
    
    return { message: 'Sanción eliminada exitosamente' };
  } catch (error) {
    console.error('Error deleting sancion:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar sanción', 500);
  }
};

export const getSancionesByEstudiante = async (estudianteId: number) => {
  try {
    const sanciones = await Sancion.findAll({
      where: { usuario_id: estudianteId },
      include: [
        {
          model: Usuario,
          as: 'UsuarioSancionador',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: CursoDivision,
          as: 'CursoDivision',
          required: false,
          attributes: ['id'],
          include: [
            {
              model: require('../models').Curso,
              attributes: ['año']
            },
            {
              model: require('../models').Division,
              attributes: ['division']
            }
          ]
        }
      ],
      order: [['fecha_sancion', 'DESC']]
    });

    return sanciones;
  } catch (error) {
    console.error('Error getting sanciones by estudiante:', error);
    throw new AppError('Error al obtener sanciones del estudiante', 500);
  }
};

export const getSancionesActivas = async (estudianteId?: number) => {
  try {
    let whereCondition: any = { 
      estado: 'activa',
      [Op.or]: [
        { fecha_fin: null },
        { fecha_fin: { [Op.gte]: new Date() } }
      ]
    };

    if (estudianteId) {
      whereCondition.usuario_id = estudianteId;
    }

    const sanciones = await Sancion.findAll({
      where: whereCondition,
      include: [
        {
          model: Usuario,
          as: 'UsuarioSancionado',
          attributes: ['id', 'nombre', 'apellido', 'dni']
        },
        {
          model: Usuario,
          as: 'UsuarioSancionador',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [['fecha_sancion', 'DESC']]
    });

    return sanciones;
  } catch (error) {
    console.error('Error getting active sanciones:', error);
    throw new AppError('Error al obtener sanciones activas', 500);
  }
};

export const marcarSancionComoCumplida = async (sancionId: number, usuarioId: number) => {
  try {
    const sancion = await Sancion.findByPk(sancionId);
    
    if (!sancion) {
      throw new AppError('Sanción no encontrada', 404);
    }

    // Verificar permisos
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: require('../models').Rol,
        through: { attributes: [] }
      }]
    });

    const esAdmin = (usuario as any).Rols?.some((rol: any) => rol.nombre === 'admin');
    const esSancionador = sancion.usuario_sancionador_id === usuarioId;

    if (!esAdmin && !esSancionador) {
      throw new AppError('No tienes permisos para modificar esta sanción', 403);
    }

    await sancion.update({ estado: 'cumplida' });
    
    return await getSancionById(sancionId);
  } catch (error) {
    console.error('Error marking sancion as completed:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al marcar sanción como cumplida', 500);
  }
};

export const getEstadisticasSanciones = async (cursoDivisionId?: number) => {
  try {
    const whereCondition = cursoDivisionId ? { curso_division_id: cursoDivisionId } : {};

    const stats = await Promise.all([
      Sancion.count({ where: { ...whereCondition, estado: 'activa' } }),
      Sancion.count({ where: { ...whereCondition, estado: 'cumplida' } }),
      Sancion.count({ where: { ...whereCondition, gravedad: 'grave' } }),
      Sancion.count({ where: { ...whereCondition, gravedad: 'muy_grave' } }),
      Sancion.count({ 
        where: { 
          ...whereCondition, 
          tipo: 'suspension',
          estado: 'activa'
        } 
      })
    ]);

    return {
      activas: stats[0],
      cumplidas: stats[1],
      graves: stats[2],
      muyGraves: stats[3],
      suspensionesActivas: stats[4],
      total: stats[0] + stats[1]
    };
  } catch (error) {
    console.error('Error getting sanciones statistics:', error);
    throw new AppError('Error al obtener estadísticas de sanciones', 500);
  }
};

export const notificarPadres = async (sancionId: number) => {
  try {
    const sancion = await Sancion.findByPk(sancionId, {
      include: [
        {
          model: Usuario,
          as: 'UsuarioSancionado',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });

    if (!sancion) {
      throw new AppError('Sanción no encontrada', 404);
    }

    // Aquí se implementaría el envío de notificación a los padres
    // Por ahora solo marcamos como notificado
    await sancion.update({
      padres_notificados: true,
      fecha_notificacion_padres: new Date()
    });

    return { message: 'Padres notificados exitosamente' };
  } catch (error) {
    console.error('Error notifying parents:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al notificar a los padres', 500);
  }
};