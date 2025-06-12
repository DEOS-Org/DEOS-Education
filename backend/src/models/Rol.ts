import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface RolAttributes {
  id?: number;
  nombre: string;
}

export interface RolInstance extends Model<RolAttributes>, RolAttributes {}

const Rol = sequelize.define<RolInstance>('Rol', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  nombre: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    unique: true 
  }
}, {
  tableName: 'rol',
  timestamps: false
});

export default Rol; 