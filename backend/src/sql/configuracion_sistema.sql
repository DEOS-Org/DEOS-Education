-- Crear tabla configuracion_sistema
CREATE TABLE configuracion_sistema (
  clave VARCHAR(50) PRIMARY KEY,
  valor TEXT NOT NULL,
  tipo ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  descripcion TEXT,
  categoria VARCHAR(50),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuraciones por defecto
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion, categoria) VALUES
('institucion_nombre', 'DEOS Education', 'string', 'Nombre de la institución', 'general'),
('institucion_logo', '', 'string', 'URL del logo de la institución', 'general'),
('institucion_email', 'contacto@deoseducation.com', 'string', 'Email de contacto', 'general'),
('institucion_telefono', '', 'string', 'Teléfono de contacto', 'general'),
('zona_horaria', 'America/Argentina/Buenos_Aires', 'string', 'Zona horaria del sistema', 'general'),

('horario_entrada', '08:00', 'string', 'Horario de entrada', 'asistencia'),
('tolerancia_tardanza', '15', 'number', 'Tolerancia en minutos para tardanza', 'asistencia'),
('dias_habiles', '["lunes", "martes", "miercoles", "jueves", "viernes"]', 'json', 'Días hábiles de la semana', 'asistencia'),

('email_notificaciones', 'true', 'boolean', 'Enviar notificaciones por email', 'notificaciones'),
('umbral_ausentismo', '10', 'number', 'Porcentaje de ausentismo para alertas', 'notificaciones'),
('email_admin', 'admin@deoseducation.com', 'string', 'Email del administrador', 'notificaciones'),

('session_timeout', '480', 'number', 'Tiempo de sesión en minutos', 'seguridad'),
('2fa_obligatorio', 'false', 'boolean', '2FA obligatorio para todos los usuarios', 'seguridad'),
('intentos_login_max', '5', 'number', 'Máximo de intentos de login', 'seguridad');