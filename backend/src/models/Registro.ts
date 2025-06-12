import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

import { TipoRegistro } from './types';

interface RegistroAttributes {
  id: number;
  usuario_id: number;
  tipo: TipoRegistro;
  fecha: Date;
  dispositivo_fichaje_id?: number;
  origen_manual?: string;
}

interface RegistroCreationAttributes extends Optional<RegistroAttributes, 'id' | 'dispositivo_fichaje_id' | 'origen_manual'> {}

export interface RegistroInstance extends Model<RegistroAttributes, RegistroCreationAttributes>, RegistroAttributes {
  created_at?: Date;
  updated_at?: Date;
}

const Registro = sequelize.define<RegistroInstance>('Registro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('ingreso', 'egreso'),
    allowNull: false,
    comment: 'Indica si es un ingreso o salida de la escuela'
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dispositivo_fichaje_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Referencia al dispositivo que originó el registro'
  },
  origen_manual: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Para casos donde no hay dispositivo o es un registro manual'
  }
}, {
  tableName: 'registro',
  timestamps: false,
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['fecha']
    },
    {
      fields: ['dispositivo_fichaje_id']
    }
  ]
});

export default Registro;