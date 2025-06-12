import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db';

interface AlumnoPadreAttributes {
  alumno_usuario_id: number;
  padre_usuario_id: number;
}

export interface AlumnoPadreInstance extends Model<AlumnoPadreAttributes>, AlumnoPadreAttributes {}

const AlumnoPadre = sequelize.define<AlumnoPadreInstance>('AlumnoPadre', {
  alumno_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  padre_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'alumno_padre',
  timestamps: true,
  underscored: true
});

export default AlumnoPadre; 