import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface DispositivoFichajeAttributes {
  id?: number;
  identificador_unico: string;
  descripcion?: string;
  ubicacion?: string;
  activo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface DispositivoFichajeInstance extends Model<DispositivoFichajeAttributes>, DispositivoFichajeAttributes {}

const DispositivoFichaje = sequelize.define<DispositivoFichajeInstance>('DispositivoFichaje', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  identificador_unico: { 
    type: DataTypes.STRING(100), 
    allowNull: false, 
    unique: true,
    comment: 'Ej: ESP32_PUERTA_PRINCIPAL'
  },
  descripcion: { 
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ubicacion: { 
    type: DataTypes.STRING(100),
    allowNull: true
  },
  activo: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, {
  tableName: 'dispositivo_fichaje',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default DispositivoFichaje;