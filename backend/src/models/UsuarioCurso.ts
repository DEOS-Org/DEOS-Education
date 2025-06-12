import { Model, DataTypes } from 'sequelize';
import { sequelize } from './db';

export interface UsuarioCursoAttributes {
  id?: number;
  usuario_id: number;
  curso_division_id: number;
}

export interface UsuarioCursoInstance extends Model<UsuarioCursoAttributes>, UsuarioCursoAttributes {}

const UsuarioCurso = sequelize.define<UsuarioCursoInstance>('UsuarioCurso', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  usuario_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Principalmente alumnos'
  },
  curso_division_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  }
}, {
  tableName: 'usuario_curso',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['usuario_id', 'curso_division_id']
    }
  ]
});

export default UsuarioCurso;