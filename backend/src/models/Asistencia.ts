import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface AsistenciaAttributes {
  id?: number;
  usuario_id: number;
  curso_division_materia_id: number;
  fecha: Date;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  observaciones?: string;
  hora_entrada?: string;
  hora_salida?: string;
  hora_entrada_almuerzo?: string;
  hora_salida_almuerzo?: string;
  calculado_automaticamente: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AsistenciaInstance extends Model<AsistenciaAttributes>, AsistenciaAttributes {}

const Asistencia = sequelize.define<AsistenciaInstance>('Asistencia', {
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
  fecha: { 
    type: DataTypes.DATEONLY, 
    allowNull: false,
    comment: 'Fecha de la clase'
  },
  estado: { 
    type: DataTypes.ENUM('presente', 'ausente', 'tardanza', 'justificado'), 
    allowNull: false,
    defaultValue: 'presente'
  },
  observaciones: { 
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales sobre la asistencia'
  },
  hora_entrada: { 
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de entrada a la escuela'
  },
  hora_salida: { 
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de salida de la escuela'
  },
  hora_entrada_almuerzo: { 
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de salida para almuerzo'
  },
  hora_salida_almuerzo: { 
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de regreso del almuerzo'
  },
  calculado_automaticamente: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false,
    defaultValue: true,
    comment: 'Si la asistencia fue calculada automáticamente o manual'
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
  tableName: 'asistencia',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['usuario_id', 'curso_division_materia_id', 'fecha']
    },
    {
      fields: ['fecha']
    },
    {
      fields: ['calculado_automaticamente']
    }
  ]
});

export default Asistencia;