import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface CalificacionAttributes {
  id?: number;
  usuario_id: number;
  curso_division_materia_id: number;
  tipo_evaluacion: 'examen' | 'tarea' | 'proyecto' | 'participacion' | 'quiz' | 'exposicion';
  descripcion: string;
  calificacion: number;
  calificacion_maxima: number;
  fecha_evaluacion: Date;
  fecha_entrega?: Date;
  observaciones?: string;
  profesor_usuario_id: number;
  trimestre: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CalificacionInstance extends Model<CalificacionAttributes>, CalificacionAttributes {}

const Calificacion = sequelize.define<CalificacionInstance>('Calificacion', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  usuario_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'ID del estudiante'
  },
  curso_division_materia_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'ID de la materia en el curso/división'
  },
  tipo_evaluacion: { 
    type: DataTypes.ENUM('examen', 'tarea', 'proyecto', 'participacion', 'quiz', 'exposicion'), 
    allowNull: false,
    comment: 'Tipo de evaluación'
  },
  descripcion: { 
    type: DataTypes.STRING(255), 
    allowNull: false,
    comment: 'Descripción de la evaluación'
  },
  calificacion: { 
    type: DataTypes.DECIMAL(5, 2), 
    allowNull: false,
    comment: 'Calificación obtenida'
  },
  calificacion_maxima: { 
    type: DataTypes.DECIMAL(5, 2), 
    allowNull: false,
    defaultValue: 10.00,
    comment: 'Calificación máxima posible'
  },
  fecha_evaluacion: { 
    type: DataTypes.DATEONLY, 
    allowNull: false,
    comment: 'Fecha de la evaluación'
  },
  fecha_entrega: { 
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de entrega (para tareas/proyectos)'
  },
  observaciones: { 
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales'
  },
  profesor_usuario_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'ID del profesor que califica'
  },
  trimestre: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: {
      min: 1,
      max: 3
    },
    comment: 'Trimestre académico (1, 2, 3)'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'calificacion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['curso_division_materia_id']
    },
    {
      fields: ['profesor_usuario_id']
    },
    {
      fields: ['fecha_evaluacion']
    },
    {
      fields: ['trimestre']
    }
  ]
});

export default Calificacion;