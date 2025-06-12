import { Rol, Usuario } from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

export const getRoles = async () => {
  const roles = await Rol.findAll({
    order: [['nombre', 'ASC']]
  });

  return roles.map(rol => ({
    id: rol.id,
    nombre: rol.nombre,
    descripcion: `Rol de ${rol.nombre}`,
    permisos: getDefaultPermissions(rol.nombre),
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
};

export const getRoleById = async (id: number) => {
  const rol = await Rol.findByPk(id);
  
  if (!rol) {
    throw new AppError('Rol no encontrado', 404);
  }

  return {
    id: rol.id,
    nombre: rol.nombre,
    descripcion: `Rol de ${rol.nombre}`,
    permisos: getDefaultPermissions(rol.nombre),
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const createRole = async (data: {
  nombre: string;
  descripcion?: string;
  permisos: string[];
  activo: boolean;
}) => {
  // Check if role exists
  const existingRole = await Rol.findOne({
    where: { nombre: data.nombre }
  });

  if (existingRole) {
    throw new AppError('Ya existe un rol con ese nombre', 400);
  }

  const rol = await Rol.create({
    nombre: data.nombre
  });

  return {
    id: rol.id,
    nombre: rol.nombre,
    descripcion: data.descripcion || `Rol de ${rol.nombre}`,
    permisos: data.permisos,
    activo: data.activo,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const updateRole = async (id: number, data: {
  nombre: string;
  descripcion?: string;
  permisos: string[];
  activo: boolean;
}) => {
  const rol = await Rol.findByPk(id);
  
  if (!rol) {
    throw new AppError('Rol no encontrado', 404);
  }

  // Check if another role with this name exists
  const existingRole = await Rol.findOne({
    where: { 
      nombre: data.nombre,
      id: { [Op.ne]: id }
    }
  });

  if (existingRole) {
    throw new AppError('Ya existe un rol con ese nombre', 400);
  }

  await rol.update({
    nombre: data.nombre
  });

  return {
    id: rol.id,
    nombre: rol.nombre,
    descripcion: data.descripcion || `Rol de ${rol.nombre}`,
    permisos: data.permisos,
    activo: data.activo,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const deleteRole = async (id: number) => {
  const rol = await Rol.findByPk(id);
  
  if (!rol) {
    throw new AppError('Rol no encontrado', 404);
  }

  // Check if users are assigned to this role
  const usuariosConRol = await Usuario.findAll({
    include: [
      {
        model: Rol,
        where: { id },
        through: { attributes: [] }
      }
    ]
  });

  if (usuariosConRol.length > 0) {
    throw new AppError('No se puede eliminar un rol que tiene usuarios asignados', 400);
  }

  await rol.destroy();
  return { message: 'Rol eliminado correctamente' };
};

export const getPermissions = () => {
  return [
    { id: 'users_read', name: 'Ver usuarios', category: 'Usuarios' },
    { id: 'users_write', name: 'Crear/editar usuarios', category: 'Usuarios' },
    { id: 'users_delete', name: 'Eliminar usuarios', category: 'Usuarios' },
    { id: 'roles_read', name: 'Ver roles', category: 'Roles' },
    { id: 'roles_write', name: 'Crear/editar roles', category: 'Roles' },
    { id: 'roles_delete', name: 'Eliminar roles', category: 'Roles' },
    { id: 'devices_read', name: 'Ver dispositivos', category: 'Dispositivos' },
    { id: 'devices_write', name: 'Crear/editar dispositivos', category: 'Dispositivos' },
    { id: 'devices_delete', name: 'Eliminar dispositivos', category: 'Dispositivos' },
    { id: 'academic_read', name: 'Ver gestión académica', category: 'Académico' },
    { id: 'academic_write', name: 'Crear/editar académico', category: 'Académico' },
    { id: 'academic_delete', name: 'Eliminar académico', category: 'Académico' },
    { id: 'biometric_read', name: 'Ver biométrico', category: 'Biométrico' },
    { id: 'biometric_write', name: 'Crear/editar biométrico', category: 'Biométrico' },
    { id: 'biometric_delete', name: 'Eliminar biométrico', category: 'Biométrico' },
    { id: 'reports_read', name: 'Ver reportes', category: 'Reportes' },
    { id: 'reports_generate', name: 'Generar reportes', category: 'Reportes' },
    { id: 'settings_read', name: 'Ver configuración', category: 'Configuración' },
    { id: 'settings_write', name: 'Modificar configuración', category: 'Configuración' }
  ];
};

export const getUsersByRole = async (roleName: string) => {
  const usuarios = await Usuario.findAll({
    include: [
      {
        model: Rol,
        where: { nombre: roleName },
        through: { attributes: [] }
      }
    ],
    order: [['nombre', 'ASC']]
  });

  return usuarios.map(usuario => ({
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    dni: usuario.dni,
    activo: usuario.activo,
    createdAt: usuario.created_at || new Date(),
    updatedAt: usuario.updated_at || new Date()
  }));
};

export const assignRoleToUser = async (userId: number, roleId: number) => {
  const usuario = await Usuario.findByPk(userId);
  const rol = await Rol.findByPk(roleId);

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (!rol) {
    throw new AppError('Rol no encontrado', 404);
  }

  // TODO: Implement role assignment via UsuarioRol table
  return { message: 'Rol asignado correctamente' };
};

export const removeRoleFromUser = async (userId: number, roleId: number) => {
  const usuario = await Usuario.findByPk(userId);
  const rol = await Rol.findByPk(roleId);

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (!rol) {
    throw new AppError('Rol no encontrado', 404);
  }

  // TODO: Implement role removal via UsuarioRol table
  return { message: 'Rol removido correctamente' };
};

// Helper function to get default permissions for a role
function getDefaultPermissions(roleName: string): string[] {
  switch (roleName.toLowerCase()) {
    case 'admin':
      return [
        'users_read', 'users_write', 'users_delete',
        'roles_read', 'roles_write', 'roles_delete',
        'devices_read', 'devices_write', 'devices_delete',
        'academic_read', 'academic_write', 'academic_delete',
        'biometric_read', 'biometric_write', 'biometric_delete',
        'reports_read', 'reports_generate',
        'settings_read', 'settings_write'
      ];
    case 'profesor':
      return [
        'academic_read',
        'biometric_read',
        'reports_read'
      ];
    case 'preceptor':
      return [
        'users_read',
        'academic_read',
        'biometric_read', 'biometric_write',
        'reports_read', 'reports_generate'
      ];
    case 'alumno':
      return [
        'biometric_read'
      ];
    case 'padre':
      return [
        'reports_read'
      ];
    default:
      return [];
  }
}