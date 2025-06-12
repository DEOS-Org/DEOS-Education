import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

import { DiaSemana } from './types';

interface HorarioAttributes {
  id: number;
  curso_division_id: number;
  dia: DiaSemana;
  hora_inicio: string; // TIME format "HH:MM:SS"
  hora_fin: string; // TIME format "HH:MM:SS"
  curso_division_materia_id: number;
  profesor_usuario_id: number;
  aula?: string;
}

interface HorarioCreationAttributes extends Optional<HorarioAttributes, 'id'> {}

export interface HorarioInstance extends Model<HorarioAttributes, HorarioCreationAttributes>, HorarioAttributes {
  created_at?: Date;
  updated_at?: Date;
}

const Horario = sequelize.define<HorarioInstance>('Horario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  curso_division_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'A qué curso/división pertenece este bloque horario'
  },
  dia: {
    type: DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
    allowNull: false
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false
  },
  curso_division_materia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Qué materia específica de ese curso/división se dicta'
  },
  profesor_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Qué profesor (usuario con rol profesor) está a cargo'
  },
  aula: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Aula donde se dicta la clase'
  }
}, {
  tableName: 'horario',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['curso_division_id', 'dia', 'hora_inicio', 'curso_division_materia_id'],
      name: 'idx_horario_curso_dia_inicio_materia'
    },
    {
      unique: true,
      fields: ['profesor_usuario_id', 'dia', 'hora_inicio'],
      name: 'idx_horario_profesor_dia_inicio'
    }
  ]
});

export default Horario;