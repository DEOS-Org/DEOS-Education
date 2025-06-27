import { 
  Registro, 
  Usuario, 
  Asistencia, 
  CursoDivisionMateria, 
  Horario,
  UsuarioCurso,
  Rol,
  CursoDivision
} from '../models';
import { Op } from 'sequelize';

export class AttendanceCalculationService {
  
  // Calcular asistencia automáticamente para una fecha específica
  async calculateAttendanceForDate(fecha: string): Promise<void> {
    try {
      console.log(`Calculando asistencia automática para ${fecha}`);
      
      // Obtener todos los estudiantes
      const students = await Usuario.findAll({
        include: [
          {
            model: Rol,
            where: { nombre: 'estudiante' },
            through: { attributes: [] }
          }
        ]
      });

      // Para cada estudiante, calcular su asistencia
      for (const student of students) {
        await this.calculateStudentAttendanceForDate(student.id, fecha);
      }

      console.log(`Cálculo de asistencia completado para ${fecha}`);
    } catch (error) {
      console.error(`Error calculando asistencia para ${fecha}:`, error);
      throw new Error(`Error calculando asistencia: ${error}`);
    }
  }

  // Calcular asistencia de un estudiante específico para una fecha
  async calculateStudentAttendanceForDate(studentId: number, fecha: string): Promise<void> {
    try {
      // Obtener registros biométricos del estudiante para esa fecha
      const registros = await Registro.findAll({
        where: {
          usuario_id: studentId,
          fecha: fecha
        },
        order: [['hora', 'ASC']]
      });

      // Determinar estado de asistencia basado en registros
      const attendanceStatus = this.determineAttendanceStatus(registros, fecha);

      // Obtener las clases del estudiante para esa fecha
      const studentClasses = await this.getStudentClassesForDate(studentId, fecha);

      // Crear/actualizar registros de asistencia para cada clase
      for (const classInfo of studentClasses) {
        await this.createOrUpdateAttendanceRecord(
          studentId,
          classInfo.cursoDivisionMateriaId,
          fecha,
          attendanceStatus,
          registros
        );
      }
    } catch (error) {
      console.error(`Error calculando asistencia del estudiante ${studentId}:`, error);
    }
  }

  // Determinar estado de asistencia basado en registros biométricos
  private determineAttendanceStatus(registros: any[], fecha: string): {
    estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
    horaEntrada?: string;
    horaSalida?: string;
    horaEntradaAlmuerzo?: string;
    horaSalidaAlmuerzo?: string;
  } {
    if (registros.length === 0) {
      return { estado: 'ausente' };
    }

    // Clasificar registros por tipo
    const entradas = registros.filter(r => r.tipo === 'entrada');
    const salidas = registros.filter(r => r.tipo === 'salida');

    if (entradas.length === 0) {
      return { estado: 'ausente' };
    }

    const primeraEntrada = entradas[0];
    const ultimaSalida = salidas[salidas.length - 1];

    // Determinar si llegó tarde (después de las 8:00 AM por ejemplo)
    const horaLimite = '08:00:00';
    const estado = primeraEntrada.hora > horaLimite ? 'tardanza' : 'presente';

    // Identificar registros de almuerzo (entre 12:00 y 14:00 aproximadamente)
    const registrosAlmuerzo = registros.filter(r => {
      const hora = r.hora;
      return hora >= '12:00:00' && hora <= '14:00:00';
    });

    const salidaAlmuerzo = registrosAlmuerzo.find(r => r.tipo === 'salida');
    const entradaAlmuerzo = registrosAlmuerzo.filter(r => r.tipo === 'entrada').pop();

    return {
      estado,
      horaEntrada: primeraEntrada.hora,
      horaSalida: ultimaSalida?.hora,
      horaEntradaAlmuerzo: salidaAlmuerzo?.hora,
      horaSalidaAlmuerzo: entradaAlmuerzo?.hora
    };
  }

  // Obtener clases de un estudiante para una fecha específica
  private async getStudentClassesForDate(studentId: number, fecha: string): Promise<any[]> {
    try {
      // Obtener el día de la semana
      const date = new Date(fecha);
      const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      
      // Mapear a nuestro enum de días
      const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const dayName = dayNames[dayOfWeek];

      // Obtener las divisiones/cursos del estudiante
      const studentCourses = await UsuarioCurso.findAll({
        where: { usuario_id: studentId },
        include: [
          {
            model: CursoDivision,
            include: [
              {
                model: CursoDivisionMateria,
                include: [
                  {
                    model: Horario,
                    where: { dia_semana: dayName },
                    required: false
                  }
                ]
              }
            ]
          }
        ]
      });

      const classes = [];
      for (const course of studentCourses) {
        if (course.CursoDivision?.CursoDivisionMaterias) {
          for (const materia of course.CursoDivision.CursoDivisionMaterias) {
            if (materia.Horarios && materia.Horarios.length > 0) {
              classes.push({
                cursoDivisionMateriaId: materia.id,
                horarios: materia.Horarios
              });
            }
          }
        }
      }

      return classes;
    } catch (error) {
      console.error(`Error obteniendo clases del estudiante ${studentId}:`, error);
      return [];
    }
  }

  // Crear o actualizar registro de asistencia
  private async createOrUpdateAttendanceRecord(
    studentId: number,
    cursoDivisionMateriaId: number,
    fecha: string,
    attendanceStatus: any,
    registros: any[]
  ): Promise<void> {
    try {
      const [asistencia, created] = await Asistencia.upsert({
        usuario_id: studentId,
        curso_division_materia_id: cursoDivisionMateriaId,
        fecha: fecha,
        estado: attendanceStatus.estado,
        hora_entrada: attendanceStatus.horaEntrada,
        hora_salida: attendanceStatus.horaSalida,
        hora_entrada_almuerzo: attendanceStatus.horaEntradaAlmuerzo,
        hora_salida_almuerzo: attendanceStatus.horaSalidaAlmuerzo,
        calculado_automaticamente: true,
        observaciones: this.generateObservations(registros)
      });

      if (created) {
        console.log(`Asistencia creada para estudiante ${studentId}, clase ${cursoDivisionMateriaId}`);
      } else {
        console.log(`Asistencia actualizada para estudiante ${studentId}, clase ${cursoDivisionMateriaId}`);
      }
    } catch (error) {
      console.error(`Error creando/actualizando asistencia:`, error);
    }
  }

  // Generar observaciones automáticas
  private generateObservations(registros: any[]): string {
    const observations = [];
    
    if (registros.length === 0) {
      observations.push('Sin registros biométricos');
    } else {
      observations.push(`${registros.length} registros biométricos`);
      
      const entradas = registros.filter(r => r.tipo === 'entrada').length;
      const salidas = registros.filter(r => r.tipo === 'salida').length;
      
      observations.push(`${entradas} entradas, ${salidas} salidas`);
    }

    return observations.join(' - ');
  }

  // Recalcular asistencia para un rango de fechas
  async recalculateAttendanceForDateRange(fechaInicio: string, fechaFin: string): Promise<void> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        await this.calculateAttendanceForDate(dateString);
      }
    } catch (error) {
      console.error(`Error recalculando asistencia:`, error);
      throw error;
    }
  }

  // Obtener estadísticas de asistencia para un estudiante
  async getStudentAttendanceStats(studentId: number, fechaInicio: string, fechaFin: string): Promise<any> {
    try {
      const attendance = await Asistencia.findAll({
        where: {
          usuario_id: studentId,
          fecha: {
            [Op.between]: [fechaInicio, fechaFin]
          }
        }
      });

      const total = attendance.length;
      const presente = attendance.filter(a => a.estado === 'presente').length;
      const tardanza = attendance.filter(a => a.estado === 'tardanza').length;
      const ausente = attendance.filter(a => a.estado === 'ausente').length;
      const justificado = attendance.filter(a => a.estado === 'justificado').length;

      return {
        total,
        presente,
        tardanza,
        ausente,
        justificado,
        porcentajeAsistencia: total > 0 ? ((presente + tardanza) / total) * 100 : 0
      };
    } catch (error) {
      console.error(`Error obteniendo estadísticas de asistencia:`, error);
      throw error;
    }
  }
}