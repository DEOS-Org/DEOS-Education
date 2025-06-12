import { Horario, HorarioInstance, DiaSemana, CursoDivision, CursoDivisionMateria, Usuario, Materia, ProfesorMateria } from '../models';
import { AppError } from '../utils/AppError';
import * as logService from './logService';
import { Op } from 'sequelize';

interface HorarioCreationData {
  curso_division_id: number;
  dia: DiaSemana;
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string; // "HH:MM:SS"
  curso_division_materia_id: number;
  profesor_usuario_id: number;
}

export const createHorario = async (data: HorarioCreationData): Promise<HorarioInstance> => {
  try {
    // Validaciones
    await validateHorarioData(data);
    
    // Verificar conflictos
    await checkScheduleConflicts(data);

    const horario = await Horario.create(data);

    // Log del evento
    await logService.logUserAction(
      data.profesor_usuario_id,
      `Horario creado para ${data.dia} ${data.hora_inicio}-${data.hora_fin}`,
      'GESTION_HORARIOS'
    );

    return horario;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating horario:', error);
    throw new AppError('Error al crear el horario');
  }
};

const validateHorarioData = async (data: HorarioCreationData): Promise<void> => {
  // Verificar que el curso-división existe
  const cursoDivision = await CursoDivision.findByPk(data.curso_division_id);
  if (!cursoDivision) {
    throw new AppError('Curso-división no encontrado');
  }

  // Verificar que el curso-división-materia existe y pertenece al curso-división
  const cdMateria = await CursoDivisionMateria.findOne({
    where: {
      id: data.curso_division_materia_id,
      curso_division_id: data.curso_division_id
    }
  });
  if (!cdMateria) {
    throw new AppError('La materia no está asignada a este curso-división');
  }

  // Verificar que el profesor existe y tiene el rol de profesor
  const profesor = await Usuario.findByPk(data.profesor_usuario_id, {
    include: [
      {
        model: require('../models').Rol,
        where: { nombre: 'profesor' },
        through: { attributes: [] }
      }
    ]
  });
  if (!profesor) {
    throw new AppError('El usuario no es un profesor válido');
  }

  // Verificar que el profesor puede dar esta materia
  const profesorMateria = await ProfesorMateria.findOne({
    where: {
      usuario_id: data.profesor_usuario_id,
      materia_id: cdMateria.materia_id
    }
  });
  if (!profesorMateria) {
    throw new AppError('El profesor no está habilitado para dar esta materia');
  }

  // Validar formato de horas
  if (!isValidTimeFormat(data.hora_inicio) || !isValidTimeFormat(data.hora_fin)) {
    throw new AppError('Formato de hora inválido. Use HH:MM:SS');
  }

  // Validar que hora_fin > hora_inicio
  if (data.hora_fin <= data.hora_inicio) {
    throw new AppError('La hora de fin debe ser posterior a la hora de inicio');
  }
};

const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return timeRegex.test(time);
};

const checkScheduleConflicts = async (data: HorarioCreationData): Promise<void> => {
  // Verificar conflicto de profesor
  const profesorConflict = await Horario.findOne({
    where: {
      profesor_usuario_id: data.profesor_usuario_id,
      dia: data.dia,
      [Op.or]: [
        {
          // El nuevo horario empieza durante una clase existente
          hora_inicio: {
            [Op.lte]: data.hora_inicio
          },
          hora_fin: {
            [Op.gt]: data.hora_inicio
          }
        },
        {
          // El nuevo horario termina durante una clase existente
          hora_inicio: {
            [Op.lt]: data.hora_fin
          },
          hora_fin: {
            [Op.gte]: data.hora_fin
          }
        },
        {
          // El nuevo horario contiene completamente una clase existente
          hora_inicio: {
            [Op.gte]: data.hora_inicio
          },
          hora_fin: {
            [Op.lte]: data.hora_fin
          }
        }
      ]
    }
  });

  if (profesorConflict) {
    throw new AppError('El profesor ya tiene una clase asignada en ese horario');
  }

  // Verificar conflicto de curso-división
  const cursoConflict = await Horario.findOne({
    where: {
      curso_division_id: data.curso_division_id,
      dia: data.dia,
      [Op.or]: [
        {
          hora_inicio: {
            [Op.lte]: data.hora_inicio
          },
          hora_fin: {
            [Op.gt]: data.hora_inicio
          }
        },
        {
          hora_inicio: {
            [Op.lt]: data.hora_fin
          },
          hora_fin: {
            [Op.gte]: data.hora_fin
          }
        },
        {
          hora_inicio: {
            [Op.gte]: data.hora_inicio
          },
          hora_fin: {
            [Op.lte]: data.hora_fin
          }
        }
      ]
    }
  });

  if (cursoConflict) {
    throw new AppError('El curso ya tiene una clase asignada en ese horario');
  }
};

export const getHorariosByCurso = async (curso_division_id: number): Promise<HorarioInstance[]> => {
  try {
    return await Horario.findAll({
      where: { curso_division_id },
      include: [
        {
          model: CursoDivisionMateria,
          include: [
            {
              model: Materia,
              attributes: ['id', 'nombre', 'carga_horaria']
            }
          ]
        },
        {
          model: Usuario,
          as: 'Profesor',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [
        ['dia', 'ASC'],
        ['hora_inicio', 'ASC']
      ]
    });
  } catch (error) {
    console.error('Error getting horarios by curso:', error);
    throw new AppError('Error al obtener los horarios del curso');
  }
};

export const getHorariosByProfesor = async (profesor_usuario_id: number): Promise<HorarioInstance[]> => {
  try {
    return await Horario.findAll({
      where: { profesor_usuario_id },
      include: [
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
        },
        {
          model: CursoDivisionMateria,
          include: [
            {
              model: Materia,
              attributes: ['id', 'nombre', 'carga_horaria']
            }
          ]
        }
      ],
      order: [
        ['dia', 'ASC'],
        ['hora_inicio', 'ASC']
      ]
    });
  } catch (error) {
    console.error('Error getting horarios by profesor:', error);
    throw new AppError('Error al obtener los horarios del profesor');
  }
};

export const updateHorario = async (
  id: number,
  data: Partial<HorarioCreationData>
): Promise<HorarioInstance> => {
  try {
    const horario = await Horario.findByPk(id);
    if (!horario) {
      throw new AppError('Horario no encontrado');
    }

    // Si se están actualizando campos críticos, validar nuevamente
    if (data.curso_division_materia_id || data.profesor_usuario_id || 
        data.dia || data.hora_inicio || data.hora_fin) {
      
      const updatedData = { ...horario.toJSON(), ...data } as HorarioCreationData;
      await validateHorarioData(updatedData);
      
      // Verificar conflictos excluyendo el horario actual
      await checkScheduleConflictsForUpdate(id, updatedData);
    }

    await horario.update(data);

    // Log del evento
    await logService.logUserAction(
      horario.profesor_usuario_id,
      `Horario actualizado (ID: ${id})`,
      'GESTION_HORARIOS'
    );

    return horario;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating horario:', error);
    throw new AppError('Error al actualizar el horario');
  }
};

const checkScheduleConflictsForUpdate = async (
  horarioId: number,
  data: HorarioCreationData
): Promise<void> => {
  // Similar a checkScheduleConflicts pero excluyendo el horario actual
  const profesorConflict = await Horario.findOne({
    where: {
      id: { [Op.ne]: horarioId },
      profesor_usuario_id: data.profesor_usuario_id,
      dia: data.dia,
      [Op.or]: [
        {
          hora_inicio: { [Op.lte]: data.hora_inicio },
          hora_fin: { [Op.gt]: data.hora_inicio }
        },
        {
          hora_inicio: { [Op.lt]: data.hora_fin },
          hora_fin: { [Op.gte]: data.hora_fin }
        },
        {
          hora_inicio: { [Op.gte]: data.hora_inicio },
          hora_fin: { [Op.lte]: data.hora_fin }
        }
      ]
    }
  });

  if (profesorConflict) {
    throw new AppError('El profesor ya tiene una clase asignada en ese horario');
  }

  const cursoConflict = await Horario.findOne({
    where: {
      id: { [Op.ne]: horarioId },
      curso_division_id: data.curso_division_id,
      dia: data.dia,
      [Op.or]: [
        {
          hora_inicio: { [Op.lte]: data.hora_inicio },
          hora_fin: { [Op.gt]: data.hora_inicio }
        },
        {
          hora_inicio: { [Op.lt]: data.hora_fin },
          hora_fin: { [Op.gte]: data.hora_fin }
        },
        {
          hora_inicio: { [Op.gte]: data.hora_inicio },
          hora_fin: { [Op.lte]: data.hora_fin }
        }
      ]
    }
  });

  if (cursoConflict) {
    throw new AppError('El curso ya tiene una clase asignada en ese horario');
  }
};

export const deleteHorario = async (id: number): Promise<void> => {
  try {
    const horario = await Horario.findByPk(id);
    if (!horario) {
      throw new AppError('Horario no encontrado');
    }

    await horario.destroy();

    // Log del evento
    await logService.logUserAction(
      horario.profesor_usuario_id,
      `Horario eliminado (ID: ${id})`,
      'GESTION_HORARIOS'
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error deleting horario:', error);
    throw new AppError('Error al eliminar el horario');
  }
};