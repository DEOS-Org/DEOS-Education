import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface SancionAttributes {
  id: number;
  usuario_id: number;
  tipo: 'amonestacion' | 'suspension' | 'expulsion' | 'advertencia' | 'citacion_padres';
  motivo: string;
  descripcion: string;
  gravedad: 'leve' | 'moderada' | 'grave' | 'muy_grave';
  estado: 'activa' | 'cumplida' | 'anulada' | 'en_proceso';
  fecha_sancion: Date;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  dias_suspension?: number;
  usuario_sancionador_id: number;
  curso_division_id?: number;
  observaciones?: string;
  padres_notificados: boolean;
  fecha_notificacion_padres?: Date;
  archivo_adjunto?: string;
  medidas_pedagogicas?: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

interface SancionCreationAttributes extends Optional<SancionAttributes, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

export interface SancionInstance extends Model<SancionAttributes, SancionCreationAttributes>, SancionAttributes {}

const Sancion = sequelize.define<SancionInstance>(
  'Sancion',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    tipo: {
      type: DataTypes.ENUM('amonestacion', 'suspension', 'expulsion', 'advertencia', 'citacion_padres'),
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    gravedad: {
      type: DataTypes.ENUM('leve', 'moderada', 'grave', 'muy_grave'),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('activa', 'cumplida', 'anulada', 'en_proceso'),
      allowNull: false,
      defaultValue: 'activa',
    },
    fecha_sancion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dias_suspension: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usuario_sancionador_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    curso_division_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'curso_division',
        key: 'id',
      },
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    padres_notificados: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_notificacion_padres: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    archivo_adjunto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    medidas_pedagogicas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'sancion',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
      {
        fields: ['usuario_id'],
      },
      {
        fields: ['tipo'],
      },
      {
        fields: ['estado'],
      },
      {
        fields: ['gravedad'],
      },
      {
        fields: ['fecha_sancion'],
      },
      {
        fields: ['usuario_sancionador_id'],
      },
      {
        fields: ['curso_division_id'],
      },
    ],
  }
);

export default Sancion;