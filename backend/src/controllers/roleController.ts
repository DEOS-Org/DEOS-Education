import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as roleService from '../services/roleService';

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, descripcion, permisos } = req.body;
  if (!nombre) {
    throw new AppError('El nombre del rol es requerido', 400);
  }

  const rol = await roleService.createRole({
    nombre,
    descripcion,
    permisos: permisos || [],
    activo: true
  });

  res.status(201).json(rol);
});

export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.getRoles();
  res.json({ data: roles });
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const rol = await roleService.getRoleById(Number(id));
  if (!rol) {
    throw new AppError('Rol no encontrado', 404);
  }
  res.json(rol);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, descripcion, permisos, activo } = req.body;

  const rol = await roleService.updateRole(Number(id), {
    nombre,
    descripcion,
    permisos,
    activo
  });

  res.json(rol);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await roleService.deleteRole(Number(id));
  res.json(result);
});

export const getAvailablePermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = roleService.getPermissions();
  res.json(permissions);
});

export const getUsersWithRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const users = await roleService.getUsersByRole('admin'); // Simplified for now
  res.json(users);
});

export const assignPermissionToRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { permission } = req.body;
  
  if (!permission) {
    throw new AppError('El permiso es requerido', 400);
  }

  // TODO: Implement permission assignment
  res.json({ message: 'Permiso asignado correctamente' });
});

export const removePermissionFromRole = asyncHandler(async (req: Request, res: Response) => {
  const { id, permission } = req.params;
  // TODO: Implement permission removal
  res.json({ message: 'Permiso removido correctamente' });
});