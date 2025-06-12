import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

import { TipoLog } from './types';

interface LogAttributes {
  id: number;
  usuario_id?: number;
  tipo: TipoLog;
  descripcion: string;
  origen?: string;
  fecha: Date;
  ip_origen?: string;
}

interface LogCreationAttributes extends Optional<LogAttributes, 'id' | 'usuario_id' | 'origen' | 'ip_origen'> {}

export interface LogInstance extends Model<LogAttributes, LogCreationAttributes>, LogAttributes {
  created_at?: Date;
  updated_at?: Date;
}

const Log = sequelize.define<LogInstance>('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Usuario que originó la acción o fue afectado. Puede ser NULL para eventos del sistema'
  },
  tipo: {
    type: DataTypes.ENUM('error', 'configuracion', 'seguridad', 'conexion', 'autenticacion', 'auditoria', 'otro'),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Descripción detallada del evento'
  },
  origen: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ej: API_USUARIOS, ESP32_AULA4, PANEL_ADMIN, SISTEMA'
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ip_origen: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'log',
  timestamps: false,
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['tipo']
    },
    {
      fields: ['fecha']
    }
  ]
});

export default Log;