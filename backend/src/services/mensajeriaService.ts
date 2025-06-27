import { 
  Mensaje, 
  MensajeEstado,
  GrupoChat,
  GrupoChatMiembro,
  Usuario,
  CursoDivision,
  CursoDivisionMateria,
  MensajeInstance,
  GrupoChatInstance
} from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

// ========== SERVICIOS DE MENSAJES ==========

export const enviarMensaje = async (datos: {
  contenido: string;
  tipo?: string;
  usuarioEmisorId: number;
  usuarioReceptorId?: number;
  grupoChatId?: number;
  mensajePadreId?: number;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTamano?: number;
}) => {
  try {
    // Validaciones
    if (!datos.usuarioReceptorId && !datos.grupoChatId) {
      throw new AppError('Debe especificar un receptor o un grupo', 400);
    }

    if (datos.usuarioReceptorId && datos.grupoChatId) {
      throw new AppError('No puede especificar receptor y grupo al mismo tiempo', 400);
    }

    // Si es un mensaje a grupo, verificar que el usuario es miembro
    if (datos.grupoChatId) {
      const esMiembro = await GrupoChatMiembro.findOne({
        where: {
          grupo_chat_id: datos.grupoChatId,
          usuario_id: datos.usuarioEmisorId,
          activo: true
        }
      });

      if (!esMiembro) {
        throw new AppError('No eres miembro de este grupo', 403);
      }

      if (!esMiembro.puede_enviar_mensajes) {
        throw new AppError('No tienes permiso para enviar mensajes en este grupo', 403);
      }

      if (esMiembro.silenciado_hasta && new Date(esMiembro.silenciado_hasta) > new Date()) {
        throw new AppError('Estás silenciado en este grupo', 403);
      }
    }

    // Crear mensaje
    const mensaje = await Mensaje.create({
      contenido: datos.contenido,
      tipo: (datos.tipo as any) || 'texto',
      usuario_emisor_id: datos.usuarioEmisorId,
      usuario_receptor_id: datos.usuarioReceptorId,
      grupo_chat_id: datos.grupoChatId,
      mensaje_padre_id: datos.mensajePadreId,
      archivo_url: datos.archivoUrl,
      archivo_nombre: datos.archivoNombre,
      archivo_tamano: datos.archivoTamano
    });

    // Crear estados de mensaje para receptores
    if (datos.grupoChatId) {
      // Para grupos, crear estado para cada miembro (excepto el emisor)
      const miembros = await GrupoChatMiembro.findAll({
        where: {
          grupo_chat_id: datos.grupoChatId,
          usuario_id: { [Op.ne]: datos.usuarioEmisorId },
          activo: true
        }
      });

      const estados = miembros.map(miembro => ({
        mensaje_id: mensaje.id,
        usuario_id: miembro.usuario_id,
        entregado: false,
        leido: false
      }));

      await MensajeEstado.bulkCreate(estados);
    } else if (datos.usuarioReceptorId) {
      // Para mensajes directos, crear estado para el receptor
      await MensajeEstado.create({
        mensaje_id: mensaje.id,
        usuario_id: datos.usuarioReceptorId,
        entregado: false,
        leido: false
      });
    }

    // Retornar mensaje con información completa
    return await getMensajeById(mensaje.id);
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al enviar mensaje', 500);
  }
};

export const getMensajeById = async (mensajeId: number) => {
  try {
    const mensaje = await Mensaje.findByPk(mensajeId, {
      include: [
        {
          model: Usuario,
          as: 'UsuarioEmisor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: Usuario,
          as: 'UsuarioReceptor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: GrupoChat,
          as: 'GrupoChat',
          attributes: ['id', 'nombre', 'tipo']
        },
        {
          model: Mensaje,
          as: 'MensajePadre',
          attributes: ['id', 'contenido', 'usuario_emisor_id']
        },
        {
          model: MensajeEstado,
          as: 'Estados',
          attributes: ['usuario_id', 'entregado', 'fecha_entrega', 'leido', 'fecha_lectura']
        }
      ]
    });

    return mensaje;
  } catch (error) {
    console.error('Error getting message:', error);
    throw new AppError('Error al obtener mensaje', 500);
  }
};

export const getMensajesConversacion = async (
  usuarioId: number,
  otroUsuarioId?: number,
  grupoChatId?: number,
  limite: number = 50,
  offset: number = 0
) => {
  try {
    let whereCondition: any = { eliminado: false };

    if (otroUsuarioId) {
      // Mensajes directos entre dos usuarios
      whereCondition[Op.or] = [
        {
          usuario_emisor_id: usuarioId,
          usuario_receptor_id: otroUsuarioId
        },
        {
          usuario_emisor_id: otroUsuarioId,
          usuario_receptor_id: usuarioId
        }
      ];
    } else if (grupoChatId) {
      // Mensajes de grupo
      whereCondition.grupo_chat_id = grupoChatId;
    } else {
      throw new AppError('Debe especificar otro usuario o grupo', 400);
    }

    const mensajes = await Mensaje.findAll({
      where: whereCondition,
      include: [
        {
          model: Usuario,
          as: 'UsuarioEmisor',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: MensajeEstado,
          as: 'Estados',
          where: { usuario_id: usuarioId },
          required: false,
          attributes: ['leido', 'fecha_lectura']
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: limite,
      offset: offset
    });

    // Marcar mensajes como leídos
    const mensajesNoLeidos = mensajes.filter(m => 
      m.usuario_emisor_id !== usuarioId && 
      (!(m as any).Estados || !(m as any).Estados[0]?.leido)
    );

    if (mensajesNoLeidos.length > 0) {
      await marcarMensajesComoLeidos(
        mensajesNoLeidos.map(m => m.id),
        usuarioId
      );
    }

    return mensajes.reverse(); // Orden cronológico
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al obtener mensajes', 500);
  }
};

export const marcarMensajesComoLeidos = async (mensajeIds: number[], usuarioId: number) => {
  try {
    await MensajeEstado.update(
      {
        leido: true,
        fecha_lectura: new Date()
      },
      {
        where: {
          mensaje_id: mensajeIds,
          usuario_id: usuarioId,
          leido: false
        }
      }
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new AppError('Error al marcar mensajes como leídos', 500);
  }
};

export const editarMensaje = async (mensajeId: number, usuarioId: number, nuevoContenido: string) => {
  try {
    const mensaje = await Mensaje.findByPk(mensajeId);

    if (!mensaje) {
      throw new AppError('Mensaje no encontrado', 404);
    }

    if (mensaje.usuario_emisor_id !== usuarioId) {
      throw new AppError('Solo puedes editar tus propios mensajes', 403);
    }

    if (mensaje.eliminado) {
      throw new AppError('No puedes editar un mensaje eliminado', 400);
    }

    await mensaje.update({
      contenido: nuevoContenido,
      editado: true,
      fecha_edicion: new Date()
    });

    return await getMensajeById(mensajeId);
  } catch (error) {
    console.error('Error editing message:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al editar mensaje', 500);
  }
};

export const eliminarMensaje = async (mensajeId: number, usuarioId: number) => {
  try {
    const mensaje = await Mensaje.findByPk(mensajeId);

    if (!mensaje) {
      throw new AppError('Mensaje no encontrado', 404);
    }

    if (mensaje.usuario_emisor_id !== usuarioId) {
      throw new AppError('Solo puedes eliminar tus propios mensajes', 403);
    }

    await mensaje.update({
      eliminado: true,
      fecha_eliminacion: new Date(),
      contenido: 'Mensaje eliminado'
    });

    return { message: 'Mensaje eliminado exitosamente' };
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar mensaje', 500);
  }
};

// ========== SERVICIOS DE GRUPOS ==========

export const crearGrupoChat = async (datos: {
  nombre: string;
  descripcion?: string;
  tipo?: string;
  usuarioCreadorId: number;
  cursoDivisionMateriaId?: number;
  cursoDivisionId?: number;
  miembrosIds?: number[];
}) => {
  try {
    // Crear grupo
    const grupo = await GrupoChat.create({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      tipo: (datos.tipo as any) || 'custom',
      usuario_creador_id: datos.usuarioCreadorId,
      curso_division_materia_id: datos.cursoDivisionMateriaId,
      curso_division_id: datos.cursoDivisionId
    });

    // Agregar creador como admin
    await GrupoChatMiembro.create({
      grupo_chat_id: grupo.id,
      usuario_id: datos.usuarioCreadorId,
      rol: 'admin'
    });

    // Agregar otros miembros si se especificaron
    if (datos.miembrosIds && datos.miembrosIds.length > 0) {
      const miembros = datos.miembrosIds
        .filter(id => id !== datos.usuarioCreadorId)
        .map(usuarioId => ({
          grupo_chat_id: grupo.id,
          usuario_id: usuarioId,
          rol: 'miembro' as const
        }));

      await GrupoChatMiembro.bulkCreate(miembros);
    }

    return await getGrupoChatById(grupo.id);
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw new AppError('Error al crear grupo', 500);
  }
};

export const getGrupoChatById = async (grupoId: number) => {
  try {
    const grupo = await GrupoChat.findByPk(grupoId, {
      include: [
        {
          model: Usuario,
          as: 'UsuarioCreador',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: GrupoChatMiembro,
          as: 'Miembros',
          include: [{
            model: Usuario,
            as: 'Usuario',
            attributes: ['id', 'nombre', 'apellido', 'email']
          }]
        },
        {
          model: CursoDivisionMateria,
          as: 'CursoDivisionMateria',
          include: [{
            model: require('../models').Materia,
            attributes: ['nombre']
          }]
        },
        {
          model: CursoDivision,
          as: 'CursoDivision',
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

    return grupo;
  } catch (error) {
    console.error('Error getting group chat:', error);
    throw new AppError('Error al obtener grupo', 500);
  }
};

export const getGruposUsuario = async (usuarioId: number) => {
  try {
    const miembros = await GrupoChatMiembro.findAll({
      where: {
        usuario_id: usuarioId,
        activo: true
      },
      include: [{
        model: GrupoChat,
        as: 'GrupoChat',
        where: { activo: true },
        include: [
          {
            model: Usuario,
            as: 'UsuarioCreador',
            attributes: ['id', 'nombre', 'apellido']
          },
          {
            model: GrupoChatMiembro,
            as: 'Miembros',
            attributes: ['usuario_id']
          },
          {
            model: Mensaje,
            as: 'Mensajes',
            attributes: ['id', 'contenido', 'fecha_creacion', 'usuario_emisor_id'],
            order: [['fecha_creacion', 'DESC']],
            limit: 1
          }
        ]
      }]
    });

    return miembros.map(m => (m as any).GrupoChat);
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw new AppError('Error al obtener grupos del usuario', 500);
  }
};

export const agregarMiembroGrupo = async (
  grupoId: number,
  usuarioId: number,
  usuarioAdminId: number,
  rol: 'admin' | 'moderador' | 'miembro' = 'miembro'
) => {
  try {
    // Verificar que el usuario admin es admin del grupo
    const adminMiembro = await GrupoChatMiembro.findOne({
      where: {
        grupo_chat_id: grupoId,
        usuario_id: usuarioAdminId,
        rol: 'admin',
        activo: true
      }
    });

    if (!adminMiembro) {
      throw new AppError('No tienes permisos para agregar miembros', 403);
    }

    // Verificar si ya es miembro
    const existeMiembro = await GrupoChatMiembro.findOne({
      where: {
        grupo_chat_id: grupoId,
        usuario_id: usuarioId
      }
    });

    if (existeMiembro) {
      if (existeMiembro.activo) {
        throw new AppError('El usuario ya es miembro del grupo', 400);
      } else {
        // Reactivar miembro
        await existeMiembro.update({
          activo: true,
          fecha_union: new Date(),
          fecha_salida: null,
          rol: rol
        });
        return existeMiembro;
      }
    }

    // Crear nuevo miembro
    const nuevoMiembro = await GrupoChatMiembro.create({
      grupo_chat_id: grupoId,
      usuario_id: usuarioId,
      rol: rol
    });

    return nuevoMiembro;
  } catch (error) {
    console.error('Error adding group member:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al agregar miembro al grupo', 500);
  }
};

export const quitarMiembroGrupo = async (
  grupoId: number,
  usuarioId: number,
  usuarioAdminId: number
) => {
  try {
    // Verificar permisos
    const adminMiembro = await GrupoChatMiembro.findOne({
      where: {
        grupo_chat_id: grupoId,
        usuario_id: usuarioAdminId,
        rol: ['admin', 'moderador'],
        activo: true
      }
    });

    if (!adminMiembro && usuarioAdminId !== usuarioId) {
      throw new AppError('No tienes permisos para quitar miembros', 403);
    }

    const miembro = await GrupoChatMiembro.findOne({
      where: {
        grupo_chat_id: grupoId,
        usuario_id: usuarioId,
        activo: true
      }
    });

    if (!miembro) {
      throw new AppError('El usuario no es miembro del grupo', 404);
    }

    await miembro.update({
      activo: false,
      fecha_salida: new Date()
    });

    return { message: 'Miembro removido del grupo exitosamente' };
  } catch (error) {
    console.error('Error removing group member:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al quitar miembro del grupo', 500);
  }
};

export const getConversacionesRecientes = async (usuarioId: number) => {
  try {
    const { sequelize } = require('../models/db');
    
    // Obtener conversaciones directas recientes
    const [conversacionesDirectas] = await sequelize.query(`
      SELECT DISTINCT
        CASE 
          WHEN m.usuario_emisor_id = ? THEN m.usuario_receptor_id
          ELSE m.usuario_emisor_id
        END as otro_usuario_id,
        u.nombre,
        u.apellido,
        u.email,
        MAX(m.fecha_creacion) as ultima_actividad,
        (
          SELECT contenido 
          FROM mensaje 
          WHERE (
            (usuario_emisor_id = ? AND usuario_receptor_id = otro_usuario_id) OR
            (usuario_emisor_id = otro_usuario_id AND usuario_receptor_id = ?)
          )
          AND eliminado = 0
          ORDER BY fecha_creacion DESC
          LIMIT 1
        ) as ultimo_mensaje,
        (
          SELECT COUNT(*) 
          FROM mensaje m2
          JOIN mensaje_estado me ON m2.id = me.mensaje_id
          WHERE m2.usuario_emisor_id = otro_usuario_id
          AND m2.usuario_receptor_id = ?
          AND me.usuario_id = ?
          AND me.leido = 0
          AND m2.eliminado = 0
        ) as mensajes_no_leidos
      FROM mensaje m
      JOIN usuario u ON u.id = CASE 
        WHEN m.usuario_emisor_id = ? THEN m.usuario_receptor_id
        ELSE m.usuario_emisor_id
      END
      WHERE (m.usuario_emisor_id = ? OR m.usuario_receptor_id = ?)
      AND m.grupo_chat_id IS NULL
      AND m.eliminado = 0
      GROUP BY otro_usuario_id, u.nombre, u.apellido, u.email
      ORDER BY ultima_actividad DESC
      LIMIT 20
    `, {
      replacements: [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]
    });

    return conversacionesDirectas;
  } catch (error) {
    console.error('Error getting recent conversations:', error);
    throw new AppError('Error al obtener conversaciones recientes', 500);
  }
};

export const getMensajesNoLeidos = async (usuarioId: number) => {
  try {
    const count = await MensajeEstado.count({
      where: {
        usuario_id: usuarioId,
        leido: false
      },
      include: [{
        model: Mensaje,
        as: 'Mensaje',
        where: { eliminado: false }
      }]
    });

    return count;
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    throw new AppError('Error al obtener mensajes no leídos', 500);
  }
};