import { DispositivoFichaje, DispositivoFichajeInstance } from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

export const getDevices = async () => {
  const devices = await DispositivoFichaje.findAll({
    order: [['id', 'ASC']]
  });

  return devices.map(device => ({
    id: device.id,
    nombre: device.identificador_unico,
    descripcion: device.descripcion || '',
    ip: '192.168.1.100', // Default IP for frontend compatibility
    puerto: 8080, // Default port
    tipo: 'ESP32', // Default type
    ubicacion: device.ubicacion || '',
    activo: device.activo !== false,
    estado: device.activo ? 'online' : 'offline',
    ultima_conexion: new Date(),
    createdAt: device.created_at || new Date(),
    updatedAt: device.updated_at || new Date()
  }));
};

export const getDeviceById = async (id: number) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  return {
    id: device.id,
    nombre: device.identificador_unico,
    descripcion: device.descripcion || '',
    ip: '192.168.1.100',
    puerto: 8080,
    tipo: 'ESP32',
    ubicacion: device.ubicacion || '',
    activo: device.activo !== false,
    estado: device.activo ? 'online' : 'offline',
    ultima_conexion: new Date(),
    createdAt: device.created_at || new Date(),
    updatedAt: device.updated_at || new Date()
  };
};

export const createDevice = async (data: {
  nombre: string;
  descripcion?: string;
  ip: string;
  puerto: number;
  tipo: string;
  ubicacion?: string;
  activo: boolean;
}) => {
  // Check if device with this identifier exists
  const existingDevice = await DispositivoFichaje.findOne({
    where: { identificador_unico: data.nombre }
  });

  if (existingDevice) {
    throw new AppError('Ya existe un dispositivo con ese identificador', 400);
  }

  const device = await DispositivoFichaje.create({
    identificador_unico: data.nombre,
    descripcion: data.descripcion,
    ubicacion: data.ubicacion,
    activo: data.activo
  });

  return {
    id: device.id,
    nombre: device.identificador_unico,
    descripcion: device.descripcion || '',
    ip: data.ip,
    puerto: data.puerto,
    tipo: data.tipo,
    ubicacion: device.ubicacion || '',
    activo: device.activo !== false,
    estado: device.activo ? 'online' : 'offline',
    ultima_conexion: new Date(),
    createdAt: device.created_at || new Date(),
    updatedAt: device.updated_at || new Date()
  };
};

export const updateDevice = async (id: number, data: {
  nombre: string;
  descripcion?: string;
  ip: string;
  puerto: number;
  tipo: string;
  ubicacion?: string;
  activo: boolean;
}) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  // Check if another device with this identifier exists
  const existingDevice = await DispositivoFichaje.findOne({
    where: { 
      identificador_unico: data.nombre,
      id: { [Op.ne]: id }
    }
  });

  if (existingDevice) {
    throw new AppError('Ya existe un dispositivo con ese identificador', 400);
  }

  await device.update({
    identificador_unico: data.nombre,
    descripcion: data.descripcion,
    ubicacion: data.ubicacion,
    activo: data.activo
  });

  return {
    id: device.id,
    nombre: device.identificador_unico,
    descripcion: device.descripcion || '',
    ip: data.ip,
    puerto: data.puerto,
    tipo: data.tipo,
    ubicacion: device.ubicacion || '',
    activo: device.activo !== false,
    estado: device.activo ? 'online' : 'offline',
    ultima_conexion: new Date(),
    createdAt: device.created_at || new Date(),
    updatedAt: device.updated_at || new Date()
  };
};

export const updateDeviceStatus = async (id: number, activo: boolean) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  await device.update({ activo });

  return {
    id: device.id,
    nombre: device.identificador_unico,
    descripcion: device.descripcion || '',
    ip: '192.168.1.100',
    puerto: 8080,
    tipo: 'ESP32',
    ubicacion: device.ubicacion || '',
    activo: device.activo !== false,
    estado: device.activo ? 'online' : 'offline',
    ultima_conexion: new Date(),
    createdAt: device.created_at || new Date(),
    updatedAt: device.updated_at || new Date()
  };
};

export const deleteDevice = async (id: number) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  await device.destroy();
  return { message: 'Dispositivo eliminado correctamente' };
};

export const testDeviceConnection = async (id: number) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  if (!device.activo) {
    throw new AppError('El dispositivo está desactivado', 400);
  }

  // Simulate connection test
  const isOnline = Math.random() > 0.3; // 70% success rate

  return {
    id: device.id,
    nombre: device.identificador_unico,
    conectado: isOnline,
    latencia: isOnline ? Math.floor(Math.random() * 100) + 10 : null,
    mensaje: isOnline ? 'Conexión exitosa' : 'Error de conexión'
  };
};

export const getDeviceStatus = async (id: number) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  return {
    id: device.id,
    nombre: device.identificador_unico,
    estado: device.activo ? 'online' : 'offline',
    activo: device.activo !== false,
    ultima_actividad: new Date(),
    registros_hoy: Math.floor(Math.random() * 50) + 10,
    uptime: device.activo ? '12:34:56' : '00:00:00'
  };
};

// Add missing methods referenced by controller
export const testConnection = async (id: number) => {
  return await testDeviceConnection(id);
};

export const syncDevice = async (id: number) => {
  const device = await DispositivoFichaje.findByPk(id);
  
  if (!device) {
    throw new AppError('Dispositivo no encontrado', 404);
  }

  if (!device.activo) {
    throw new AppError('El dispositivo está desactivado', 400);
  }

  // Simulate synchronization
  const success = Math.random() > 0.2; // 80% success rate

  return {
    id: device.id,
    nombre: device.identificador_unico,
    sincronizado: success,
    mensaje: success ? 'Sincronización exitosa' : 'Error en la sincronización',
    timestamp: new Date(),
    registros_sincronizados: success ? Math.floor(Math.random() * 100) + 10 : 0
  };
};