import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface GrupoChatAttributes {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'privado' | 'materia' | 'curso' | 'custom';
  avatar?: string;
  usuario_creador_id: number;
  curso_division_materia_id?: number;
  curso_division_id?: number;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

interface GrupoChatCreationAttributes extends Optional<GrupoChatAttributes, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

export interface GrupoChatInstance extends Model<GrupoChatAttributes, GrupoChatCreationAttributes>, GrupoChatAttributes {}

const GrupoChat = sequelize.define<GrupoChatInstance>(
  'GrupoChat',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM('privado', 'materia', 'curso', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    usuario_creador_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    curso_division_materia_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'curso_division_materia',
        key: 'id',
      },
    },
    curso_division_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'curso_division',
        key: 'id',
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'grupo_chat',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
      {
        fields: ['tipo'],
      },
      {
        fields: ['usuario_creador_id'],
      },
      {
        fields: ['curso_division_materia_id'],
      },
      {
        fields: ['curso_division_id'],
      },
      {
        fields: ['activo'],
      },
    ],
  }
);

export default GrupoChat;