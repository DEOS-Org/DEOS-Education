-- Schema para Sistema Biométrico Distribuido
-- Soporta múltiples dispositivos, sincronización offline y distribución de huellas

-- Tabla de dispositivos biométricos
CREATE TABLE IF NOT EXISTS dispositivos_biometricos (
    id VARCHAR(50) PRIMARY KEY,  -- Ej: ESP32_Huella_01, ESP32_Huella_02
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    ip_actual VARCHAR(15),
    estado ENUM('online', 'offline', 'sincronizando', 'error') DEFAULT 'offline',
    modelo VARCHAR(50) DEFAULT 'AS608',
    version_firmware VARCHAR(20),
    capacidad_huellas INT DEFAULT 127,
    ultimo_contacto TIMESTAMP NULL,
    fecha_instalacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    configuracion JSON, -- Para configuración específica del dispositivo
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla central de huellas (fuente de verdad)
CREATE TABLE IF NOT EXISTS huellas_biometricas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    template_huella LONGTEXT NOT NULL,  -- Template de la huella codificado
    calidad INT NOT NULL,  -- Calidad de la huella (0-100)
    hash_huella VARCHAR(64) NOT NULL, -- Hash para detectar duplicados
    dispositivo_origen VARCHAR(50) NOT NULL, -- Dispositivo donde se registró
    slot_original INT, -- Slot donde se guardó originalmente
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    metadatos JSON, -- Info adicional (mano, dedo, etc.)
    
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (dispositivo_origen) REFERENCES dispositivos_biometricos(id),
    UNIQUE KEY unique_user_hash (usuario_id, hash_huella),
    INDEX idx_usuario (usuario_id),
    INDEX idx_dispositivo (dispositivo_origen),
    INDEX idx_activo (activo)
);

-- Tabla de distribución de huellas (qué huella está en qué dispositivo)
CREATE TABLE IF NOT EXISTS huellas_dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    huella_id INT NOT NULL,
    dispositivo_id VARCHAR(50) NOT NULL,
    slot_local INT NOT NULL, -- Slot en el dispositivo específico
    estado ENUM('pendiente', 'sincronizado', 'error', 'eliminado') DEFAULT 'pendiente',
    fecha_sincronizacion TIMESTAMP NULL,
    intentos_sync INT DEFAULT 0,
    ultimo_error TEXT NULL,
    
    FOREIGN KEY (huella_id) REFERENCES huellas_biometricas(id) ON DELETE CASCADE,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_device_slot (dispositivo_id, slot_local),
    UNIQUE KEY unique_huella_device (huella_id, dispositivo_id),
    INDEX idx_estado (estado),
    INDEX idx_dispositivo (dispositivo_id)
);

-- Tabla de eventos biométricos (registros de uso)
CREATE TABLE IF NOT EXISTS eventos_biometricos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id VARCHAR(50) NOT NULL,
    usuario_id INT NULL, -- NULL si no se pudo identificar
    tipo_evento ENUM('autenticacion', 'asistencia', 'registro', 'error', 'heartbeat') NOT NULL,
    resultado ENUM('exitoso', 'fallido', 'desconocido') NOT NULL,
    confianza INT NULL, -- Nivel de confianza de la detección
    timestamp_dispositivo BIGINT NOT NULL, -- Timestamp del dispositivo (millis)
    timestamp_servidor TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_adicionales JSON, -- Datos específicos del evento
    sincronizado BOOLEAN DEFAULT TRUE, -- FALSE si vino de cola offline
    
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    INDEX idx_dispositivo_fecha (dispositivo_id, timestamp_servidor),
    INDEX idx_usuario_fecha (usuario_id, timestamp_servidor),
    INDEX idx_tipo (tipo_evento),
    INDEX idx_sincronizado (sincronizado)
);

-- Tabla de cola de sincronización offline
CREATE TABLE IF NOT EXISTS cola_sincronizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id VARCHAR(50) NOT NULL,
    tipo_operacion ENUM('crear_huella', 'eliminar_huella', 'evento', 'estado') NOT NULL,
    datos JSON NOT NULL, -- Datos de la operación
    timestamp_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    intentos INT DEFAULT 0,
    ultimo_intento TIMESTAMP NULL,
    estado ENUM('pendiente', 'procesando', 'completado', 'error') DEFAULT 'pendiente',
    error_mensaje TEXT NULL,
    
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id),
    INDEX idx_dispositivo_estado (dispositivo_id, estado),
    INDEX idx_timestamp (timestamp_creacion)
);

-- Tabla de sesiones de dispositivos (para tracking de conexión)
CREATE TABLE IF NOT EXISTS sesiones_dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id VARCHAR(50) NOT NULL,
    inicio_sesion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fin_sesion TIMESTAMP NULL,
    ip_conexion VARCHAR(15),
    version_firmware VARCHAR(20),
    estado_final ENUM('normal', 'desconexion_abrupta', 'reinicio', 'error'),
    eventos_procesados INT DEFAULT 0,
    
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_biometricos(id),
    INDEX idx_dispositivo (dispositivo_id),
    INDEX idx_inicio (inicio_sesion)
);

-- Tabla de configuración de distribución
CREATE TABLE IF NOT EXISTS configuracion_distribucion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor JSON NOT NULL,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración inicial
INSERT INTO configuracion_distribucion (clave, valor, descripcion) VALUES 
('sync_interval_online', '30', 'Intervalo de sincronización en línea (segundos)'),
('sync_interval_offline', '300', 'Intervalo de reintento offline (segundos)'),
('max_sync_attempts', '5', 'Máximo intentos de sincronización'),
('fingerprint_quality_min', '50', 'Calidad mínima de huella aceptable'),
('auto_distribute_fingerprints', 'true', 'Distribuir automáticamente huellas nuevas'),
('devices_auto_discovery', 'true', 'Descubrimiento automático de dispositivos')
ON DUPLICATE KEY UPDATE 
    valor = VALUES(valor),
    fecha_actualizacion = CURRENT_TIMESTAMP;

-- Insertar dispositivo de ejemplo
INSERT INTO dispositivos_biometricos (id, nombre, ubicacion, capacidad_huellas) VALUES 
('ESP32_Huella_01', 'Sensor Principal', 'Entrada Principal', 127)
ON DUPLICATE KEY UPDATE 
    nombre = VALUES(nombre),
    ubicacion = VALUES(ubicacion);

-- Vistas útiles para consultas comunes

-- Vista de estado de dispositivos
CREATE OR REPLACE VIEW vista_estado_dispositivos AS
SELECT 
    d.id,
    d.nombre,
    d.ubicacion,
    d.estado,
    d.ip_actual,
    d.ultimo_contacto,
    COUNT(hd.huella_id) as huellas_sincronizadas,
    d.capacidad_huellas,
    ROUND((COUNT(hd.huella_id) / d.capacidad_huellas) * 100, 2) as porcentaje_uso,
    (SELECT COUNT(*) FROM cola_sincronizacion cs WHERE cs.dispositivo_id = d.id AND cs.estado = 'pendiente') as eventos_pendientes
FROM dispositivos_biometricos d
LEFT JOIN huellas_dispositivos hd ON d.id = hd.dispositivo_id AND hd.estado = 'sincronizado'
WHERE d.activo = TRUE
GROUP BY d.id;

-- Vista de huellas distribuidas
CREATE OR REPLACE VIEW vista_huellas_distribuidas AS
SELECT 
    hb.id as huella_id,
    hb.usuario_id,
    u.nombre,
    u.apellido,
    u.dni,
    hb.calidad,
    hb.fecha_registro,
    COUNT(hd.dispositivo_id) as dispositivos_sincronizados,
    (SELECT COUNT(*) FROM dispositivos_biometricos WHERE activo = TRUE) as total_dispositivos,
    CASE 
        WHEN COUNT(hd.dispositivo_id) = (SELECT COUNT(*) FROM dispositivos_biometricos WHERE activo = TRUE) 
        THEN 'completa' 
        ELSE 'parcial' 
    END as estado_distribucion
FROM huellas_biometricas hb
JOIN usuario u ON hb.usuario_id = u.id
LEFT JOIN huellas_dispositivos hd ON hb.id = hd.huella_id AND hd.estado = 'sincronizado'
WHERE hb.activo = TRUE
GROUP BY hb.id;

-- Procedimiento para limpiar eventos antiguos
DELIMITER //
CREATE OR REPLACE PROCEDURE LimpiarEventosAntiguos(IN dias_antiguedad INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Eliminar eventos de más de X días
    DELETE FROM eventos_biometricos 
    WHERE timestamp_servidor < DATE_SUB(NOW(), INTERVAL dias_antiguedad DAY);
    
    -- Eliminar sesiones antiguas
    DELETE FROM sesiones_dispositivos 
    WHERE inicio_sesion < DATE_SUB(NOW(), INTERVAL dias_antiguedad DAY);
    
    -- Eliminar cola de sincronización completada antigua
    DELETE FROM cola_sincronizacion 
    WHERE estado = 'completado' 
    AND timestamp_creacion < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    COMMIT;
    
    SELECT ROW_COUNT() as registros_eliminados;
END //
DELIMITER ;