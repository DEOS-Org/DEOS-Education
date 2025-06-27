import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface MensajeEstadoAttributes {
  id: number;
  mensaje_id: number;
  usuario_id: number;
  entregado: boolean;
  fecha_entrega?: Date;
  leido: boolean;
  fecha_lectura?: Date;
  fecha_creacion: Date;
}

interface MensajeEstadoCreationAttributes extends Optional<MensajeEstadoAttributes, 'id' | 'fecha_creacion'> {}

export interface MensajeEstadoInstance extends Model<MensajeEstadoAttributes, MensajeEstadoCreationAttributes>, MensajeEstadoAttributes {}

const MensajeEstado = sequelize.define<MensajeEstadoInstance>(
  'MensajeEstado',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    mensaje_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'mensaje',
        key: 'id',
      },
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    entregado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_entrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_lectura: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'mensaje_estado',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['mensaje_id', 'usuario_id'],
      },
      {
        fields: ['usuario_id'],
      },
      {
        fields: ['leido'],
      },
      {
        fields: ['entregado'],
      },
    ],
  }
);

export default MensajeEstado;