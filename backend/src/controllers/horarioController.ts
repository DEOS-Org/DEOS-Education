import { Request, Response } from 'express';
import * as horarioService from '../services/horarioService';

export const createHorario = async (req: Request, res: Response) => {
  try {
    const {
      curso_division_id,
      dia,
      hora_inicio,
      hora_fin,
      curso_division_materia_id,
      profesor_usuario_id
    } = req.body;

    // Validaciones básicas
    if (!curso_division_id || !dia || !hora_inicio || !hora_fin || 
        !curso_division_materia_id || !profesor_usuario_id) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos' 
      });
    }

    const horario = await horarioService.createHorario({
      curso_division_id,
      dia,
      hora_inicio,
      hora_fin,
      curso_division_materia_id,
      profesor_usuario_id
    });

    res.status(201).json({
      message: 'Horario creado exitosamente',
      horario
    });
  } catch (error: any) {
    console.error('Error in createHorario:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const getHorariosByCurso = async (req: Request, res: Response) => {
  try {
    const { curso_division_id } = req.params;

    const horarios = await horarioService.getHorariosByCurso(
      parseInt(curso_division_id)
    );

    res.json(horarios);
  } catch (error: any) {
    console.error('Error in getHorariosByCurso:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const getHorariosByProfesor = async (req: Request, res: Response) => {
  try {
    const { profesor_id } = req.params;

    const horarios = await horarioService.getHorariosByProfesor(
      parseInt(profesor_id)
    );

    res.json(horarios);
  } catch (error: any) {
    console.error('Error in getHorariosByProfesor:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};

export const updateHorario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const horario = await horarioService.updateHorario(
      parseInt(id),
      updateData
    );

    res.json({
      message: 'Horario actualizado exitosamente',
      horario
    });
  } catch (error: any) {
    console.error('Error in updateHorario:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const deleteHorario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await horarioService.deleteHorario(parseInt(id));

    res.json({ message: 'Horario eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error in deleteHorario:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error interno del servidor' 
    });
  }
};

export const getHorarioById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const horario = await require('../models').Horario.findByPk(id, {
      include: [
        {
          model: require('../models').CursoDivision,
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
          model: require('../models').CursoDivisionMateria,
          include: [
            {
              model: require('../models').Materia,
              attributes: ['id', 'nombre', 'carga_horaria']
            }
          ]
        },
        {
          model: require('../models').Usuario,
          as: 'Profesor',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    if (!horario) {
      return res.status(404).json({ 
        message: 'Horario no encontrado' 
      });
    }

    res.json(horario);
  } catch (error: any) {
    console.error('Error in getHorarioById:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};