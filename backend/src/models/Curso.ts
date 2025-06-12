import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface CursoAttributes {
  id?: number;
  año: number;
}

export interface CursoInstance extends Model<CursoAttributes>, CursoAttributes {}

const Curso = sequelize.define<CursoInstance>('Curso', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  año: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Ej: 5 (1 a 6)'
  }
}, {
  tableName: 'curso',
  timestamps: false
});

export default Curso;