const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario, Rol, UsuarioRol } = require('../models');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.contraseña);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Traer roles
    const roles = await UsuarioRol.findAll({
      where: { usuario_id: usuario.id },
      include: [Rol]
    });
    const rolesNombres = roles.map(r => r.Rol.nombre);

    // Generar token
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        roles: rolesNombres
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, roles: rolesNombres } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar el login' });
  }
};