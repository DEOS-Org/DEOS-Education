import { 
  Usuario, 
  ProfesorMateria, 
  Materia, 
  CursoDivision, 
  CursoDivisionMateria, 
  Curso, 
  Division, 
  Asistencia, 
  Calificacion,
  Horario,
  UsuarioCurso,
  Rol,
  sequelize
} from '../models';
import { Op } from 'sequelize';

export class ProfessorService {
  
  // Obtener materias asignadas a un profesor
  async getProfessorSubjects(professorId: number) {
    try {
      const subjects = await ProfesorMateria.findAll({
        where: { usuario_id: professorId }
      });

      // Fetch materia details separately
      const materiaDetails = await Promise.all(
        subjects.map(async (pm) => {
          const materia = await Materia.findByPk(pm.materia_id, {
            attributes: ['id', 'nombre']
          });
          return {
            id: pm.materia_id,
            nombre: materia?.nombre || 'Sin nombre'
          };
        })
      );

      return materiaDetails;
    } catch (error) {
      throw new Error(`Error al obtener materias del profesor: ${error}`);
    }
  }

  // Obtener clases de un profesor (CursoDivisionMateria)
  async getProfessorClasses(professorId: number) {
    try {
      const professorSubjects = await this.getProfessorSubjects(professorId);
      const subjectIds = professorSubjects.map(s => s.id);

      // First get the CursoDivisionMateria records
      const classes = await CursoDivisionMateria.findAll({
        where: { materia_id: { [Op.in]: subjectIds } }
      });

      // Then fetch related data separately to avoid nested association issues
      const classesWithDetails = await Promise.all(classes.map(async (c) => {
        const materia = await Materia.findByPk(c.materia_id, {
          attributes: ['id', 'nombre']
        });

        const cursoDivision = await CursoDivision.findByPk(c.curso_division_id, {
          attributes: ['id', 'curso_id', 'division_id']
        });

        let curso = null;
        let division = null;

        if (cursoDivision) {
          curso = await Curso.findByPk(cursoDivision.curso_id, {
            attributes: ['id', 'año']
          });
          division = await Division.findByPk(cursoDivision.division_id, {
            attributes: ['id', 'division']
          });
        }

        return {
          id: c.id,
          materia: {
            id: materia?.id,
            nombre: materia?.nombre || 'Sin materia'
          },
          curso: {
            id: curso?.id,
            nombre: `${curso?.año}° Año` || 'Sin curso',
            nivel: curso?.año?.toString() || ''
          },
          division: {
            id: division?.id,
            nombre: division?.division || 'Sin división'
          }
        };
      }));

      return classesWithDetails;
    } catch (error) {
      throw new Error(`Error al obtener clases del profesor: ${error}`);
    }
  }

  // Obtener estudiantes de una clase específica
  async getClassStudents(cursoDivisionMateriaId: number) {
    try {
      // First get the curso_division_id from the cursoDivisionMateria
      const cursoDivisionMateria = await CursoDivisionMateria.findByPk(cursoDivisionMateriaId);

      if (!cursoDivisionMateria) {
        throw new Error('Clase no encontrada');
      }

      // Use raw SQL to get students to avoid complex association issues
      const [students] = await sequelize.query(`
        SELECT DISTINCT 
          u.id, 
          u.nombre, 
          u.apellido, 
          u.email, 
          u.dni as numero_documento
        FROM usuario u
        JOIN usuario_curso uc ON u.id = uc.usuario_id
        JOIN usuario_rol ur ON u.id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.id
        WHERE uc.curso_division_id = ?
        AND r.nombre = 'alumno'
        ORDER BY u.apellido, u.nombre
      `, { replacements: [cursoDivisionMateria.curso_division_id] });

      return students.map((student: any) => ({
        id: student.id,
        nombre: student.nombre,
        apellido: student.apellido,
        email: student.email,
        numero_documento: student.numero_documento
      }));
    } catch (error) {
      throw new Error(`Error al obtener estudiantes de la clase: ${error}`);
    }
  }

  // Obtener todos los estudiantes de un profesor (de todas sus clases)
  async getAllProfessorStudents(professorId: number) {
    try {
      const classes = await this.getProfessorClasses(professorId);
      const allStudents: any[] = [];
      const studentData: { [key: number]: any } = {};

      // Get students from all classes, avoiding duplicates
      for (const classe of classes) {
        const classStudents = await this.getClassStudents(classe.id);
        
        for (const student of classStudents) {
          if (!studentData[student.id]) {
            studentData[student.id] = {
              id: student.id,
              nombre: student.nombre,
              apellido: student.apellido,
              email: student.email,
              numero_documento: student.numero_documento,
              promedio: 0,
              clases: []
            };
          }
          
          // Add class to student's class list
          const className = `${classe.materia.nombre} - ${classe.curso.nombre} ${classe.division.nombre}`;
          if (!studentData[student.id].clases.includes(className)) {
            studentData[student.id].clases.push(className);
          }
        }
      }

      // Calculate average grades for each student
      for (const studentId in studentData) {
        const averageGrade = await this.getStudentAverageGrade(parseInt(studentId), professorId);
        studentData[studentId].promedio = averageGrade;
        allStudents.push(studentData[studentId]);
      }

      return allStudents;
    } catch (error) {
      throw new Error(`Error al obtener estudiantes del profesor: ${error}`);
    }
  }

  // Obtener promedio de un estudiante con un profesor específico
  async getStudentAverageGrade(studentId: number, professorId: number) {
    try {
      const grades = await Calificacion.findAll({
        where: {
          usuario_id: studentId,
          profesor_usuario_id: professorId
        }
      });

      if (grades.length === 0) {
        return 0;
      }

      const sum = grades.reduce((acc, grade) => {
        const percentage = (grade.calificacion / grade.calificacion_maxima) * 10;
        return acc + percentage;
      }, 0);

      return sum / grades.length;
    } catch (error) {
      console.error('Error calculating student average:', error);
      return 0;
    }
  }

  // Justificar falta (único cambio manual permitido)
  async justifyAbsence(data: {
    professorId: number;
    asistenciaId: number;
    observaciones: string;
  }) {
    try {
      const asistencia = await Asistencia.findByPk(data.asistenciaId);
      
      if (!asistencia) {
        throw new Error('Registro de asistencia no encontrado');
      }

      // Solo se puede justificar si era ausente
      if (asistencia.estado !== 'ausente') {
        throw new Error('Solo se pueden justificar ausencias');
      }

      const updated = await asistencia.update({
        estado: 'justificado',
        observaciones: data.observaciones,
        calculado_automaticamente: false
      });

      return updated;
    } catch (error) {
      throw new Error(`Error al justificar falta: ${error}`);
    }
  }

  // Obtener asistencia de una clase en una fecha específica
  async getClassAttendance(cursoDivisionMateriaId: number, fecha: string) {
    try {
      // Use raw SQL to avoid complex association issues
            const [attendance] = await sequelize.query(`
        SELECT 
          a.id,
          a.estado,
          a.observaciones,
          a.fecha,
          a.hora_entrada as horaEntrada,
          a.hora_salida as horaSalida,
          a.hora_entrada_almuerzo as horaEntradaAlmuerzo,
          a.hora_salida_almuerzo as horaSalidaAlmuerzo,
          a.calculado_automaticamente as calculadoAutomaticamente,
          u.id as estudiante_id,
          u.nombre as estudiante_nombre,
          u.apellido as estudiante_apellido,
          u.dni as estudiante_numero_documento
        FROM asistencia a
        JOIN usuario u ON a.usuario_id = u.id
        WHERE a.curso_division_materia_id = ?
        AND DATE(a.fecha) = ?
        ORDER BY u.apellido, u.nombre
      `, { replacements: [cursoDivisionMateriaId, fecha] });

      return (attendance as any[]).map(a => ({
        id: a.id,
        estudiante: {
          id: a.estudiante_id,
          nombre: a.estudiante_nombre,
          apellido: a.estudiante_apellido,
          numero_documento: a.estudiante_numero_documento
        },
        estado: a.estado,
        observaciones: a.observaciones,
        fecha: a.fecha,
        horaEntrada: a.horaEntrada,
        horaSalida: a.horaSalida,
        horaEntradaAlmuerzo: a.horaEntradaAlmuerzo,
        horaSalidaAlmuerzo: a.horaSalidaAlmuerzo,
        calculadoAutomaticamente: a.calculadoAutomaticamente
      }));
    } catch (error) {
      console.error('Error getting class attendance:', error);
      throw new Error(`Error al obtener asistencia: ${error}`);
    }
  }

  // Registrar calificación
  async recordGrade(data: {
    professorId: number;
    usuarioId: number;
    cursoDivisionMateriaId: number;
    tipoEvaluacion: 'examen' | 'tarea' | 'proyecto' | 'participacion' | 'quiz' | 'exposicion';
    descripcion: string;
    calificacion: number;
    calificacionMaxima: number;
    fechaEvaluacion: string;
    fechaEntrega?: string;
    observaciones?: string;
    trimestre: number;
  }) {
    try {
      const calificacion = await Calificacion.create({
        usuario_id: data.usuarioId,
        curso_division_materia_id: data.cursoDivisionMateriaId,
        tipo_evaluacion: data.tipoEvaluacion,
        descripcion: data.descripcion,
        calificacion: data.calificacion,
        calificacion_maxima: data.calificacionMaxima,
        fecha_evaluacion: data.fechaEvaluacion,
        fecha_entrega: data.fechaEntrega,
        observaciones: data.observaciones,
        profesor_usuario_id: data.professorId,
        trimestre: data.trimestre
      });

      return calificacion;
    } catch (error) {
      throw new Error(`Error al registrar calificación: ${error}`);
    }
  }

  // Obtener calificaciones de una clase
  async getClassGrades(cursoDivisionMateriaId: number, trimestre?: number) {
    try {
      // Use raw SQL to avoid complex association issues
            
      let query = `
        SELECT 
          c.id,
          c.tipo_evaluacion as tipoEvaluacion,
          c.descripcion,
          c.calificacion,
          c.calificacion_maxima as calificacionMaxima,
          c.fecha_evaluacion as fechaEvaluacion,
          c.fecha_entrega as fechaEntrega,
          c.observaciones,
          c.trimestre,
          u.id as estudiante_id,
          u.nombre as estudiante_nombre,
          u.apellido as estudiante_apellido,
          u.dni as estudiante_numero_documento
        FROM calificacion c
        JOIN usuario u ON c.usuario_id = u.id
        WHERE c.curso_division_materia_id = ?
      `;
      
      const replacements: any[] = [cursoDivisionMateriaId];
      
      if (trimestre) {
        query += ' AND c.trimestre = ?';
        replacements.push(trimestre);
      }
      
      query += ' ORDER BY c.fecha_evaluacion DESC';

      const [grades] = await sequelize.query(query, { replacements });

      return (grades as any[]).map(g => ({
        id: g.id,
        estudiante: {
          id: g.estudiante_id,
          nombre: g.estudiante_nombre,
          apellido: g.estudiante_apellido,
          numero_documento: g.estudiante_numero_documento
        },
        tipoEvaluacion: g.tipoEvaluacion,
        descripcion: g.descripcion,
        calificacion: g.calificacion,
        calificacionMaxima: g.calificacionMaxima,
        fechaEvaluacion: g.fechaEvaluacion,
        fechaEntrega: g.fechaEntrega,
        observaciones: g.observaciones,
        trimestre: g.trimestre
      }));
    } catch (error) {
      console.error('Error getting class grades:', error);
      throw new Error(`Error al obtener calificaciones: ${error}`);
    }
  }

  // Obtener horario del profesor
  async getProfessorSchedule(professorId: number) {
    try {
      // Use raw SQL to avoid complex association issues
            const [schedule] = await sequelize.query(`
        SELECT 
          h.id,
          h.dia as diaSemana,
          h.hora_inicio as horaInicio,
          h.hora_fin as horaFin,
          h.aula,
          m.nombre as materia,
          CONCAT(c.año, '° Año') as curso,
          d.division,
          h.curso_division_materia_id as cursoDivisionMateriaId
        FROM horario h
        JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
        JOIN materia m ON cdm.materia_id = m.id
        JOIN curso_division cd ON cdm.curso_division_id = cd.id
        JOIN curso c ON cd.curso_id = c.id
        JOIN division d ON cd.division_id = d.id
        WHERE h.profesor_usuario_id = ?
        ORDER BY h.dia ASC, h.hora_inicio ASC
      `, { replacements: [professorId] });

      return (schedule as any[]).map(h => ({
        id: h.id,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        aula: h.aula || 'Sin asignar',
        materia: h.materia || 'Sin materia',
        curso: h.curso || 'Sin curso',
        division: h.division || 'Sin división',
        cursoDivisionMateriaId: h.cursoDivisionMateriaId
      }));
    } catch (error) {
      console.error('Error getting professor schedule:', error);
      throw new Error(`Error al obtener horario del profesor: ${error}`);
    }
  }

  // Obtener estadísticas del profesor para el dashboard
  async getProfessorDashboardStats(professorId: number) {
    try {
      const classes = await this.getProfessorClasses(professorId);
      const subjects = await this.getProfessorSubjects(professorId);

      // Contar estudiantes totales
      let totalStudents = 0;
      for (const classe of classes) {
        const students = await this.getClassStudents(classe.id);
        totalStudents += students.length;
      }

      // Get course division materia IDs for this professor
      const classIds = classes.map(c => c.id);
      
      // Obtener asistencias de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = await Asistencia.count({
        where: {
          curso_division_materia_id: { [Op.in]: classIds },
          fecha: today
        }
      });

      // Obtener calificaciones recientes (últimos 7 días)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentGrades = await Calificacion.count({
        where: {
          profesor_usuario_id: professorId,
          created_at: {
            [Op.gte]: weekAgo
          }
        }
      });

      return {
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        totalStudents: totalStudents,
        todayAttendanceRecords: todayAttendance,
        recentGrades: recentGrades
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del dashboard: ${error}`);
    }
  }

  // Obtener reporte de asistencia por estudiante y materia
  async getAttendanceReport(cursoDivisionMateriaId: number, fechaInicio: string, fechaFin: string) {
    try {
      // Use raw SQL to avoid complex association issues
            const [attendance] = await sequelize.query(`
        SELECT 
          a.usuario_id,
          a.estado,
          u.id as estudiante_id,
          u.nombre as estudiante_nombre,
          u.apellido as estudiante_apellido,
          u.dni as estudiante_numero_documento
        FROM asistencia a
        JOIN usuario u ON a.usuario_id = u.id
        WHERE a.curso_division_materia_id = ?
        AND DATE(a.fecha) BETWEEN ? AND ?
        ORDER BY a.fecha ASC
      `, { replacements: [cursoDivisionMateriaId, fechaInicio, fechaFin] });

      // Agrupar por estudiante
      const reportByStudent: { [key: number]: any } = {};

      (attendance as any[]).forEach(a => {
        const studentId = a.usuario_id;
        if (!reportByStudent[studentId]) {
          reportByStudent[studentId] = {
            estudiante: {
              id: a.estudiante_id,
              nombre: a.estudiante_nombre,
              apellido: a.estudiante_apellido,
              numero_documento: a.estudiante_numero_documento
            },
            presente: 0,
            ausente: 0,
            tardanza: 0,
            justificado: 0,
            total: 0
          };
        }

        if (reportByStudent[studentId][a.estado] !== undefined) {
          reportByStudent[studentId][a.estado]++;
        }
        reportByStudent[studentId].total++;
      });

      return Object.values(reportByStudent);
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw new Error(`Error al generar reporte de asistencia: ${error}`);
    }
  }

  // Obtener reporte de calificaciones por estudiante y materia
  async getGradesReport(cursoDivisionMateriaId: number, trimestre?: number) {
    try {
      // Use raw SQL to avoid complex association issues
            
      let query = `
        SELECT 
          c.id,
          c.usuario_id,
          c.tipo_evaluacion as tipoEvaluacion,
          c.descripcion,
          c.calificacion,
          c.calificacion_maxima as calificacionMaxima,
          c.fecha_evaluacion as fechaEvaluacion,
          c.trimestre,
          u.id as estudiante_id,
          u.nombre as estudiante_nombre,
          u.apellido as estudiante_apellido,
          u.dni as estudiante_numero_documento
        FROM calificacion c
        JOIN usuario u ON c.usuario_id = u.id
        WHERE c.curso_division_materia_id = ?
      `;
      
      const replacements: any[] = [cursoDivisionMateriaId];
      
      if (trimestre) {
        query += ' AND c.trimestre = ?';
        replacements.push(trimestre);
      }
      
      query += ' ORDER BY c.usuario_id ASC, c.fecha_evaluacion ASC';

      const [grades] = await sequelize.query(query, { replacements });

      // Agrupar por estudiante
      const reportByStudent: { [key: number]: any } = {};

      (grades as any[]).forEach(g => {
        const studentId = g.usuario_id;
        if (!reportByStudent[studentId]) {
          reportByStudent[studentId] = {
            estudiante: {
              id: g.estudiante_id,
              nombre: g.estudiante_nombre,
              apellido: g.estudiante_apellido,
              numero_documento: g.estudiante_numero_documento
            },
            calificaciones: [],
            promedio: 0
          };
        }

        reportByStudent[studentId].calificaciones.push({
          id: g.id,
          tipoEvaluacion: g.tipoEvaluacion,
          descripcion: g.descripcion,
          calificacion: g.calificacion,
          calificacionMaxima: g.calificacionMaxima,
          porcentaje: (g.calificacion / g.calificacionMaxima) * 100,
          fechaEvaluacion: g.fechaEvaluacion,
          trimestre: g.trimestre
        });
      });

      // Calcular promedios
      Object.values(reportByStudent).forEach((student: any) => {
        if (student.calificaciones.length > 0) {
          const sum = student.calificaciones.reduce((acc: number, cal: any) => acc + cal.porcentaje, 0);
          student.promedio = sum / student.calificaciones.length;
        }
      });

      return Object.values(reportByStudent);
    } catch (error) {
      console.error('Error generating grades report:', error);
      throw new Error(`Error al generar reporte de calificaciones: ${error}`);
    }
  }

  // Actualizar calificación
  async updateGrade(professorId: number, gradeId: number, updates: any) {
    try {
      const grade = await Calificacion.findByPk(gradeId);
      
      if (!grade) {
        throw new Error('Calificación no encontrada');
      }

      // Verificar que el profesor puede actualizar esta calificación
      if (grade.profesor_usuario_id !== professorId) {
        throw new Error('No tiene permisos para actualizar esta calificación');
      }

      const updatedGrade = await grade.update(updates);
      return updatedGrade;
    } catch (error) {
      throw new Error(`Error al actualizar calificación: ${error}`);
    }
  }

  // Eliminar calificación
  async deleteGrade(professorId: number, gradeId: number) {
    try {
      const grade = await Calificacion.findByPk(gradeId);
      
      if (!grade) {
        throw new Error('Calificación no encontrada');
      }

      // Verificar que el profesor puede eliminar esta calificación
      if (grade.profesor_usuario_id !== professorId) {
        throw new Error('No tiene permisos para eliminar esta calificación');
      }

      await grade.destroy();
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar calificación: ${error}`);
    }
  }
}