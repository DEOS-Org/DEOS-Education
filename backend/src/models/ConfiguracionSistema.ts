import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';

interface ConfiguracionSistemaAttributes {
  clave: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  descripcion?: string;
  categoria?: string;
  updated_at?: Date;
}

interface ConfiguracionSistemaCreationAttributes extends Optional<ConfiguracionSistemaAttributes, 'descripcion' | 'categoria' | 'updated_at'> {}

export interface ConfiguracionSistemaInstance extends Model<ConfiguracionSistemaAttributes, ConfiguracionSistemaCreationAttributes>, ConfiguracionSistemaAttributes {}

const ConfiguracionSistema = sequelize.define<ConfiguracionSistemaInstance>('ConfiguracionSistema', {
  clave: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'configuracion_sistema',
  timestamps: false,
  hooks: {
    beforeUpdate: (instance) => {
      instance.updated_at = new Date();
    }
  }
});

export default ConfiguracionSistema;