import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface ComunicadoLecturaAttributes {
  id: number;
  comunicado_id: number;
  usuario_id: number;
  fecha_lectura: Date;
  fecha_creacion: Date;
}

interface ComunicadoLecturaCreationAttributes extends Optional<ComunicadoLecturaAttributes, 'id' | 'fecha_creacion'> {}

export interface ComunicadoLecturaInstance extends Model<ComunicadoLecturaAttributes, ComunicadoLecturaCreationAttributes>, ComunicadoLecturaAttributes {}

const ComunicadoLectura = sequelize.define<ComunicadoLecturaInstance>(
  'ComunicadoLectura',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    comunicado_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'comunicado',
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
    fecha_lectura: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'comunicado_lectura',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['comunicado_id', 'usuario_id'],
      },
      {
        fields: ['usuario_id'],
      },
      {
        fields: ['fecha_lectura'],
      },
    ],
  }
);

export default ComunicadoLectura;