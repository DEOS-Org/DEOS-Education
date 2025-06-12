import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface DivisionAttributes {
  id?: number;
  division: string;
}

export interface DivisionInstance extends Model<DivisionAttributes>, DivisionAttributes {}

const Division = sequelize.define<DivisionInstance>('Division', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  division: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    comment: 'Ej: A, B, Informática, Electrónica'
  }
}, {
  tableName: 'division',
  timestamps: false
});

export default Division;