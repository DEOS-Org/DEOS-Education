import { 
  Comunicado, 
  ComunicadoLectura, 
  Usuario, 
  CursoDivision,
  ComunicadoInstance,
  UsuarioInstance
} from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

export const getComunicados = async (usuarioId: number, rol: string, page: number = 1, limit: number = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    // Determinar el filtro según el rol
    let whereCondition: any = {
      estado: 'publicado',
      [Op.or]: [
        { fecha_vencimiento: null },
        { fecha_vencimiento: { [Op.gte]: new Date() } }
      ]
    };

    if (rol === 'estudiante') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'estudiantes'] };
    } else if (rol === 'padre') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'padres'] };
    } else if (rol === 'profesor') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'profesores'] };
    } else if (rol === 'admin') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'admin'] };
    }

    const comunicados = await Comunicado.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Usuario,
          as: 'UsuarioCreador',
          attributes: ['id', 'nombre', 'apellido', 'email']
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
        },
        {
          model: ComunicadoLectura,
          as: 'Lecturas',
          where: { usuario_id: usuarioId },
          required: false,
          attributes: ['fecha_lectura']
        }
      ],
      order: [
        ['prioridad', 'DESC'],
        ['fecha_publicacion', 'DESC']
      ],
      limit,
      offset
    });

    return {
      comunicados: comunicados.rows.map(comunicado => ({
        ...comunicado.toJSON(),
        leido: comunicado.get('Lecturas') && (comunicado.get('Lecturas') as any[]).length > 0
      })),
      total: comunicados.count,
      totalPages: Math.ceil(comunicados.count / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error getting comunicados:', error);
    throw new AppError('Error al obtener comunicados', 500);
  }
};

export const getComunicadoById = async (comunicadoId: number, usuarioId: number) => {
  try {
    const comunicado = await Comunicado.findByPk(comunicadoId, {
      include: [
        {
          model: Usuario,
          as: 'UsuarioCreador',
          attributes: ['id', 'nombre', 'apellido', 'email']
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

    if (!comunicado) {
      throw new AppError('Comunicado no encontrado', 404);
    }

    // Marcar como leído
    await marcarComoLeido(comunicadoId, usuarioId);

    return comunicado;
  } catch (error) {
    console.error('Error getting comunicado by ID:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al obtener comunicado', 500);
  }
};

export const createComunicado = async (datos: any, usuarioCreadorId: number) => {
  try {
    const comunicadoData = {
      ...datos,
      usuario_creador_id: usuarioCreadorId,
      estado: datos.estado || 'borrador',
      fecha_publicacion: datos.estado === 'publicado' ? new Date() : null
    };

    const comunicado = await Comunicado.create(comunicadoData);
    
    return await getComunicadoById(comunicado.id, usuarioCreadorId);
  } catch (error) {
    console.error('Error creating comunicado:', error);
    throw new AppError('Error al crear comunicado', 500);
  }
};

export const updateComunicado = async (comunicadoId: number, datos: any, usuarioId: number) => {
  try {
    const comunicado = await Comunicado.findByPk(comunicadoId);
    
    if (!comunicado) {
      throw new AppError('Comunicado no encontrado', 404);
    }

    // Verificar permisos (solo el creador o admin pueden modificar)
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: require('../models').Rol,
        through: { attributes: [] }
      }]
    });

    const esAdmin = (usuario as any).Rols?.some((rol: any) => rol.nombre === 'admin');
    const esCreador = comunicado.usuario_creador_id === usuarioId;

    if (!esAdmin && !esCreador) {
      throw new AppError('No tienes permisos para modificar este comunicado', 403);
    }

    // Si se está publicando, establecer fecha de publicación
    if (datos.estado === 'publicado' && comunicado.estado !== 'publicado') {
      datos.fecha_publicacion = new Date();
    }

    await comunicado.update(datos);
    
    return await getComunicadoById(comunicadoId, usuarioId);
  } catch (error) {
    console.error('Error updating comunicado:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al actualizar comunicado', 500);
  }
};

export const deleteComunicado = async (comunicadoId: number, usuarioId: number) => {
  try {
    const comunicado = await Comunicado.findByPk(comunicadoId);
    
    if (!comunicado) {
      throw new AppError('Comunicado no encontrado', 404);
    }

    // Verificar permisos
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: require('../models').Rol,
        through: { attributes: [] }
      }]
    });

    const esAdmin = (usuario as any).Rols?.some((rol: any) => rol.nombre === 'admin');
    const esCreador = comunicado.usuario_creador_id === usuarioId;

    if (!esAdmin && !esCreador) {
      throw new AppError('No tienes permisos para eliminar este comunicado', 403);
    }

    await comunicado.destroy();
    
    return { message: 'Comunicado eliminado exitosamente' };
  } catch (error) {
    console.error('Error deleting comunicado:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar comunicado', 500);
  }
};

export const marcarComoLeido = async (comunicadoId: number, usuarioId: number) => {
  try {
    const [lectura, created] = await ComunicadoLectura.findOrCreate({
      where: {
        comunicado_id: comunicadoId,
        usuario_id: usuarioId
      },
      defaults: {
        comunicado_id: comunicadoId,
        usuario_id: usuarioId,
        fecha_lectura: new Date()
      }
    });

    return lectura;
  } catch (error) {
    console.error('Error marking comunicado as read:', error);
    throw new AppError('Error al marcar comunicado como leído', 500);
  }
};

export const getComunicadosNoLeidos = async (usuarioId: number, rol: string) => {
  try {
    let whereCondition: any = {
      estado: 'publicado',
      [Op.or]: [
        { fecha_vencimiento: null },
        { fecha_vencimiento: { [Op.gte]: new Date() } }
      ]
    };

    if (rol === 'estudiante') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'estudiantes'] };
    } else if (rol === 'padre') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'padres'] };
    } else if (rol === 'profesor') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'profesores'] };
    } else if (rol === 'admin') {
      whereCondition.dirigido_a = { [Op.in]: ['todos', 'admin'] };
    }

    const comunicados = await Comunicado.findAll({
      where: whereCondition,
      include: [
        {
          model: ComunicadoLectura,
          as: 'Lecturas',
          where: { usuario_id: usuarioId },
          required: false
        }
      ]
    });

    // Filtrar solo los no leídos
    const noLeidos = comunicados.filter(comunicado => 
      !(comunicado.get('Lecturas') as any[])?.length
    );

    return noLeidos;
  } catch (error) {
    console.error('Error getting unread comunicados:', error);
    throw new AppError('Error al obtener comunicados no leídos', 500);
  }
};

export const getEstadisticasComunicados = async (usuarioCreadorId?: number) => {
  try {
    const whereCondition = usuarioCreadorId ? { usuario_creador_id: usuarioCreadorId } : {};

    const stats = await Promise.all([
      Comunicado.count({ where: { ...whereCondition, estado: 'publicado' } }),
      Comunicado.count({ where: { ...whereCondition, estado: 'borrador' } }),
      Comunicado.count({ where: { ...whereCondition, estado: 'archivado' } }),
      Comunicado.count({ 
        where: { 
          ...whereCondition, 
          tipo: 'urgente',
          estado: 'publicado'
        } 
      })
    ]);

    return {
      publicados: stats[0],
      borradores: stats[1],
      archivados: stats[2],
      urgentes: stats[3],
      total: stats[0] + stats[1] + stats[2]
    };
  } catch (error) {
    console.error('Error getting comunicados statistics:', error);
    throw new AppError('Error al obtener estadísticas de comunicados', 500);
  }
};