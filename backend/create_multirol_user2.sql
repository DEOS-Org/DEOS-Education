-- Script para crear un usuario con multiples roles
-- Este usuario tendra los roles de admin, profesor y preceptor

-- Si no existe, lo creamos
INSERT INTO usuario (dni, nombre, apellido, email, contraseña, activo, created_at)
SELECT '99999999', 'Usuario', 'MultiRol', 'multirol@test.com', '$2b$10$Q8xGjhSPMaxKmu8Xs.v15O5dDKkTPq0gePL/9MaYVtWZkZ6IHO.La', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'multirol@test.com');

-- Obtenemos el ID del usuario (ya sea existente o recien creado)
SELECT @user_id := id FROM usuario WHERE email = 'multirol@test.com';

-- Eliminamos roles previos si existen
DELETE FROM usuario_rol WHERE usuario_id = @user_id;

-- Asignamos multiples roles
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES
(@user_id, (SELECT id FROM rol WHERE nombre = 'admin')),
(@user_id, (SELECT id FROM rol WHERE nombre = 'profesor')),
(@user_id, (SELECT id FROM rol WHERE nombre = 'preceptor'));

-- Verificamos los roles asignados
SELECT 
    u.email,
    u.nombre,
    u.apellido,
    GROUP_CONCAT(r.nombre) as roles
FROM usuario u
JOIN usuario_rol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
WHERE u.email = 'multirol@test.com'
GROUP BY u.id;

-- La contraseña es: multirol123