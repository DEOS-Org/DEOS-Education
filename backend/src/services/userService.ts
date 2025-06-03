import bcrypt from 'bcryptjs';
import { Usuario, Rol, UsuarioRol, UsuarioInstance } from '../models';

const SALT_ROUNDS = 12;

export const findByEmail = async (email: string): Promise<UsuarioInstance | null> => {
  return await Usuario.findOne({ where: { email } });
};

export const verifyPassword = async (plainPassword: string, hashedPassword: string) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const hashPassword = async (plainPassword: string) => {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const getUserRoles = async (usuarioId: number): Promise<string[]> => {
  const usuarioRoles = await UsuarioRol.findAll({
    where: { usuario_id: usuarioId },
    include: [{ model: Rol }],
  });
  return usuarioRoles.map((ur: any) => ur.Rol.nombre);
};
