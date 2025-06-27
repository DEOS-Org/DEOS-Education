import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

interface NotificacionAttributes {
  id: number;
  usuario_id?: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  leida: boolean;
  fecha_creacion: Date;
  fecha_leida?: Date;
  accion_url?: string;
  metadata?: any;
}

interface NotificacionCreationAttributes extends Optional<NotificacionAttributes, 'id' | 'leida' | 'fecha_creacion' | 'fecha_leida' | 'accion_url' | 'metadata'> {}

export interface NotificacionInstance extends Model<NotificacionAttributes, NotificacionCreationAttributes>, NotificacionAttributes {}

const Notificacion = sequelize.define<NotificacionInstance>('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = notificación global
    references: {
      model: 'usuario',
      key: 'id'
    }
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'success'),
    allowNull: false,
    defaultValue: 'info'
  },
  leida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_leida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accion_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'notificaciones',
  timestamps: false,
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['leida']
    },
    {
      fields: ['fecha_creacion']
    },
    {
      fields: ['tipo']
    }
  ]
});

export default Notificacion;