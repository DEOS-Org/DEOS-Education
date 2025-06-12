import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface CursoDivisionMateriaAttributes {
  id?: number;
  curso_division_id: number;
  materia_id: number;
}

export interface CursoDivisionMateriaInstance extends Model<CursoDivisionMateriaAttributes>, CursoDivisionMateriaAttributes {}

const CursoDivisionMateria = sequelize.define<CursoDivisionMateriaInstance>('CursoDivisionMateria', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  curso_division_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  materia_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  }
}, {
  tableName: 'curso_division_materia',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['curso_division_id', 'materia_id']
    }
  ]
});

export default CursoDivisionMateria;