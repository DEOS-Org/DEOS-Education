import { Request, Response } from 'express';
import { DataTypes, Op, QueryTypes } from 'sequelize';
import { sequelize } from '../models';
import { asyncHandler } from '../middlewares/asyncHandler';

// Definir modelos para las notas
const TipoEvaluacion = sequelize.define('TipoEvaluacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  peso_porcentual: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 100.00
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tipo_evaluacion',
  timestamps: false
});

const Nota = sequelize.define('Nota', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alumno_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  materia_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_evaluacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TipoEvaluacion,
      key: 'id'
    }
  },
  calificacion: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  fecha_evaluacion: {
    type: DataTypes.DATE,
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trimestre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 3
    }
  },
  periodo_lectivo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'nota',
  timestamps: false
});

const PromedioAlumno = sequelize.define('PromedioAlumno', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alumno_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  materia_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trimestre: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  periodo_lectivo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  promedio_trimestral: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  promedio_anual: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('APROBADO', 'DESAPROBADO', 'PENDIENTE'),
    defaultValue: 'PENDIENTE'
  },
  fecha_calculo: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'promedio_alumno',
  timestamps: false
});

// Definir asociaciones
TipoEvaluacion.hasMany(Nota, { foreignKey: 'tipo_evaluacion_id' });
Nota.belongsTo(TipoEvaluacion, { foreignKey: 'tipo_evaluacion_id' });

// CONTROLADORES

// Obtener todas las notas de un alumno
export const getNotasAlumno = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { alumnoId } = req.params;
    const { materiaId, trimestre, periodoLectivo } = req.query;
    
    let whereCondition: any = {
      alumno_usuario_id: alumnoId,
      activa: true
    };
    
    if (materiaId) whereCondition.materia_id = materiaId;
    if (trimestre) whereCondition.trimestre = trimestre;
    if (periodoLectivo) whereCondition.periodo_lectivo = periodoLectivo;
    
    const query = `
      SELECT * FROM vista_notas_completa 
      WHERE alumno_id = ? 
      ${materiaId ? 'AND materia_id = ?' : ''}
      ${trimestre ? 'AND trimestre = ?' : ''}
      ${periodoLectivo ? 'AND periodo_lectivo = ?' : ''}
      ORDER BY fecha_evaluacion DESC
    `;
    
    const replacements = [alumnoId];
    if (materiaId) replacements.push(materiaId as string);
    if (trimestre) replacements.push(trimestre as string);
    if (periodoLectivo) replacements.push(periodoLectivo as string);

    const notas = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: notas
    });
  } catch (error: any) {
    console.error('Error al obtener notas del alumno:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener notas de todos los hijos de un padre
export const getNotasHijos = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { padreId } = req.params;
    const { periodoLectivo } = req.query;
    
    const query = `
      SELECT 
        vnc.*,
        u.nombre as alumno_nombre,
        u.apellido as alumno_apellido
      FROM vista_notas_completa vnc
      JOIN usuario u ON vnc.alumno_id = u.id
      JOIN usuario_familia uf ON u.id = uf.alumno_usuario_id
      WHERE uf.tutor_usuario_id = ? 
      ${periodoLectivo ? 'AND vnc.periodo_lectivo = ?' : ''}
      ORDER BY u.apellido, u.nombre, vnc.fecha_evaluacion DESC
    `;
    
    const replacements = [padreId];
    if (periodoLectivo) replacements.push(periodoLectivo as string);

    const notas = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    if (notas.length > 0) {
      const notasPorHijo = (notas as any[]).reduce((acc: any, nota: any) => {
        if (!acc[nota.alumno_id]) {
          acc[nota.alumno_id] = {
            alumno_id: nota.alumno_id,
            alumno_nombre: nota.alumno_nombre,
            alumno_apellido: nota.alumno_apellido,
            notas: []
          };
        }
        acc[nota.alumno_id].notas.push(nota);
        return acc;
      }, {});

      const hijosConNotas = Object.values(notasPorHijo);

      res.json({
        success: true,
        data: hijosConNotas
      });
    } else {
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error: any) {
    console.error('Error al obtener notas de los hijos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener promedios de un alumno
export const getPromediosAlumno = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { alumnoId } = req.params;
    const { periodoLectivo } = req.query;
    
    let whereCondition: any = {
      alumno_usuario_id: alumnoId
    };
    
    if (periodoLectivo) whereCondition.periodo_lectivo = periodoLectivo;
    
    const promedios = await PromedioAlumno.findAll({
      where: whereCondition,
      include: [
        {
          association: 'materia', // Asumir que existe esta asociación
          attributes: ['nombre']
        }
      ],
      order: [['trimestre', 'ASC']]
    });

    res.json({
      success: true,
      data: promedios
    });
  } catch (error: any) {
    console.error('Error al obtener promedios del alumno:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Crear una nueva nota
export const crearNota = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      alumno_usuario_id,
      materia_id,
      tipo_evaluacion_id,
      calificacion,
      fecha_evaluacion,
      observaciones,
      trimestre,
      periodo_lectivo
    } = req.body;

    // Validar que la calificación esté en el rango correcto
    if (calificacion < 1 || calificacion > 10) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 10'
      });
    }

    const insertQuery = `
      INSERT INTO nota (
        alumno_usuario_id, materia_id, tipo_evaluacion_id, 
        calificacion, fecha_evaluacion, observaciones, 
        trimestre, periodo_lectivo, activa, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW())
    `;

    const resultado = await sequelize.query(insertQuery, {
      replacements: [alumno_usuario_id, materia_id, tipo_evaluacion_id, calificacion, fecha_evaluacion, observaciones, trimestre, periodo_lectivo],
      type: QueryTypes.INSERT
    });

    if ((resultado as any)[1] === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo crear la nota'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Nota creada exitosamente',
      data: { id: (resultado as any)[0] }
    });

  } catch (error: any) {
    console.error('Error al crear nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Actualizar una nota existente
export const actualizarNota = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { notaId } = req.params;
    const {
      tipo_evaluacion_id,
      calificacion,
      fecha_evaluacion,
      observaciones,
      trimestre,
      periodo_lectivo
    } = req.body;

    // Validar que la calificación esté en el rango correcto
    if (calificacion < 1 || calificacion > 10) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 10'
      });
    }

    const updateQuery = `
      UPDATE nota 
      SET tipo_evaluacion_id = ?, calificacion = ?, fecha_evaluacion = ?, 
          observaciones = ?, trimestre = ?, periodo_lectivo = ?
      WHERE id = ? AND activa = true
    `;

    const resultado = await sequelize.query(updateQuery, {
      replacements: [tipo_evaluacion_id, calificacion, fecha_evaluacion, observaciones, trimestre, periodo_lectivo, notaId],
      type: QueryTypes.UPDATE
    });

    if ((resultado as any)[1] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nota no encontrada o ya fue eliminada'
      });
    }

    res.json({
      success: true,
      message: 'Nota actualizada exitosamente'
    });

  } catch (error: any) {
    console.error('Error al actualizar nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Eliminar una nota (marcar como inactiva)
export const eliminarNota = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { notaId } = req.params;

    const updateQuery = `
      UPDATE nota 
      SET activa = false 
      WHERE id = ? AND activa = true
    `;

    const resultado = await sequelize.query(updateQuery, {
      replacements: [notaId],
      type: QueryTypes.UPDATE
    });

    if ((resultado as any)[1] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nota no encontrada o ya fue eliminada'
      });
    }

    res.json({
      success: true,
      message: 'Nota eliminada exitosamente'
    });

  } catch (error: any) {
    console.error('Error al eliminar nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener tipos de evaluación
export const getTiposEvaluacion = asyncHandler(async (req: Request, res: Response) => {
  try {
    const tipos = await TipoEvaluacion.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: tipos
    });
  } catch (error: any) {
    console.error('Error al obtener tipos de evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Exportar el modelo TipoEvaluacion para uso en otros módulos
export { TipoEvaluacion, Nota, PromedioAlumno };