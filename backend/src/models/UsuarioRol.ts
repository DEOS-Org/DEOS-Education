import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface UsuarioRolAttributes {
  id?: number;
  usuario_id: number;
  rol_id: number;
}

export interface UsuarioRolInstance extends Model<UsuarioRolAttributes>, UsuarioRolAttributes {}

const UsuarioRol = sequelize.define<UsuarioRolInstance>('UsuarioRol', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  usuario_id: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    }
  },
  rol_id: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rol',
      key: 'id'
    }
  }
}, {
  tableName: 'usuario_rol',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['usuario_id', 'rol_id'],
      name: 'idx_usuario_rol_unique'
    }
  ]
});

export default UsuarioRol; 