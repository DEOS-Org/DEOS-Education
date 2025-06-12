import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as academicService from '../services/academicService';

// ===== CURSOS =====
export const getCursos = asyncHandler(async (_req: Request, res: Response) => {
  const cursos = await academicService.getCursos();
  res.json(cursos);
});

export const createCurso = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, nivel, descripcion } = req.body;
  if (!nombre || !nivel) {
    throw new AppError('El nombre y nivel son requeridos', 400);
  }
  const curso = await academicService.createCurso({
    nombre,
    nivel,
    descripcion,
    activo: true
  });
  res.status(201).json(curso);
});

export const updateCurso = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, nivel, descripcion, activo } = req.body;
  
  const curso = await academicService.updateCurso(Number(id), {
    nombre,
    nivel,
    descripcion,
    activo
  });
  res.json(curso);
});

export const deleteCurso = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await academicService.deleteCurso(Number(id));
  res.json({ message: 'Curso eliminado exitosamente' });
});

// ===== DIVISIONES =====
export const getDivisiones = asyncHandler(async (_req: Request, res: Response) => {
  const divisiones = await academicService.getDivisiones();
  res.json(divisiones);
});

export const getDivisionesByCurso = asyncHandler(async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const divisiones = await academicService.getDivisionesByCurso(Number(cursoId));
  res.json(divisiones);
});

export const createDivision = asyncHandler(async (req: Request, res: Response) => {
  const { nombre } = req.body;
  if (!nombre) {
    throw new AppError('El nombre es requerido', 400);
  }
  const division = await academicService.createDivision({
    nombre,
    activo: true
  });
  res.status(201).json(division);
});

export const updateDivision = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, activo } = req.body;
  
  const division = await academicService.updateDivision(Number(id), {
    nombre,
    activo
  });
  res.json(division);
});

export const deleteDivision = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await academicService.deleteDivision(Number(id));
  res.json({ message: 'División eliminada exitosamente' });
});

// ===== MATERIAS =====
export const getMaterias = asyncHandler(async (_req: Request, res: Response) => {
  const materias = await academicService.getMaterias();
  res.json(materias);
});

export const createMateria = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, carga_horaria } = req.body;
  if (!nombre || !carga_horaria) {
    throw new AppError('El nombre y la carga horaria son requeridos', 400);
  }
  const materia = await academicService.createMateria({
    nombre,
    carga_horaria,
    activo: true
  });
  res.status(201).json(materia);
});

export const updateMateria = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, carga_horaria, activo } = req.body;
  
  const materia = await academicService.updateMateria(Number(id), {
    nombre,
    carga_horaria,
    activo
  });
  res.json(materia);
});

export const deleteMateria = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await academicService.deleteMateria(Number(id));
  res.json({ message: 'Materia eliminada exitosamente' });
});

// ===== HORARIOS =====
export const getHorarios = asyncHandler(async (_req: Request, res: Response) => {
  const horarios = await academicService.getHorarios();
  res.json(horarios);
});

export const getHorariosByCurso = asyncHandler(async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const horarios = await academicService.getHorariosByCurso(Number(cursoId));
  res.json(horarios);
});

export const createHorario = asyncHandler(async (req: Request, res: Response) => {
  const { curso_division_materia_id, dia, hora_inicio, hora_fin, aula, profesor_usuario_id } = req.body;
  if (!curso_division_materia_id || !dia || !hora_inicio || !hora_fin) {
    throw new AppError('Todos los campos obligatorios deben ser proporcionados', 400);
  }
  const horario = await academicService.createHorario({
    curso_division_materia_id,
    dia,
    hora_inicio,
    hora_fin,
    aula,
    profesor_usuario_id
  });
  res.status(201).json(horario);
});

export const updateHorario = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { curso_division_materia_id, dia, hora_inicio, hora_fin, aula, profesor_usuario_id } = req.body;
  
  const horario = await academicService.updateHorario(Number(id), {
    curso_division_materia_id,
    dia,
    hora_inicio,
    hora_fin,
    aula,
    profesor_usuario_id
  });
  res.json(horario);
});

export const deleteHorario = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await academicService.deleteHorario(Number(id));
  res.json({ message: 'Horario eliminado exitosamente' });
});

// ===== ASIGNACIONES =====
export const getAsignaciones = asyncHandler(async (_req: Request, res: Response) => {
  const asignaciones = await academicService.getAsignaciones();
  res.json(asignaciones);
});

export const assignProfesorToMateria = asyncHandler(async (req: Request, res: Response) => {
  const { profesor_usuario_id, materia_id } = req.body;
  if (!profesor_usuario_id || !materia_id) {
    throw new AppError('El profesor y la materia son requeridos', 400);
  }
  const asignacion = await academicService.assignProfesorToMateria(profesor_usuario_id, materia_id);
  res.status(201).json(asignacion);
});

export const removeProfesorFromMateria = asyncHandler(async (req: Request, res: Response) => {
  const { profesorId, materiaId } = req.params;
  await academicService.removeProfesorFromMateria(Number(profesorId), Number(materiaId));
  res.json({ message: 'Asignación eliminada exitosamente' });
});

// ===== NUEVOS CONTROLADORES PARA NAVEGACIÓN DE CURSOS Y DIVISIONES =====
export const getCursoDivisionDetails = asyncHandler(async (req: Request, res: Response) => {
  const { cursoDivisionId } = req.params;
  const details = await academicService.getCursoDivisionDetails(Number(cursoDivisionId));
  res.json(details);
});

export const getEstudiantesByCursoDivision = asyncHandler(async (req: Request, res: Response) => {
  const { cursoDivisionId } = req.params;
  const estudiantes = await academicService.getEstudiantesByCursoDivision(Number(cursoDivisionId));
  res.json(estudiantes);
});

export const getProfesoresByCursoDivision = asyncHandler(async (req: Request, res: Response) => {
  const { cursoDivisionId } = req.params;
  const profesores = await academicService.getProfesoresByCursoDivision(Number(cursoDivisionId));
  res.json(profesores);
});

export const getRegistrosAsistenciaByCursoDivision = asyncHandler(async (req: Request, res: Response) => {
  const { cursoDivisionId } = req.params;
  const { fechaDesde, fechaHasta } = req.query;
  const registros = await academicService.getRegistrosAsistenciaByCursoDivision(
    Number(cursoDivisionId),
    fechaDesde as string,
    fechaHasta as string
  );
  res.json(registros);
});

export const getCursosDivisiones = asyncHandler(async (_req: Request, res: Response) => {
  const cursosDivisiones = await academicService.getCursosDivisiones();
  res.json(cursosDivisiones);
});

export const createCursoDivision = asyncHandler(async (req: Request, res: Response) => {
  const { curso_id, division_id } = req.body;
  if (!curso_id || !division_id) {
    throw new AppError('El curso y la división son requeridos', 400);
  }
  const cursoDivision = await academicService.createCursoDivision({
    curso_id,
    division_id
  });
  res.status(201).json(cursoDivision);
});

// Get division detail with all related data
export const getDivisionDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const divisionDetail = await academicService.getDivisionDetail(Number(id));
  res.json(divisionDetail);
});

// Get daily attendance detail for a specific division and date
export const getDailyAttendanceDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id, fecha } = req.params;
  const dailyAttendanceDetail = await academicService.getDailyAttendanceDetail(Number(id), fecha);
  res.json(dailyAttendanceDetail);
});

// Endpoint temporal para crear datos de prueba
export const createTestData = asyncHandler(async (req: Request, res: Response) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Limpiar datos existentes
    await sequelize.query('DELETE FROM curso_division');
    
    // Insertar divisiones para cada curso
    const insertions = [
      [1, 1], [1, 2], // Curso 1: Divisiones A, B
      [2, 1], [2, 2], // Curso 2: Divisiones A, B
      [3, 1], [3, 2], [3, 3], // Curso 3: Divisiones A, B, Informática
      [4, 1], [4, 3], [4, 4], // Curso 4: Divisiones A, Informática, Electrónica
      [5, 3], [5, 4], // Curso 5: Divisiones Informática, Electrónica
      [6, 3], [6, 4], // Curso 6: Divisiones Informática, Electrónica
    ];

    for (const [curso_id, division_id] of insertions) {
      await sequelize.query(
        'INSERT INTO curso_division (curso_id, division_id) VALUES (?, ?)',
        { replacements: [curso_id, division_id] }
      );
    }

    // Verificar los datos
    const [rows] = await sequelize.query(`
      SELECT cd.id, c.año as curso, d.division 
      FROM curso_division cd
      JOIN curso c ON cd.curso_id = c.id
      JOIN division d ON cd.division_id = d.id
      ORDER BY c.año, d.division
    `);
    
    res.json({
      message: 'Datos de prueba creados exitosamente',
      data: rows
    });
    
  } catch (error) {
    console.error('Error creating test data:', error);
    throw new AppError('Error al crear datos de prueba', 500);
  }
});