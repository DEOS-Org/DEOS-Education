import { Op } from 'sequelize';
import { 
  Registro, 
  Usuario, 
  CursoDivision, 
  Horario, 
  CursoDivisionMateria, 
  Materia,
  RegistroInstance,
  UsuarioInstance,
  CursoDivisionInstance,
  HorarioInstance,
  CursoDivisionMateriaInstance,
  MateriaInstance,
  CursoInstance,
  DivisionInstance
} from '../models';
import { AppError } from '../utils/AppError';

// Type definitions for models with associations
interface CursoDivisionWithAssociations extends CursoDivisionInstance {
  Curso?: CursoInstance;
  Division?: DivisionInstance;
}

interface CursoDivisionMateriaWithAssociations extends CursoDivisionMateriaInstance {
  Materia?: MateriaInstance;
  CursoDivision?: CursoDivisionWithAssociations;
}

interface HorarioWithAssociations extends HorarioInstance {
  CursoDivisionMateria?: CursoDivisionMateriaWithAssociations;
}

interface AsistenciaReporte {
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  };
  fecha: string;
  ingreso?: Date;
  egreso?: Date;
  estado: 'presente' | 'ausente' | 'tardanza' | 'incompleto';
  minutos_tardanza?: number;
}

interface ReporteFiltros {
  fecha_desde: Date;
  fecha_hasta: Date;
  curso_division_id?: number;
  usuario_id?: number;
}

export const generateAttendanceReport = async (
  filtros: ReporteFiltros
): Promise<AsistenciaReporte[]> => {
  try {
    const { fecha_desde, fecha_hasta, curso_division_id, usuario_id } = filtros;

    // Construir filtros para usuarios
    const userFilters: any = { activo: true };
    
    if (usuario_id) {
      userFilters.id = usuario_id;
    }
    
    if (curso_division_id) {
      // Filtrar por usuarios del curso específico
      const usuariosDelCurso = await require('../models').UsuarioCurso.findAll({
        where: { curso_division_id },
        attributes: ['usuario_id']
      });
      
      userFilters.id = {
        [Op.in]: usuariosDelCurso.map((uc: any) => uc.usuario_id)
      };
    }

    // Obtener usuarios relevantes
    const usuarios = await Usuario.findAll({
      where: userFilters,
      include: [
        {
          model: require('../models').Rol,
          where: { nombre: 'alumno' },
          through: { attributes: [] }
        }
      ]
    });

    const reporte: AsistenciaReporte[] = [];

    // Generar reporte día por día
    const currentDate = new Date(fecha_desde);
    const endDate = new Date(fecha_hasta);

    while (currentDate <= endDate) {
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      for (const usuario of usuarios) {
        const registrosDelDia = await Registro.findAll({
          where: {
            usuario_id: usuario.id,
            fecha: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay
            }
          },
          order: [['fecha', 'ASC']]
        });

        const asistencia = await processUserAttendance(usuario, registrosDelDia, startOfDay);
        reporte.push(asistencia);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return reporte;
  } catch (error) {
    console.error('Error generating attendance report:', error);
    throw new AppError('Error al generar el reporte de asistencia');
  }
};

const processUserAttendance = async (
  usuario: any,
  registros: any[],
  fecha: Date
): Promise<AsistenciaReporte> => {
  const asistencia: AsistenciaReporte = {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni
    },
    fecha: fecha.toISOString().split('T')[0],
    estado: 'ausente'
  };

  if (registros.length === 0) {
    return asistencia;
  }

  // Buscar primer ingreso y último egreso
  const ingresos = registros.filter(r => r.tipo === 'ingreso');
  const egresos = registros.filter(r => r.tipo === 'egreso');

  if (ingresos.length > 0) {
    asistencia.ingreso = ingresos[0].fecha;
    asistencia.estado = 'presente';

    // Verificar tardanza (asumiendo que la entrada debe ser antes de las 8:00 AM)
    const horaEntrada = new Date(asistencia.ingreso!);
    const horaLimite = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    
    if (horaEntrada > horaLimite) {
      asistencia.estado = 'tardanza';
      asistencia.minutos_tardanza = Math.floor((horaEntrada.getTime() - horaLimite.getTime()) / (1000 * 60));
    }
  }

  if (egresos.length > 0) {
    asistencia.egreso = egresos[egresos.length - 1].fecha;
  } else if (asistencia.ingreso) {
    asistencia.estado = 'incompleto'; // Ingresó pero no registró salida
  }

  return asistencia;
};

export const generateSubjectAttendanceReport = async (
  curso_division_materia_id: number,
  fecha_desde: Date,
  fecha_hasta: Date
): Promise<any[]> => {
  try {
    // Obtener información de la materia y curso
    const cdMateria = await CursoDivisionMateria.findByPk(curso_division_materia_id, {
      include: [
        {
          model: Materia,
          attributes: ['nombre', 'carga_horaria']
        },
        {
          model: CursoDivision,
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

    if (!cdMateria) {
      throw new AppError('Materia no encontrada');
    }

    // Obtener horarios de la materia en el rango de fechas
    const horarios = await Horario.findAll({
      where: { curso_division_materia_id }
    });

    // Obtener alumnos del curso
    const alumnos = await require('../models').UsuarioCurso.findAll({
      where: { curso_division_id: cdMateria.curso_division_id },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni']
        }
      ]
    });

    const reporte = [];

    // Para cada horario de clase, verificar asistencia
    for (const horario of horarios) {
      const claseFecha = getNextClassDate(horario.dia, fecha_desde, fecha_hasta);
      
      if (claseFecha) {
        for (const alumno of alumnos) {
          const asistenciaClase = await checkClassAttendance(
            alumno.Usuario,
            claseFecha,
            horario.hora_inicio,
            horario.hora_fin
          );
          
          const cdMateriaTyped = cdMateria as CursoDivisionMateriaWithAssociations;
          reporte.push({
            ...asistenciaClase,
            materia: cdMateriaTyped.Materia?.nombre || 'Sin materia',
            curso: `${cdMateriaTyped.CursoDivision?.Curso?.año || '?'}° ${cdMateriaTyped.CursoDivision?.Division?.division || '?'}`,
            fecha_clase: claseFecha,
            horario: `${horario.hora_inicio} - ${horario.hora_fin}`
          });
        }
      }
    }

    return reporte;
  } catch (error) {
    console.error('Error generating subject attendance report:', error);
    throw new AppError('Error al generar el reporte de asistencia por materia');
  }
};

const getNextClassDate = (dia: string, fecha_desde: Date, fecha_hasta: Date): Date | null => {
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const targetDay = diasSemana.indexOf(dia);
  
  if (targetDay === -1) return null;

  const currentDate = new Date(fecha_desde);
  
  while (currentDate <= fecha_hasta) {
    if (currentDate.getDay() === targetDay) {
      return new Date(currentDate);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return null;
};

const checkClassAttendance = async (
  usuario: any,
  fechaClase: Date,
  horaInicio: string,
  horaFin: string
): Promise<any> => {
  const startOfDay = new Date(fechaClase.getFullYear(), fechaClase.getMonth(), fechaClase.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Buscar registros del día
  const registros = await Registro.findAll({
    where: {
      usuario_id: usuario.id,
      fecha: {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay
      }
    },
    order: [['fecha', 'ASC']]
  });

  // Determinar si estuvo presente durante el horario de la clase
  const horaInicioClase = parseTimeToDate(fechaClase, horaInicio);
  const horaFinClase = parseTimeToDate(fechaClase, horaFin);

  let presente = false;
  let llegada: Date | null = null;

  for (const registro of registros) {
    if (registro.tipo === 'ingreso' && registro.fecha <= horaFinClase) {
      presente = true;
      if (!llegada || registro.fecha < llegada) {
        llegada = registro.fecha;
      }
    }
  }

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni
    },
    presente,
    llegada,
    tardanza: llegada ? llegada > horaInicioClase : false,
    minutos_tardanza: llegada && llegada > horaInicioClase 
      ? Math.floor((llegada.getTime() - horaInicioClase.getTime()) / (1000 * 60))
      : 0
  };
};

const parseTimeToDate = (fecha: Date, tiempo: string): Date => {
  const [horas, minutos, segundos] = tiempo.split(':').map(Number);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horas, minutos, segundos || 0);
};

export const generateTeacherReport = async (
  profesor_id: number,
  fecha_desde: Date,
  fecha_hasta: Date
): Promise<any> => {
  try {
    const horarios = await Horario.findAll({
      where: { profesor_usuario_id: profesor_id },
      include: [
        {
          model: CursoDivisionMateria,
          include: [
            {
              model: Materia,
              attributes: ['nombre']
            },
            {
              model: CursoDivision,
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
        }
      ]
    });

    return {
      profesor_id,
      horarios_asignados: horarios.length,
      materias: horarios.map(h => {
        const hTyped = h as HorarioWithAssociations;
        return {
          materia: hTyped.CursoDivisionMateria?.Materia?.nombre || 'Sin materia',
          curso: `${hTyped.CursoDivisionMateria?.CursoDivision?.Curso?.año || '?'}° ${hTyped.CursoDivisionMateria?.CursoDivision?.Division?.division || '?'}`,
          dia: h.dia,
          horario: `${h.hora_inicio} - ${h.hora_fin}`
        };
      })
    };
  } catch (error) {
    console.error('Error generating teacher report:', error);
    throw new AppError('Error al generar el reporte del profesor');
  }
};