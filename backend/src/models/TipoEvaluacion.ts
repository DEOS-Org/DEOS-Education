import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

interface TipoEvaluacionAttributes {
  id: number;
  nombre: string;
  descripcion?: string;
  peso: number;
  color?: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface TipoEvaluacionCreationAttributes extends Optional<TipoEvaluacionAttributes, 'id' | 'descripcion' | 'color' | 'activo' | 'created_at' | 'updated_at'> {}

export class TipoEvaluacion extends Model<TipoEvaluacionAttributes, TipoEvaluacionCreationAttributes> implements TipoEvaluacionAttributes {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public peso!: number;
  public color?: string;
  public activo!: boolean;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

TipoEvaluacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    peso: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.1,
        max: 10.0,
      },
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'tipo_evaluacion',
    timestamps: true,
    underscored: true,
  }
);

export default TipoEvaluacion;