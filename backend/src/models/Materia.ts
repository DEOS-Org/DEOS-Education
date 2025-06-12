import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface MateriaAttributes {
  id?: number;
  nombre: string;
  carga_horaria?: number;
  carga_horaria_minutos?: number;
}

export interface MateriaInstance extends Model<MateriaAttributes>, MateriaAttributes {}

const Materia = sequelize.define<MateriaInstance>('Materia', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  nombre: { 
    type: DataTypes.STRING(100), 
    allowNull: false,
    unique: true
  },
  carga_horaria: { 
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Horas semanales estimadas. Para referencia o validación.'
  },
  carga_horaria_minutos: {
    type: DataTypes.VIRTUAL,
    get() {
      const cargaHoraria = this.getDataValue('carga_horaria');
      return cargaHoraria ? cargaHoraria * 40 : null;
    }
  }
}, {
  tableName: 'materia',
  timestamps: false
});

export default Materia;