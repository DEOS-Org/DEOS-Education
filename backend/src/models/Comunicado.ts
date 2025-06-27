import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface ComunicadoAttributes {
  id: number;
  titulo: string;
  contenido: string;
  tipo: 'general' | 'urgente' | 'informativo' | 'evento';
  estado: 'borrador' | 'publicado' | 'archivado';
  fecha_publicacion?: Date;
  fecha_vencimiento?: Date;
  usuario_creador_id: number;
  dirigido_a: 'todos' | 'estudiantes' | 'padres' | 'profesores' | 'admin';
  curso_division_id?: number;
  archivo_adjunto?: string;
  prioridad: 'baja' | 'media' | 'alta';
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

interface ComunicadoCreationAttributes extends Optional<ComunicadoAttributes, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

export interface ComunicadoInstance extends Model<ComunicadoAttributes, ComunicadoCreationAttributes>, ComunicadoAttributes {}

const Comunicado = sequelize.define<ComunicadoInstance>(
  'Comunicado',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('general', 'urgente', 'informativo', 'evento'),
      allowNull: false,
      defaultValue: 'general',
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'publicado', 'archivado'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    fecha_publicacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
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
    dirigido_a: {
      type: DataTypes.ENUM('todos', 'estudiantes', 'padres', 'profesores', 'admin'),
      allowNull: false,
      defaultValue: 'todos',
    },
    curso_division_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'curso_division',
        key: 'id',
      },
    },
    archivo_adjunto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta'),
      allowNull: false,
      defaultValue: 'media',
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
    tableName: 'comunicado',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
      {
        fields: ['estado', 'fecha_publicacion'],
      },
      {
        fields: ['dirigido_a'],
      },
      {
        fields: ['tipo'],
      },
      {
        fields: ['usuario_creador_id'],
      },
      {
        fields: ['curso_division_id'],
      },
    ],
  }
);

export default Comunicado;