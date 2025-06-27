import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface MensajeAttributes {
  id: number;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'archivo' | 'audio' | 'video';
  usuario_emisor_id: number;
  usuario_receptor_id?: number;
  grupo_chat_id?: number;
  mensaje_padre_id?: number;
  archivo_url?: string;
  archivo_nombre?: string;
  archivo_tamano?: number;
  editado: boolean;
  fecha_edicion?: Date;
  eliminado: boolean;
  fecha_eliminacion?: Date;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

interface MensajeCreationAttributes extends Optional<MensajeAttributes, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

export interface MensajeInstance extends Model<MensajeAttributes, MensajeCreationAttributes>, MensajeAttributes {}

const Mensaje = sequelize.define<MensajeInstance>(
  'Mensaje',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('texto', 'imagen', 'archivo', 'audio', 'video'),
      allowNull: false,
      defaultValue: 'texto',
    },
    usuario_emisor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    usuario_receptor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    grupo_chat_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'grupo_chat',
        key: 'id',
      },
    },
    mensaje_padre_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'mensaje',
        key: 'id',
      },
    },
    archivo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    archivo_nombre: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    archivo_tamano: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    editado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_edicion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    eliminado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_eliminacion: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'mensaje',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
      {
        fields: ['usuario_emisor_id'],
      },
      {
        fields: ['usuario_receptor_id'],
      },
      {
        fields: ['grupo_chat_id'],
      },
      {
        fields: ['mensaje_padre_id'],
      },
      {
        fields: ['tipo'],
      },
      {
        fields: ['eliminado'],
      },
      {
        fields: ['fecha_creacion'],
      },
    ],
  }
);

export default Mensaje;