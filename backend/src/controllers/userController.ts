import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';

// Crear usuario
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { dni, nombre, apellido, email, contraseña, roles } = req.body;
  
  if (!dni || !nombre || !apellido || !email || !contraseña) {
    throw new AppError('Faltan campos requeridos', 400);
  }

  const usuario = await userService.createUser({
    dni,
    nombre,
    apellido,
    email,
    contraseña,
    roles
  });

  res.status(201).json(usuario);
});

// Listar usuarios
export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.findAll();
  res.json({ data: users });
});

// Ver detalle de usuario
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = await userService.findById(Number(id));
  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }
  res.json(usuario);
});

// Editar usuario
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, email, contraseña, activo } = req.body;

  const usuario = await userService.updateUser(Number(id), {
    nombre,
    apellido,
    email,
    contraseña,
    activo
  });

  res.json(usuario);
});

// Activar/Desactivar usuario
export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = await userService.updateUser(Number(id), { activo: true });
  res.json({ message: 'Usuario activado correctamente', usuario });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = await userService.updateUser(Number(id), { activo: false });
  res.json({ message: 'Usuario desactivado correctamente', usuario });
});

// Asignar roles a usuario
export const assignRoles = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roles } = req.body;
  
  if (!Array.isArray(roles)) {
    throw new AppError('Roles inválidos', 400);
  }

  for (const rol of roles) {
    await userService.assignRole(Number(id), rol);
  }

  const usuario = await userService.findById(Number(id));
  res.json(usuario);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.deleteUser(Number(id));
  res.json(result);
});

// Roles
export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!rol) {
    throw new AppError('El rol es requerido', 400);
  }

  const result = await userService.assignRole(Number(id), rol);
  res.json(result);
});

export const removeRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!rol) {
    throw new AppError('El rol es requerido', 400);
  }

  const result = await userService.removeRole(Number(id), rol);
  res.json(result);
});

export const getUserRoles = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const roles = await userService.getUserRoles(Number(id));
  res.json(roles);
});

// Relación Alumno-Padre
export const assignParent = asyncHandler(async (req: Request, res: Response) => {
  const { alumnoId } = req.params;
  const { padreId } = req.body;

  if (!padreId) {
    throw new AppError('El ID del padre es requerido', 400);
  }

  const result = await userService.assignParent(Number(alumnoId), Number(padreId));
  res.json(result);
});

export const removeParent = asyncHandler(async (req: Request, res: Response) => {
  const { alumnoId, padreId } = req.params;
  const result = await userService.removeParent(Number(alumnoId), Number(padreId));
  res.json(result);
});

export const getStudentParents = asyncHandler(async (req: Request, res: Response) => {
  const { alumnoId } = req.params;
  const padres = await userService.getStudentParents(Number(alumnoId));
  res.json(padres);
});

export const getParentStudents = asyncHandler(async (req: Request, res: Response) => {
  const { padreId } = req.params;
  const alumnos = await userService.getParentStudents(Number(padreId));
  res.json(alumnos);
});

export const getStudentDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const studentDetail = await userService.getStudentDetail(Number(id));
  res.json(studentDetail);
});

export const getProfessorDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const professorDetail = await userService.getProfessorDetail(Number(id));
  res.json(professorDetail);
});
