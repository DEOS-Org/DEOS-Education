import { Request, Response } from 'express';
import { 
  Usuario, 
  ProfesorMateria, 
  Materia, 
  CursoDivisionMateria, 
  CursoDivision,
  Curso,
  Division,
  UsuarioCurso,
  Rol
} from '../models';
import { Op } from 'sequelize';

// Asignar materia a profesor
export const assignSubjectToProfessor = async (req: Request, res: Response) => {
  try {
    const { professorId, materiaId } = req.body;

    // Verificar que el usuario sea profesor
    const professor = await Usuario.findByPk(professorId, {
      include: [{
        model: Rol,
        where: { nombre: 'profesor' },
        through: { attributes: [] }
      }]
    });

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
    }

    // Verificar que la materia existe
    const materia = await Materia.findByPk(materiaId);
    if (!materia) {
      return res.status(404).json({
        success: false,
        message: 'Materia no encontrada'
      });
    }

    // Verificar si ya existe la asignación
    const existingAssignment = await ProfesorMateria.findOne({
      where: { usuario_id: professorId, materia_id: materiaId }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'El profesor ya tiene asignada esta materia'
      });
    }

    // Crear la asignación
    const assignment = await ProfesorMateria.create({
      usuario_id: professorId,
      materia_id: materiaId
    });

    res.json({
      success: true,
      message: 'Materia asignada al profesor correctamente',
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning subject to professor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Remover asignación de materia a profesor
export const removeSubjectFromProfessor = async (req: Request, res: Response) => {
  try {
    const { professorId, materiaId } = req.params;

    const assignment = await ProfesorMateria.findOne({
      where: { usuario_id: professorId, materia_id: materiaId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    await assignment.destroy();

    res.json({
      success: true,
      message: 'Asignación removida correctamente'
    });
  } catch (error) {
    console.error('Error removing subject from professor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener asignaciones de un profesor
export const getProfessorAssignments = async (req: Request, res: Response) => {
  try {
    const { professorId } = req.params;

    const assignments = await ProfesorMateria.findAll({
      where: { usuario_id: professorId }
    });

    // Obtener detalles de las materias
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const materia = await Materia.findByPk(assignment.materia_id);
        return {
          id: assignment.id,
          materia_id: assignment.materia_id,
          materia: {
            id: materia?.id,
            nombre: materia?.nombre,
            codigo: materia?.codigo,
            creditos: materia?.creditos
          }
        };
      })
    );

    res.json({
      success: true,
      data: assignmentsWithDetails
    });
  } catch (error) {
    console.error('Error getting professor assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Asignar profesor a clase específica (CursoDivisionMateria)
export const assignProfessorToClass = async (req: Request, res: Response) => {
  try {
    const { professorId, cursoDivisionMateriaId } = req.body;

    // Verificar que la clase existe
    const clase = await CursoDivisionMateria.findByPk(cursoDivisionMateriaId);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    // Verificar que el profesor tiene la materia asignada
    const professorMateria = await ProfesorMateria.findOne({
      where: { 
        usuario_id: professorId, 
        materia_id: clase.materia_id 
      }
    });

    if (!professorMateria) {
      return res.status(400).json({
        success: false,
        message: 'El profesor debe tener la materia asignada primero'
      });
    }

    // Actualizar la clase para asignar el profesor
    await clase.update({ profesor_usuario_id: professorId });

    res.json({
      success: true,
      message: 'Profesor asignado a la clase correctamente',
      data: clase
    });
  } catch (error) {
    console.error('Error assigning professor to class:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Remover profesor de clase
export const removeProfessorFromClass = async (req: Request, res: Response) => {
  try {
    const { cursoDivisionMateriaId } = req.params;

    const clase = await CursoDivisionMateria.findByPk(cursoDivisionMateriaId);
    if (!clase) {
      return res.status(404).json({
        success: false,
        message: 'Clase no encontrada'
      });
    }

    await clase.update({ profesor_usuario_id: null });

    res.json({
      success: true,
      message: 'Profesor removido de la clase correctamente'
    });
  } catch (error) {
    console.error('Error removing professor from class:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Asignar estudiante a curso/división
export const assignStudentToCourse = async (req: Request, res: Response) => {
  try {
    const { studentId, cursoDivisionId } = req.body;

    // Verificar que el usuario es estudiante
    const student = await Usuario.findByPk(studentId, {
      include: [{
        model: Rol,
        where: { nombre: 'estudiante' },
        through: { attributes: [] }
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Verificar que el curso/división existe
    const cursoDivision = await CursoDivision.findByPk(cursoDivisionId);
    if (!cursoDivision) {
      return res.status(404).json({
        success: false,
        message: 'Curso/División no encontrado'
      });
    }

    // Verificar si ya está asignado
    const existingAssignment = await UsuarioCurso.findOne({
      where: { usuario_id: studentId, curso_division_id: cursoDivisionId }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'El estudiante ya está asignado a este curso'
      });
    }

    // Crear la asignación
    const assignment = await UsuarioCurso.create({
      usuario_id: studentId,
      curso_division_id: cursoDivisionId
    });

    res.json({
      success: true,
      message: 'Estudiante asignado al curso correctamente',
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning student to course:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Remover estudiante de curso
export const removeStudentFromCourse = async (req: Request, res: Response) => {
  try {
    const { studentId, cursoDivisionId } = req.params;

    const assignment = await UsuarioCurso.findOne({
      where: { usuario_id: studentId, curso_division_id: cursoDivisionId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    await assignment.destroy();

    res.json({
      success: true,
      message: 'Estudiante removido del curso correctamente'
    });
  } catch (error) {
    console.error('Error removing student from course:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los profesores
export const getAllProfessors = async (req: Request, res: Response) => {
  try {
    const professors = await Usuario.findAll({
      include: [{
        model: Rol,
        where: { nombre: 'profesor' },
        through: { attributes: [] }
      }],
      attributes: ['id', 'nombre', 'apellido', 'email', 'numero_documento']
    });

    res.json({
      success: true,
      data: professors
    });
  } catch (error) {
    console.error('Error getting professors:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los estudiantes
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await Usuario.findAll({
      include: [{
        model: Rol,
        where: { nombre: 'estudiante' },
        through: { attributes: [] }
      }],
      attributes: ['id', 'nombre', 'apellido', 'email', 'numero_documento']
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todas las materias
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Materia.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre', 'codigo', 'creditos', 'descripcion']
    });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error getting subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todas las clases (CursoDivisionMateria) disponibles
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const classes = await CursoDivisionMateria.findAll();

    // Obtener detalles de cada clase
    const classesWithDetails = await Promise.all(
      classes.map(async (clase) => {
        const materia = await Materia.findByPk(clase.materia_id);
        const cursoDivision = await CursoDivision.findByPk(clase.curso_division_id);
        
        let curso = null;
        let division = null;
        let profesor = null;

        if (cursoDivision) {
          curso = await Curso.findByPk(cursoDivision.curso_id);
          division = await Division.findByPk(cursoDivision.division_id);
        }

        if (clase.profesor_usuario_id) {
          profesor = await Usuario.findByPk(clase.profesor_usuario_id, {
            attributes: ['id', 'nombre', 'apellido']
          });
        }

        return {
          id: clase.id,
          materia: {
            id: materia?.id,
            nombre: materia?.nombre,
            codigo: materia?.codigo
          },
          curso: {
            id: curso?.id,
            nombre: curso?.nombre,
            nivel: curso?.nivel
          },
          division: {
            id: division?.id,
            nombre: division?.nombre
          },
          profesor: profesor ? {
            id: profesor.id,
            nombre: profesor.nombre,
            apellido: profesor.apellido
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: classesWithDetails
    });
  } catch (error) {
    console.error('Error getting classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los cursos/divisiones
export const getAllCourseDivisions = async (req: Request, res: Response) => {
  try {
    const courseDivisions = await CursoDivision.findAll();

    const courseDivisionsWithDetails = await Promise.all(
      courseDivisions.map(async (cd) => {
        const curso = await Curso.findByPk(cd.curso_id);
        const division = await Division.findByPk(cd.division_id);

        return {
          id: cd.id,
          curso: {
            id: curso?.id,
            nombre: curso?.nombre,
            nivel: curso?.nivel
          },
          division: {
            id: division?.id,
            nombre: division?.nombre
          }
        };
      })
    );

    res.json({
      success: true,
      data: courseDivisionsWithDetails
    });
  } catch (error) {
    console.error('Error getting course divisions:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};