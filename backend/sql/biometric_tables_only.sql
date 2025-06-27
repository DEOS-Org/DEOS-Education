-- Esquema simplificado para sistema biométrico distribuido
-- Solo tablas principales, sin procedimientos

USE biometrico;

-- Tabla principal de dispositivos biométricos
CREATE TABLE IF NOT EXISTS dispositivos_biometricos (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    ip_actual VARCHAR(45),
    estado ENUM('online', 'offline', 'sincronizando', 'error') DEFAULT 'offline',
    modelo VARCHAR(50) DEFAULT 'AS608',
    version_firmware VARCHAR(20),
    capacidad_huellas INT DEFAULT 127,
    configuracion JSON,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado (estado),
    INDEX idx_ultimo_contacto (ultimo_contacto)
);

-- Tabla central de huellas biométricas
CREATE TABLE IF NOT EXISTS huellas_biometricas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    template_huella LONGTEXT NOT NULL,
    calidad INT NOT NULL CHECK (calidad BETWEEN 0 AND 100),
    hash_huella VARCHAR(64) UNIQUE NOT NULL,
    dispositivo_origen VARCHAR(50),
    slot_original INT,
    metadatos JSON,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (dispositivo_origen) REFERENCES dispositivos_biometricos(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_activo (activo),
    INDEX idx_dispositivo_origen (dispositivo_origen),
    INDEX idx_hash_huella (hash_huella)
);

-- Tabla de distribución de huellas por dispositivo
CREATE TABLE IF NOT EXISTS huellas_dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    huella_id INT NOT NULL,
    dispositivo_id VARCHAR(50) NOT NULL,
    slot_local INT NOT NULL CHECK (slot_local BETWEEN 1 AND 127),
    estado ENUM('pendiente', 'sincronizado', 'eliminado', 'error') DEFAULT 'pendiente',
    fecha_sincronizacion TIMESTAMP NULL,
    intentos_sync INT DEFAULT 0,
    ultimo_error TEXT,
    FOREIGN KEY (huella_id) REFERENCES huellas_biometricas(id) ON DELETE CASCADE,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_device_slot (dispositivo_id, slot_local),
    INDEX idx_huella (huella_id),
    INDEX idx_dispositivo (dispositivo_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_sync (fecha_sincronizacion)
);

-- Tabla de eventos biométricos
CREATE TABLE IF NOT EXISTS eventos_biometricos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id VARCHAR(50) NOT NULL,
    usuario_id INT NULL,
    tipo_evento ENUM('autenticacion', 'asistencia', 'registro', 'error', 'heartbeat') NOT NULL,
    resultado ENUM('exitoso', 'fallido', 'desconocido') NOT NULL,
    confianza INT NULL CHECK (confianza BETWEEN 0 AND 100),
    timestamp_dispositivo BIGINT NULL,
    timestamp_servidor TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_adicionales JSON,
    sincronizado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL,
    INDEX idx_dispositivo (dispositivo_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo_evento (tipo_evento),
    INDEX idx_timestamp_servidor (timestamp_servidor),
    INDEX idx_sincronizado (sincronizado)
);

-- Tabla de cola de sincronización
CREATE TABLE IF NOT EXISTS cola_sincronizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id VARCHAR(50) NOT NULL,
    tipo_operacion ENUM('crear_huella', 'eliminar_huella', 'actualizar_config', 'evento') NOT NULL,
    datos JSON NOT NULL,
    prioridad INT DEFAULT 1,
    intentos INT DEFAULT 0,
    max_intentos INT DEFAULT 3,
    estado ENUM('pendiente', 'procesando', 'completado', 'fallido') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento TIMESTAMP NULL,
    error_mensaje TEXT,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id) ON DELETE CASCADE,
    INDEX idx_dispositivo_estado (dispositivo_id, estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_fecha_creacion (fecha_creacion)
);

-- Vista para estado de dispositivos
CREATE OR REPLACE VIEW vista_estado_dispositivos AS
SELECT 
    d.id,
    d.nombre,
    d.ubicacion,
    d.ip_actual,
    d.estado,
    d.modelo,
    d.version_firmware,
    d.capacidad_huellas,
    d.activo,
    d.ultimo_contacto,
    COUNT(hd.huella_id) as huellas_sincronizadas,
    ROUND((COUNT(hd.huella_id) / d.capacidad_huellas) * 100, 2) as porcentaje_uso,
    COUNT(cs.id) as eventos_pendientes
FROM dispositivos_biometricos d
LEFT JOIN huellas_dispositivos hd ON d.id = hd.dispositivo_id AND hd.estado = 'sincronizado'
LEFT JOIN cola_sincronizacion cs ON d.id = cs.dispositivo_id AND cs.estado = 'pendiente'
GROUP BY d.id;

-- Vista para huellas distribuidas
CREATE OR REPLACE VIEW vista_huellas_distribuidas AS
SELECT 
    hb.id as huella_id,
    hb.usuario_id,
    u.nombre,
    u.apellido,
    u.dni,
    hb.calidad,
    hb.activo,
    hb.fecha_registro,
    COUNT(hd.dispositivo_id) as dispositivos_sincronizados,
    GROUP_CONCAT(hd.dispositivo_id) as dispositivos_lista
FROM huellas_biometricas hb
JOIN usuario u ON hb.usuario_id = u.id
LEFT JOIN huellas_dispositivos hd ON hb.id = hd.huella_id AND hd.estado = 'sincronizado'
GROUP BY hb.id;

-- Insertar dispositivo de ejemplo
INSERT IGNORE INTO dispositivos_biometricos (id, nombre, ubicacion) 
VALUES ('ESP32_Huella_01', 'Sensor Principal', 'Entrada Principal');

-- Actualizar timestamp
UPDATE dispositivos_biometricos SET ultimo_contacto = NOW() WHERE id = 'ESP32_Huella_01';