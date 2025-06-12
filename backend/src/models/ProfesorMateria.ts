import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface ProfesorMateriaAttributes {
  id?: number;
  usuario_id: number;
  materia_id: number;
}

export interface ProfesorMateriaInstance extends Model<ProfesorMateriaAttributes>, ProfesorMateriaAttributes {}

const ProfesorMateria = sequelize.define<ProfesorMateriaInstance>('ProfesorMateria', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  usuario_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Usuario con rol profesor'
  },
  materia_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  }
}, {
  tableName: 'profesor_materia',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['usuario_id', 'materia_id']
    }
  ]
});

export default ProfesorMateria;