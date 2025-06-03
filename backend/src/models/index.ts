import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Configuración de la conexión a MariaDB
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: 'mariadb',
    logging: false,
  }
);

// Interfaces y tipado de modelos Sequelize
export interface UsuarioAttributes {
  id?: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  activo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UsuarioInstance extends Model<UsuarioAttributes>, UsuarioAttributes {}

export interface RolAttributes {
  id?: number;
  nombre: string;
}
export interface RolInstance extends Model<RolAttributes>, RolAttributes {}

export interface UsuarioRolAttributes {
  id?: number;
  usuario_id: number;
  rol_id: number;
}
export interface UsuarioRolInstance extends Model<UsuarioRolAttributes>, UsuarioRolAttributes {}

// Modelos
const Usuario = sequelize.define<UsuarioInstance>('Usuario', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  dni: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(100) },
  apellido: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(100) },
  contraseña: { type: DataTypes.STRING(255) },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'usuario',
  timestamps: false
});

const Rol = sequelize.define<RolInstance>('Rol', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(50), unique: true }
}, {
  tableName: 'rol',
  timestamps: false
});

const UsuarioRol = sequelize.define<UsuarioRolInstance>('UsuarioRol', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER },
  rol_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'usuario_rol',
  timestamps: false
});

// Relaciones básicas (para más adelante si querés)
UsuarioRol.belongsTo(Usuario, { foreignKey: 'usuario_id' });
UsuarioRol.belongsTo(Rol, { foreignKey: 'rol_id' });

// Exportar
export { sequelize, Usuario, Rol, UsuarioRol };