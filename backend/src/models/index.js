const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Configuración de la conexión a MariaDB
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nombre de la base de datos
  process.env.DB_USER,      // Usuario
  process.env.DB_PASSWORD,  // Contraseña
  {
    host: process.env.DB_HOST,  // IP o hostname del contenedor DB
    dialect: 'mariadb',
    logging: false,  // Podés activar logs si querés debuggear
  }
);

// Modelos

const Usuario = sequelize.define('Usuario', {
  dni: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(100) },
  apellido: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(100) },
  contraseña: { type: DataTypes.STRING(255) },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
}, {
  tableName: 'usuario',
  timestamps: false
});

const Rol = sequelize.define('Rol', {
  nombre: { type: DataTypes.STRING(50), unique: true }
}, {
  tableName: 'rol',
  timestamps: false
});

const UsuarioRol = sequelize.define('UsuarioRol', {
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
module.exports = {
  sequelize,
  Usuario,
  Rol,
  UsuarioRol,
  // Podés ir sumando el resto de modelos (materia, curso, etc.)
};