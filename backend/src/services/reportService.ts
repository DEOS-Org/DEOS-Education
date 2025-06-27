import { Op } from 'sequelize';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { 
  Registro, 
  Usuario, 
  CursoDivision, 
  Horario, 
  CursoDivisionMateria, 
  Materia,
  RegistroInstance,
  UsuarioInstance,
  CursoDivisionInstance,
  HorarioInstance,
  CursoDivisionMateriaInstance,
  MateriaInstance,
  CursoInstance,
  DivisionInstance
} from '../models';
import { AppError } from '../utils/AppError';

// Type definitions for models with associations
interface CursoDivisionWithAssociations extends CursoDivisionInstance {
  Curso?: CursoInstance;
  Division?: DivisionInstance;
}

interface CursoDivisionMateriaWithAssociations extends CursoDivisionMateriaInstance {
  Materia?: MateriaInstance;
  CursoDivision?: CursoDivisionWithAssociations;
}

interface HorarioWithAssociations extends HorarioInstance {
  CursoDivisionMateria?: CursoDivisionMateriaWithAssociations;
}

interface AsistenciaReporte {
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  };
  fecha: string;
  ingreso?: Date;
  egreso?: Date;
  estado: 'presente' | 'ausente' | 'tardanza' | 'incompleto';
  minutos_tardanza?: number;
}

interface ReporteFiltros {
  fecha_desde: Date;
  fecha_hasta: Date;
  curso_division_id?: number;
  usuario_id?: number;
}

export const generateAttendanceReport = async (
  filtros: ReporteFiltros
): Promise<AsistenciaReporte[]> => {
  try {
    const { fecha_desde, fecha_hasta, curso_division_id, usuario_id } = filtros;

    // Construir filtros para usuarios
    const userFilters: any = { activo: true };
    
    if (usuario_id) {
      userFilters.id = usuario_id;
    }
    
    if (curso_division_id) {
      // Filtrar por usuarios del curso específico
      const usuariosDelCurso = await require('../models').UsuarioCurso.findAll({
        where: { curso_division_id },
        attributes: ['usuario_id']
      });
      
      userFilters.id = {
        [Op.in]: usuariosDelCurso.map((uc: any) => uc.usuario_id)
      };
    }

    // Obtener usuarios relevantes
    const usuarios = await Usuario.findAll({
      where: userFilters,
      include: [
        {
          model: require('../models').Rol,
          where: { nombre: 'alumno' },
          through: { attributes: [] }
        }
      ]
    });

    const reporte: AsistenciaReporte[] = [];

    // Generar reporte día por día
    const currentDate = new Date(fecha_desde);
    const endDate = new Date(fecha_hasta);

    while (currentDate <= endDate) {
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      for (const usuario of usuarios) {
        const registrosDelDia = await Registro.findAll({
          where: {
            usuario_id: usuario.id,
            fecha: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay
            }
          },
          order: [['fecha', 'ASC']]
        });

        const asistencia = await processUserAttendance(usuario, registrosDelDia, startOfDay);
        reporte.push(asistencia);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return reporte;
  } catch (error) {
    console.error('Error generating attendance report:', error);
    throw new AppError('Error al generar el reporte de asistencia');
  }
};

const processUserAttendance = async (
  usuario: any,
  registros: any[],
  fecha: Date
): Promise<AsistenciaReporte> => {
  const asistencia: AsistenciaReporte = {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni
    },
    fecha: fecha.toISOString().split('T')[0],
    estado: 'ausente'
  };

  if (registros.length === 0) {
    return asistencia;
  }

  // Buscar primer ingreso y último egreso
  const ingresos = registros.filter(r => r.tipo === 'ingreso');
  const egresos = registros.filter(r => r.tipo === 'egreso');

  if (ingresos.length > 0) {
    asistencia.ingreso = ingresos[0].fecha;
    asistencia.estado = 'presente';

    // Verificar tardanza (asumiendo que la entrada debe ser antes de las 8:00 AM)
    const horaEntrada = new Date(asistencia.ingreso!);
    const horaLimite = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    
    if (horaEntrada > horaLimite) {
      asistencia.estado = 'tardanza';
      asistencia.minutos_tardanza = Math.floor((horaEntrada.getTime() - horaLimite.getTime()) / (1000 * 60));
    }
  }

  if (egresos.length > 0) {
    asistencia.egreso = egresos[egresos.length - 1].fecha;
  } else if (asistencia.ingreso) {
    asistencia.estado = 'incompleto'; // Ingresó pero no registró salida
  }

  return asistencia;
};

export const generateSubjectAttendanceReport = async (
  curso_division_materia_id: number,
  fecha_desde: Date,
  fecha_hasta: Date
): Promise<any[]> => {
  try {
    // Obtener información de la materia y curso
    const cdMateria = await CursoDivisionMateria.findByPk(curso_division_materia_id, {
      include: [
        {
          model: Materia,
          attributes: ['nombre', 'carga_horaria']
        },
        {
          model: CursoDivision,
          include: [
            {
              model: require('../models').Curso,
              attributes: ['año']
            },
            {
              model: require('../models').Division,
              attributes: ['division']
            }
          ]
        }
      ]
    });

    if (!cdMateria) {
      throw new AppError('Materia no encontrada');
    }

    // Obtener horarios de la materia en el rango de fechas
    const horarios = await Horario.findAll({
      where: { curso_division_materia_id }
    });

    // Obtener alumnos del curso
    const alumnos = await require('../models').UsuarioCurso.findAll({
      where: { curso_division_id: cdMateria.curso_division_id },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni']
        }
      ]
    });

    const reporte = [];

    // Para cada horario de clase, verificar asistencia
    for (const horario of horarios) {
      const claseFecha = getNextClassDate(horario.dia, fecha_desde, fecha_hasta);
      
      if (claseFecha) {
        for (const alumno of alumnos) {
          const asistenciaClase = await checkClassAttendance(
            alumno.Usuario,
            claseFecha,
            horario.hora_inicio,
            horario.hora_fin
          );
          
          const cdMateriaTyped = cdMateria as CursoDivisionMateriaWithAssociations;
          reporte.push({
            ...asistenciaClase,
            materia: cdMateriaTyped.Materia?.nombre || 'Sin materia',
            curso: `${cdMateriaTyped.CursoDivision?.Curso?.año || '?'}° ${cdMateriaTyped.CursoDivision?.Division?.division || '?'}`,
            fecha_clase: claseFecha,
            horario: `${horario.hora_inicio} - ${horario.hora_fin}`
          });
        }
      }
    }

    return reporte;
  } catch (error) {
    console.error('Error generating subject attendance report:', error);
    throw new AppError('Error al generar el reporte de asistencia por materia');
  }
};

const getNextClassDate = (dia: string, fecha_desde: Date, fecha_hasta: Date): Date | null => {
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const targetDay = diasSemana.indexOf(dia);
  
  if (targetDay === -1) return null;

  const currentDate = new Date(fecha_desde);
  
  while (currentDate <= fecha_hasta) {
    if (currentDate.getDay() === targetDay) {
      return new Date(currentDate);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return null;
};

const checkClassAttendance = async (
  usuario: any,
  fechaClase: Date,
  horaInicio: string,
  horaFin: string
): Promise<any> => {
  const startOfDay = new Date(fechaClase.getFullYear(), fechaClase.getMonth(), fechaClase.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Buscar registros del día
  const registros = await Registro.findAll({
    where: {
      usuario_id: usuario.id,
      fecha: {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay
      }
    },
    order: [['fecha', 'ASC']]
  });

  // Determinar si estuvo presente durante el horario de la clase
  const horaInicioClase = parseTimeToDate(fechaClase, horaInicio);
  const horaFinClase = parseTimeToDate(fechaClase, horaFin);

  let presente = false;
  let llegada: Date | null = null;

  for (const registro of registros) {
    if (registro.tipo === 'ingreso' && registro.fecha <= horaFinClase) {
      presente = true;
      if (!llegada || registro.fecha < llegada) {
        llegada = registro.fecha;
      }
    }
  }

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni
    },
    presente,
    llegada,
    tardanza: llegada ? llegada > horaInicioClase : false,
    minutos_tardanza: llegada && llegada > horaInicioClase 
      ? Math.floor((llegada.getTime() - horaInicioClase.getTime()) / (1000 * 60))
      : 0
  };
};

const parseTimeToDate = (fecha: Date, tiempo: string): Date => {
  const [horas, minutos, segundos] = tiempo.split(':').map(Number);
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horas, minutos, segundos || 0);
};

export const generateTeacherReport = async (
  profesor_id: number,
  fecha_desde: Date,
  fecha_hasta: Date
): Promise<any> => {
  try {
    const horarios = await Horario.findAll({
      where: { profesor_usuario_id: profesor_id },
      include: [
        {
          model: CursoDivisionMateria,
          include: [
            {
              model: Materia,
              attributes: ['nombre']
            },
            {
              model: CursoDivision,
              include: [
                {
                  model: require('../models').Curso,
                  attributes: ['año']
                },
                {
                  model: require('../models').Division,
                  attributes: ['division']
                }
              ]
            }
          ]
        }
      ]
    });

    return {
      profesor_id,
      horarios_asignados: horarios.length,
      materias: horarios.map(h => {
        const hTyped = h as HorarioWithAssociations;
        return {
          materia: hTyped.CursoDivisionMateria?.Materia?.nombre || 'Sin materia',
          curso: `${hTyped.CursoDivisionMateria?.CursoDivision?.Curso?.año || '?'}° ${hTyped.CursoDivisionMateria?.CursoDivision?.Division?.division || '?'}`,
          dia: h.dia,
          horario: `${h.hora_inicio} - ${h.hora_fin}`
        };
      })
    };
  } catch (error) {
    console.error('Error generating teacher report:', error);
    throw new AppError('Error al generar el reporte del profesor');
  }
};

// === NUEVOS REPORTES ===

export const generateAcademicPerformanceReport = async (
  filtros: ReporteFiltros
): Promise<any[]> => {
  try {
    const { fecha_desde, fecha_hasta, curso_division_id } = filtros;

    // Obtener notas en el período especificado
    const notas = await require('../models').Nota.findAll({
      where: {
        fecha: {
          [Op.between]: [fecha_desde, fecha_hasta]
        },
        ...(curso_division_id && {
          '$Usuario.UsuarioCursos.curso_division_id$': curso_division_id
        })
      },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'apellido', 'dni'],
          include: [
            {
              model: require('../models').UsuarioCurso,
              where: curso_division_id ? { curso_division_id } : {},
              include: [
                {
                  model: CursoDivision,
                  include: [
                    {
                      model: require('../models').Curso,
                      attributes: ['año']
                    },
                    {
                      model: require('../models').Division,
                      attributes: ['division']
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          model: require('../models').TipoEvaluacion,
          attributes: ['nombre', 'descripcion']
        },
        {
          model: CursoDivisionMateria,
          include: [
            {
              model: Materia,
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    // Procesar datos por alumno
    const estudiantesMap = new Map();

    for (const nota of notas) {
      const estudianteId = nota.Usuario.id;
      
      if (!estudiantesMap.has(estudianteId)) {
        estudiantesMap.set(estudianteId, {
          estudiante: {
            id: nota.Usuario.id,
            nombre: nota.Usuario.nombre,
            apellido: nota.Usuario.apellido,
            dni: nota.Usuario.dni
          },
          curso: nota.Usuario.UsuarioCursos?.[0]?.CursoDivision 
            ? `${nota.Usuario.UsuarioCursos[0].CursoDivision.Curso?.año}° ${nota.Usuario.UsuarioCursos[0].CursoDivision.Division?.division}`
            : 'Sin curso',
          materias: new Map(),
          promedio_general: 0,
          total_notas: 0
        });
      }

      const estudiante = estudiantesMap.get(estudianteId);
      const materiaId = nota.CursoDivisionMateria.id;
      const materiaNombre = nota.CursoDivisionMateria.Materia?.nombre || 'Sin materia';

      if (!estudiante.materias.has(materiaId)) {
        estudiante.materias.set(materiaId, {
          nombre: materiaNombre,
          notas: [],
          promedio: 0
        });
      }

      estudiante.materias.get(materiaId).notas.push({
        valor: nota.valor,
        tipo: nota.TipoEvaluacion?.nombre || 'Sin tipo',
        fecha: nota.fecha,
        observaciones: nota.observaciones
      });

      estudiante.total_notas++;
    }

    // Calcular promedios
    const resultado = Array.from(estudiantesMap.values()).map(estudiante => {
      let sumaTotal = 0;
      let totalNotas = 0;

      estudiante.materias.forEach((materia: any) => {
        const sumaMateria = materia.notas.reduce((sum: number, nota: any) => sum + nota.valor, 0);
        materia.promedio = materia.notas.length > 0 ? (sumaMateria / materia.notas.length) : 0;
        sumaTotal += sumaMateria;
        totalNotas += materia.notas.length;
      });

      estudiante.promedio_general = totalNotas > 0 ? (sumaTotal / totalNotas) : 0;
      estudiante.materias = Array.from(estudiante.materias.values());

      return estudiante;
    });

    return resultado;
  } catch (error) {
    console.error('Error generating academic performance report:', error);
    throw new AppError('Error al generar el reporte de rendimiento académico');
  }
};

export const generateStatisticsReport = async (
  filtros: ReporteFiltros
): Promise<any> => {
  try {
    const { fecha_desde, fecha_hasta, curso_division_id } = filtros;

    // Estadísticas de asistencia
    const asistenciaData = await generateAttendanceReport(filtros);
    
    const estadisticasAsistencia = {
      total_registros: asistenciaData.length,
      presentes: asistenciaData.filter(r => r.estado === 'presente').length,
      ausentes: asistenciaData.filter(r => r.estado === 'ausente').length,
      tardanzas: asistenciaData.filter(r => r.estado === 'tardanza').length,
      incompletos: asistenciaData.filter(r => r.estado === 'incompleto').length
    };

    // Calcular porcentajes
    const porcentajes = {
      asistencia: estadisticasAsistencia.total_registros > 0 
        ? ((estadisticasAsistencia.presentes + estadisticasAsistencia.tardanzas + estadisticasAsistencia.incompletos) / estadisticasAsistencia.total_registros * 100).toFixed(2)
        : '0',
      ausencias: estadisticasAsistencia.total_registros > 0 
        ? (estadisticasAsistencia.ausentes / estadisticasAsistencia.total_registros * 100).toFixed(2)
        : '0',
      tardanzas: estadisticasAsistencia.total_registros > 0 
        ? (estadisticasAsistencia.tardanzas / estadisticasAsistencia.total_registros * 100).toFixed(2)
        : '0'
    };

    // Estadísticas por día de la semana
    const estadisticasPorDia = {};
    asistenciaData.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      
      if (!estadisticasPorDia[diaSemana]) {
        estadisticasPorDia[diaSemana] = {
          total: 0,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0
        };
      }
      
      estadisticasPorDia[diaSemana].total++;
      estadisticasPorDia[diaSemana][registro.estado]++;
    });

    // Estadísticas de rendimiento académico (si hay filtro de curso)
    let estadisticasRendimiento = null;
    if (curso_division_id) {
      try {
        const rendimientoData = await generateAcademicPerformanceReport(filtros);
        const promedios = rendimientoData.map(e => e.promedio_general).filter(p => p > 0);
        
        estadisticasRendimiento = {
          total_estudiantes: rendimientoData.length,
          promedio_general: promedios.length > 0 
            ? (promedios.reduce((sum, p) => sum + p, 0) / promedios.length).toFixed(2)
            : '0',
          estudiantes_sobresalientes: rendimientoData.filter(e => e.promedio_general >= 8).length,
          estudiantes_regulares: rendimientoData.filter(e => e.promedio_general >= 6 && e.promedio_general < 8).length,
          estudiantes_en_riesgo: rendimientoData.filter(e => e.promedio_general < 6 && e.promedio_general > 0).length
        };
      } catch (error) {
        console.warn('No se pudieron obtener estadísticas de rendimiento:', error.message);
      }
    }

    return {
      periodo: {
        desde: fecha_desde.toISOString().split('T')[0],
        hasta: fecha_hasta.toISOString().split('T')[0]
      },
      asistencia: {
        conteos: estadisticasAsistencia,
        porcentajes,
        por_dia: estadisticasPorDia
      },
      rendimiento: estadisticasRendimiento,
      generado_en: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating statistics report:', error);
    throw new AppError('Error al generar el reporte de estadísticas');
  }
};

// === FUNCIONES DE EXPORTACIÓN ===

export const exportToExcel = async (data: any[], tipo: string): Promise<Buffer> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Reporte ${tipo}`);

    // Configurar estilos
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
      alignment: { horizontal: 'center' }
    };

    switch (tipo) {
      case 'asistencia':
        worksheet.columns = [
          { header: 'Nombre', key: 'nombre', width: 20 },
          { header: 'Apellido', key: 'apellido', width: 20 },
          { header: 'DNI', key: 'dni', width: 15 },
          { header: 'Fecha', key: 'fecha', width: 15 },
          { header: 'Estado', key: 'estado', width: 15 },
          { header: 'Ingreso', key: 'ingreso', width: 20 },
          { header: 'Egreso', key: 'egreso', width: 20 },
          { header: 'Min. Tardanza', key: 'minutos_tardanza', width: 15 }
        ];

        data.forEach(registro => {
          worksheet.addRow({
            nombre: registro.usuario.nombre,
            apellido: registro.usuario.apellido,
            dni: registro.usuario.dni,
            fecha: registro.fecha,
            estado: registro.estado,
            ingreso: registro.ingreso ? new Date(registro.ingreso).toLocaleString() : '',
            egreso: registro.egreso ? new Date(registro.egreso).toLocaleString() : '',
            minutos_tardanza: registro.minutos_tardanza || 0
          });
        });
        break;

      case 'rendimiento':
        worksheet.columns = [
          { header: 'Nombre', key: 'nombre', width: 20 },
          { header: 'Apellido', key: 'apellido', width: 20 },
          { header: 'DNI', key: 'dni', width: 15 },
          { header: 'Curso', key: 'curso', width: 15 },
          { header: 'Promedio General', key: 'promedio', width: 18 },
          { header: 'Total Notas', key: 'total_notas', width: 15 }
        ];

        data.forEach(estudiante => {
          worksheet.addRow({
            nombre: estudiante.estudiante.nombre,
            apellido: estudiante.estudiante.apellido,
            dni: estudiante.estudiante.dni,
            curso: estudiante.curso,
            promedio: estudiante.promedio_general.toFixed(2),
            total_notas: estudiante.total_notas
          });
        });
        break;

      default:
        throw new AppError('Tipo de reporte no soportado para exportación');
    }

    // Aplicar estilos al header
    worksheet.getRow(1).eachCell(cell => {
      Object.assign(cell, headerStyle);
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new AppError('Error al exportar a Excel');
  }
};

export const exportToPDF = async (data: any[], tipo: string): Promise<Buffer> => {
  try {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Título
    doc.setFontSize(16);
    doc.text(`Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 20, yPosition);
    yPosition += 15;

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    doc.setFontSize(8);

    switch (tipo) {
      case 'asistencia':
        // Headers
        doc.text('Nombre', 20, yPosition);
        doc.text('Apellido', 50, yPosition);
        doc.text('DNI', 80, yPosition);
        doc.text('Fecha', 110, yPosition);
        doc.text('Estado', 140, yPosition);
        doc.text('Ingreso', 170, yPosition);
        yPosition += 10;

        // Línea separadora
        doc.line(20, yPosition - 5, 200, yPosition - 5);

        // Datos
        data.forEach(registro => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(registro.usuario.nombre || '', 20, yPosition);
          doc.text(registro.usuario.apellido || '', 50, yPosition);
          doc.text(registro.usuario.dni || '', 80, yPosition);
          doc.text(registro.fecha || '', 110, yPosition);
          doc.text(registro.estado || '', 140, yPosition);
          doc.text(registro.ingreso ? new Date(registro.ingreso).toLocaleTimeString() : '', 170, yPosition);
          yPosition += 8;
        });
        break;

      case 'rendimiento':
        // Headers
        doc.text('Nombre', 20, yPosition);
        doc.text('Apellido', 50, yPosition);
        doc.text('DNI', 80, yPosition);
        doc.text('Curso', 110, yPosition);
        doc.text('Promedio', 140, yPosition);
        yPosition += 10;

        // Línea separadora
        doc.line(20, yPosition - 5, 170, yPosition - 5);

        // Datos
        data.forEach(estudiante => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(estudiante.estudiante.nombre || '', 20, yPosition);
          doc.text(estudiante.estudiante.apellido || '', 50, yPosition);
          doc.text(estudiante.estudiante.dni || '', 80, yPosition);
          doc.text(estudiante.curso || '', 110, yPosition);
          doc.text(estudiante.promedio_general?.toFixed(2) || '0', 140, yPosition);
          yPosition += 8;
        });
        break;

      default:
        throw new AppError('Tipo de reporte no soportado para exportación PDF');
    }

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new AppError('Error al exportar a PDF');
  }
};