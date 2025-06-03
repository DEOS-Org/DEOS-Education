import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

// Crear usuario
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dni, nombre, apellido, email, contraseña, roles } = req.body;
    if (!dni || !nombre || !apellido || !email || !contraseña) {
      res.status(400).json({ message: 'Faltan datos obligatorios' });
      return;
    }
    const user = await userService.createUser({ dni, nombre, apellido, email, contraseña, roles });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// Listar usuarios
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Ver detalle de usuario
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user?.roles?.includes('admin') && req.user?.id !== Number(id)) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    
    const user = await userService.getUserById(Number(id));
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Editar usuario
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user?.roles?.includes('admin') && req.user?.id !== Number(id)) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    
    const user = await userService.updateUser(Number(id), req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Activar usuario
export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUserStatus(Number(id), true);
    res.json({ message: 'Usuario activado correctamente', user });
  } catch (error) {
    next(error);
  }
};

// Desactivar usuario
export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUserStatus(Number(id), false);
    res.json({ message: 'Usuario desactivado correctamente', user });
  } catch (error) {
    next(error);
  }
};

// Asignar roles a usuario
export const assignRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    if (!Array.isArray(roles)) {
      res.status(400).json({ message: 'Roles inválidos' });
      return;
    }
    const user = await userService.assignRoles(Number(id), roles);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
