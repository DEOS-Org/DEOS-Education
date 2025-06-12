import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

interface HuellaAttributes {
  id: number;
  usuario_id: number;
  sensor_id?: number;
  template: string;
  fecha_registro: Date;
}

interface HuellaCreationAttributes extends Optional<HuellaAttributes, 'id' | 'sensor_id'> {}

export interface HuellaInstance extends Model<HuellaAttributes, HuellaCreationAttributes>, HuellaAttributes {
  created_at?: Date;
  updated_at?: Date;
}

const Huella = sequelize.define<HuellaInstance>('Huella', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: 'Un usuario solo puede tener una huella registrada'
  },
  sensor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID (0-127) asignado por el sensor AS608. NO es único globalmente'
  },
  template: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Huella codificada (base64 o string binario)'
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'huella',
  timestamps: false
});

export default Huella;