import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService';
import { UsuarioInstance } from '../models';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const usuario = (await userService.findByEmail(email)) as UsuarioInstance | null;
    if (!usuario) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    const passwordMatch = await userService.verifyPassword(password, usuario.contraseña);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    const roles = await userService.getUserRoles(usuario.id!);
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        roles,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        roles,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar el login' });
  }
};