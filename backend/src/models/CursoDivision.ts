import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface CursoDivisionAttributes {
  id?: number;
  curso_id: number;
  division_id: number;
  nombre_legible?: string;
}

export interface CursoDivisionInstance extends Model<CursoDivisionAttributes>, CursoDivisionAttributes {}

const CursoDivision = sequelize.define<CursoDivisionInstance>('CursoDivision', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  curso_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  division_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  nombre_legible: { 
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ej: 5to Informática. Generado/gestionado por el backend.'
  }
}, {
  tableName: 'curso_division',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['curso_id', 'division_id']
    }
  ]
});

export default CursoDivision;