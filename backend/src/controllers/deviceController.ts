import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/AppError';
import * as deviceService from '../services/deviceService';

export const createDevice = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, ip, puerto, tipo, ubicacion, descripcion } = req.body;
  if (!nombre || !ip || !puerto || !tipo || !ubicacion) {
    throw new AppError('Faltan campos requeridos', 400);
  }

  const dispositivo = await deviceService.createDevice({
    nombre,
    ip,
    puerto,
    tipo,
    ubicacion,
    descripcion,
    activo: true
  });

  res.status(201).json(dispositivo);
});

export const getDevices = asyncHandler(async (_req: Request, res: Response) => {
  const dispositivos = await deviceService.getDevices();
  res.json({ data: dispositivos });
});

export const getDeviceById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const dispositivo = await deviceService.getDeviceById(Number(id));
  if (!dispositivo) {
    throw new AppError('Dispositivo no encontrado', 404);
  }
  res.json(dispositivo);
});

export const updateDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, ip, puerto, tipo, ubicacion, descripcion, activo } = req.body;

  const dispositivo = await deviceService.updateDevice(Number(id), {
    nombre,
    ip,
    puerto,
    tipo,
    ubicacion,
    descripcion,
    activo
  });

  res.json(dispositivo);
});

export const deleteDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deviceService.deleteDevice(Number(id));
  res.json(result);
});

export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deviceService.testConnection(Number(id));
  res.json(result);
});

export const activateDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const dispositivo = await deviceService.updateDeviceStatus(Number(id), true);
  res.json({ message: 'Dispositivo activado correctamente', dispositivo });
});

export const deactivateDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const dispositivo = await deviceService.updateDeviceStatus(Number(id), false);
  res.json({ message: 'Dispositivo desactivado correctamente', dispositivo });
});

export const getDeviceStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const status = await deviceService.getDeviceStatus(Number(id));
  res.json(status);
});

export const syncDevice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deviceService.syncDevice(Number(id));
  res.json(result);
}); 