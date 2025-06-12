import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as userService from './userService';
import * as logService from './logService';
import { AppError } from '../utils/AppError';

// En un entorno real, estos tokens se guardarían en Redis o en una tabla de base de datos
// Por simplicidad, los mantenemos en memoria (se perderán al reiniciar el servidor)
const resetTokens = new Map<string, { email: string; expires: Date }>();

export const generateResetToken = async (email: string): Promise<string> => {
  try {
    // Verificar que el usuario existe
    const usuario = await userService.findByEmail(email);
    if (!usuario) {
      throw new AppError('Usuario no encontrado');
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token
    resetTokens.set(token, { email, expires });

    // Log del evento
    await logService.logUserAction(
      usuario.id!,
      'Token de recuperación de contraseña generado',
      'PASSWORD_RESET'
    );

    return token;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error generating reset token:', error);
    throw new AppError('Error al generar el token de recuperación');
  }
};

export const validateResetToken = (token: string): boolean => {
  const tokenData = resetTokens.get(token);
  if (!tokenData) {
    return false;
  }

  if (new Date() > tokenData.expires) {
    resetTokens.delete(token);
    return false;
  }

  return true;
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      throw new AppError('Token de recuperación inválido o expirado');
    }

    if (new Date() > tokenData.expires) {
      resetTokens.delete(token);
      throw new AppError('Token de recuperación expirado');
    }

    // Buscar usuario
    const usuario = await userService.findByEmail(tokenData.email);
    if (!usuario) {
      throw new AppError('Usuario no encontrado');
    }

    // Actualizar contraseña
    await userService.updateUser(usuario.id!, { contraseña: newPassword });

    // Eliminar token usado
    resetTokens.delete(token);

    // Log del evento
    await logService.logUserAction(
      usuario.id!,
      'Contraseña actualizada mediante token de recuperación',
      'PASSWORD_RESET'
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error resetting password:', error);
    throw new AppError('Error al restablecer la contraseña');
  }
};

export const changePassword = async (
  userId: number, 
  currentPassword: string, 
  newPassword: string
): Promise<void> => {
  try {
    // Verificar usuario
    const usuario = await userService.findByEmail('temp'); // Necesitamos una función para buscar por ID
    // Como no tenemos findById que incluya la contraseña, usamos findByEmail
    const usuarioCompleto = await require('../models').Usuario.findByPk(userId, {
      attributes: { include: ['contraseña'] }
    });
    
    if (!usuarioCompleto) {
      throw new AppError('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await userService.verifyPassword(
      currentPassword, 
      usuarioCompleto.contraseña
    );

    if (!isCurrentPasswordValid) {
      throw new AppError('La contraseña actual es incorrecta');
    }

    // Actualizar contraseña
    await userService.updateUser(userId, { contraseña: newPassword });

    // Log del evento
    await logService.logUserAction(
      userId,
      'Contraseña cambiada por el usuario',
      'PASSWORD_CHANGE'
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error changing password:', error);
    throw new AppError('Error al cambiar la contraseña');
  }
};

// Función para limpiar tokens expirados (ejecutar periódicamente)
export const cleanExpiredTokens = (): void => {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expires) {
      resetTokens.delete(token);
    }
  }
};

// Ejecutar limpieza cada hora
setInterval(cleanExpiredTokens, 60 * 60 * 1000);