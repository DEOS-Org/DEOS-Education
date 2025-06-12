import { Request, Response } from 'express';
import * as reportService from '../services/reportService';

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      curso_division_id,
      usuario_id
    } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        message: 'fecha_desde y fecha_hasta son requeridos'
      });
    }

    const filtros = {
      fecha_desde: new Date(fecha_desde as string),
      fecha_hasta: new Date(fecha_hasta as string),
      curso_division_id: curso_division_id ? parseInt(curso_division_id as string) : undefined,
      usuario_id: usuario_id ? parseInt(usuario_id as string) : undefined
    };

    const reporte = await reportService.generateAttendanceReport(filtros);

    res.json({
      filtros,
      total_registros: reporte.length,
      datos: reporte
    });
  } catch (error: any) {
    console.error('Error in getAttendanceReport:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error interno del servidor'
    });
  }
};

export const getSubjectAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { curso_division_materia_id } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        message: 'fecha_desde y fecha_hasta son requeridos'
      });
    }

    const reporte = await reportService.generateSubjectAttendanceReport(
      parseInt(curso_division_materia_id),
      new Date(fecha_desde as string),
      new Date(fecha_hasta as string)
    );

    res.json({
      curso_division_materia_id: parseInt(curso_division_materia_id),
      periodo: {
        desde: fecha_desde,
        hasta: fecha_hasta
      },
      datos: reporte
    });
  } catch (error: any) {
    console.error('Error in getSubjectAttendanceReport:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error interno del servidor'
    });
  }
};

export const getTeacherReport = async (req: Request, res: Response) => {
  try {
    const { profesor_id } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        message: 'fecha_desde y fecha_hasta son requeridos'
      });
    }

    const reporte = await reportService.generateTeacherReport(
      parseInt(profesor_id),
      new Date(fecha_desde as string),
      new Date(fecha_hasta as string)
    );

    res.json(reporte);
  } catch (error: any) {
    console.error('Error in getTeacherReport:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error interno del servidor'
    });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      curso_division_id
    } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        message: 'fecha_desde y fecha_hasta son requeridos'
      });
    }

    const filtros = {
      fecha_desde: new Date(fecha_desde as string),
      fecha_hasta: new Date(fecha_hasta as string),
      curso_division_id: curso_division_id ? parseInt(curso_division_id as string) : undefined
    };

    const reporte = await reportService.generateAttendanceReport(filtros);

    // Calcular estadísticas
    const estadisticas = {
      total_registros: reporte.length,
      presentes: reporte.filter(r => r.estado === 'presente').length,
      ausentes: reporte.filter(r => r.estado === 'ausente').length,
      tardanzas: reporte.filter(r => r.estado === 'tardanza').length,
      incompletos: reporte.filter(r => r.estado === 'incompleto').length,
      porcentaje_asistencia: 0
    };

    const totalAsistencias = estadisticas.presentes + estadisticas.tardanzas + estadisticas.incompletos;
    estadisticas.porcentaje_asistencia = estadisticas.total_registros > 0 
      ? Math.round((totalAsistencias / estadisticas.total_registros) * 100) 
      : 0;

    res.json({
      periodo: filtros,
      estadisticas,
      detalles_por_estado: {
        presentes: reporte.filter(r => r.estado === 'presente'),
        ausentes: reporte.filter(r => r.estado === 'ausente'),
        tardanzas: reporte.filter(r => r.estado === 'tardanza'),
        incompletos: reporte.filter(r => r.estado === 'incompleto')
      }
    });
  } catch (error: any) {
    console.error('Error in getAttendanceSummary:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Error interno del servidor'
    });
  }
};