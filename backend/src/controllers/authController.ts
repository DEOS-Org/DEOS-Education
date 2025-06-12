import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService';
import * as passwordResetService from '../services/passwordResetService';
import { UsuarioInstance } from '../models';

export const register = async (req: Request, res: Response) => {
  try {
    const { dni, nombre, apellido, email, contraseña, roles } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    
    // Crear el usuario
    const usuario = await userService.createUser({
      dni,
      nombre,
      apellido,
      email,
      contraseña,
      roles
    });
    
    // Obtener roles del usuario
    const userRoles = roles || [];
    
    // Generar token
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        roles: userRoles,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );
    
    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        roles: userRoles,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, contraseña } = req.body;
  try {
    console.log('Login attempt for email:', email);
    const usuario = (await userService.findByEmail(email)) as UsuarioInstance | null;
    if (!usuario) {
      console.log('User not found');
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    console.log('User found:', usuario.get());
    const passwordMatch = await userService.verifyPassword(contraseña, usuario.contraseña);
    console.log('Password match:', passwordMatch);
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar el login' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    const token = await passwordResetService.generateResetToken(email);

    // En un entorno real, aquí enviarías un email con el token
    // Por ahora, devolvemos el token en la respuesta (solo para testing)
    res.json({
      message: 'Token de recuperación generado',
      token, // Solo para desarrollo - en producción esto se enviaría por email
      instructions: 'Use este token en el endpoint /auth/reset-password'
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error al procesar la solicitud' 
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token y nueva contraseña son requeridos' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    await passwordResetService.resetPassword(token, newPassword);

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error al restablecer la contraseña' 
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual y nueva contraseña son requeridas' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    await passwordResetService.changePassword(userId, currentPassword, newPassword);

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(error.statusCode || 500).json({ 
      message: error.message || 'Error al cambiar la contraseña' 
    });
  }
};