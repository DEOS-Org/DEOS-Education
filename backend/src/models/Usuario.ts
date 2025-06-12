import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface UsuarioAttributes {
  id?: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  activo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UsuarioInstance extends Model<UsuarioAttributes>, UsuarioAttributes {}

const Usuario = sequelize.define<UsuarioInstance>('Usuario', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  dni: { 
    type: DataTypes.STRING(15), 
    allowNull: false, 
    unique: true 
  },
  nombre: { 
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: { 
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: { 
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  contraseña: { 
    type: DataTypes.STRING(255),
    allowNull: false
  },
  activo: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, {
  tableName: 'usuario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Usuario; 