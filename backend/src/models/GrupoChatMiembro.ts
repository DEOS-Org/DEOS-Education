import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

export interface GrupoChatMiembroAttributes {
  id: number;
  grupo_chat_id: number;
  usuario_id: number;
  rol: 'admin' | 'moderador' | 'miembro';
  puede_enviar_mensajes: boolean;
  silenciado_hasta?: Date;
  fecha_union: Date;
  fecha_salida?: Date;
  activo: boolean;
  fecha_creacion: Date;
}

interface GrupoChatMiembroCreationAttributes extends Optional<GrupoChatMiembroAttributes, 'id' | 'fecha_creacion'> {}

export interface GrupoChatMiembroInstance extends Model<GrupoChatMiembroAttributes, GrupoChatMiembroCreationAttributes>, GrupoChatMiembroAttributes {}

const GrupoChatMiembro = sequelize.define<GrupoChatMiembroInstance>(
  'GrupoChatMiembro',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    grupo_chat_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'grupo_chat',
        key: 'id',
      },
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id',
      },
    },
    rol: {
      type: DataTypes.ENUM('admin', 'moderador', 'miembro'),
      allowNull: false,
      defaultValue: 'miembro',
    },
    puede_enviar_mensajes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    silenciado_hasta: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_union: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_salida: {
      type: DataTypes.DATE,
      allowNull: true,
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
  },
  {
    tableName: 'grupo_chat_miembro',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['grupo_chat_id', 'usuario_id'],
      },
      {
        fields: ['usuario_id'],
      },
      {
        fields: ['activo'],
      },
      {
        fields: ['rol'],
      },
    ],
  }
);

export default GrupoChatMiembro;