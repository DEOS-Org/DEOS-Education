// src/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' });

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    port: 3306, // Puerto de MariaDB por defecto
    logging: false // podés poner true para ver las consultas en consola
  }
);

// Probar la conexión
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa.');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
  }
})();

module.exports = sequelize;