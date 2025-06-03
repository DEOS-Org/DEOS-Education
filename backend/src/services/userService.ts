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

export const createUser = async ({ dni, nombre, apellido, email, contraseña, roles }: any) => {
  // Validar unicidad de email y dni
  const existe = await Usuario.findOne({ where: { email } });
  if (existe) throw new Error('El email ya está registrado');
  const existeDni = await Usuario.findOne({ where: { dni } });
  if (existeDni) throw new Error('El DNI ya está registrado');
  const hash = await hashPassword(contraseña);
  const usuario = await Usuario.create({ dni, nombre, apellido, email, contraseña: hash });
  // Asignar roles si se pasan
  if (roles && Array.isArray(roles)) {
    for (const rolNombre of roles) {
      const rol = await Rol.findOne({ where: { nombre: rolNombre } });
      if (rol) {
        await UsuarioRol.create({ usuario_id: usuario.id!, rol_id: rol.id! });
      }
    }
  }
  return usuario;
};

export const getUsers = async () => {
  return await Usuario.findAll({ include: [{ model: Rol, through: { attributes: [] } }] });
};

export const getUserById = async (id: number) => {
  return await Usuario.findByPk(id, { include: [{ model: Rol, through: { attributes: [] } }] });
};

export const updateUser = async (id: number, data: any) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error('Usuario no encontrado');
  await usuario.update(data);
  return usuario;
};

export const updateUserStatus = async (id: number, activo: boolean) => {
  const user = await Usuario.findByPk(id);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  user.activo = activo;
  await user.save();
  return user;
};

export const assignRoles = async (id: number, roles: string[]) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error('Usuario no encontrado');
  // Eliminar roles actuales
  await UsuarioRol.destroy({ where: { usuario_id: id } });
  // Asignar nuevos roles
  for (const rolNombre of roles) {
    const rol = await Rol.findOne({ where: { nombre: rolNombre } });
    if (rol) {
      await UsuarioRol.create({ usuario_id: id, rol_id: rol.id! });
    }
  }
  return await Usuario.findByPk(id, { include: [{ model: Rol, through: { attributes: [] } }] });
};
