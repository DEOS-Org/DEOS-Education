USE biometrico;

-- Crear usuario admin con contraseña hasheada para '12345678'
INSERT INTO usuario (dni, nombre, apellido, email, contraseña, activo) 
VALUES ('99999999', 'Admin', 'System', 'admin@test.com', '$2b$10$6HiIiu.izBGVWelkAITDOOBA3mAKhk7lx0uzaBy1lZ84lRyWpQL6e', 1);

-- Obtener el ID del usuario recién creado
SET @admin_id = LAST_INSERT_ID();

-- Asignar rol de administrador (asumiendo que el rol con id=1 es admin)
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (@admin_id, 1);