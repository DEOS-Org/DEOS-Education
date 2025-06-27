-- Script SQL para crear el sistema de calificaciones/notas
-- Base de datos: biometrico
-- Uso: mysql -u biofirma -p biometrico < notas_sistema.sql

USE biometrico;

-- Tabla para tipos de evaluaciones (exámenes, trabajos prácticos, etc.)
DROP TABLE IF EXISTS `tipo_evaluacion`;
CREATE TABLE `tipo_evaluacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL COMMENT 'Ej: Examen, Trabajo Práctico, Oral, Ensayo, Proyecto',
  `descripcion` text DEFAULT NULL,
  `peso_porcentual` decimal(5,2) DEFAULT NULL COMMENT 'Peso relativo en la nota final (opcional)',
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertar tipos de evaluación comunes
INSERT INTO `tipo_evaluacion` (`nombre`, `descripcion`, `peso_porcentual`) VALUES
('Examen', 'Evaluación escrita u oral formal', 40.00),
('Trabajo Práctico', 'Trabajo práctico individual o grupal', 30.00),
('Parcial', 'Evaluación parcial de la materia', 35.00),
('Oral', 'Evaluación oral', 25.00),
('Ensayo', 'Trabajo de investigación escrito', 20.00),
('Proyecto', 'Proyecto integrador', 50.00),
('Tarea', 'Tarea para el hogar', 10.00),
('Participación', 'Participación en clase', 15.00);

-- Tabla principal de notas/calificaciones
DROP TABLE IF EXISTS `nota`;
CREATE TABLE `nota` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_usuario_id` int(11) NOT NULL COMMENT 'Usuario con rol alumno',
  `materia_id` int(11) NOT NULL COMMENT 'Materia evaluada',
  `profesor_usuario_id` int(11) NOT NULL COMMENT 'Profesor que asignó la nota',
  `tipo_evaluacion_id` int(11) NOT NULL COMMENT 'Tipo de evaluación',
  `calificacion` decimal(4,2) NOT NULL COMMENT 'Nota numérica (ej: 8.50, rango 1.00-10.00)',
  `calificacion_concepto` enum('Excelente','Muy Bueno','Bueno','Regular','Insuficiente') DEFAULT NULL COMMENT 'Concepto equivalente',
  `titulo` varchar(200) NOT NULL COMMENT 'Título de la evaluación (ej: "Examen Primer Trimestre")',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción detallada de la evaluación',
  `fecha_evaluacion` date NOT NULL COMMENT 'Fecha en que se realizó la evaluación',
  `fecha_carga` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha en que se cargó la nota al sistema',
  `observaciones` text DEFAULT NULL COMMENT 'Observaciones del profesor',
  `peso` decimal(5,2) DEFAULT 1.00 COMMENT 'Peso de esta nota en el promedio (default 1.00)',
  `trimestre` int(1) DEFAULT NULL COMMENT 'Trimestre al que pertenece (1, 2, 3)',
  `periodo_lectivo` year DEFAULT NULL COMMENT 'Año lectivo',
  `activa` tinyint(1) DEFAULT 1 COMMENT 'Si la nota está activa (para permitir correcciones)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nota_alumno` (`alumno_usuario_id`),
  KEY `idx_nota_materia` (`materia_id`),
  KEY `idx_nota_profesor` (`profesor_usuario_id`),
  KEY `idx_nota_fecha` (`fecha_evaluacion`),
  KEY `idx_nota_trimestre` (`trimestre`, `periodo_lectivo`),
  KEY `fk_nota_tipo_evaluacion` (`tipo_evaluacion_id`),
  CONSTRAINT `fk_nota_alumno` FOREIGN KEY (`alumno_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nota_materia` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nota_profesor` FOREIGN KEY (`profesor_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nota_tipo_evaluacion` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipo_evaluacion` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_calificacion_rango` CHECK (`calificacion` >= 1.00 AND `calificacion` <= 10.00),
  CONSTRAINT `chk_trimestre_valido` CHECK (`trimestre` IN (1, 2, 3)),
  CONSTRAINT `chk_peso_positivo` CHECK (`peso` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Registro de todas las calificaciones de los alumnos';

-- Tabla para promedios calculados (para optimización)
DROP TABLE IF EXISTS `promedio_alumno`;
CREATE TABLE `promedio_alumno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_usuario_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `promedio_trimestre1` decimal(4,2) DEFAULT NULL,
  `promedio_trimestre2` decimal(4,2) DEFAULT NULL,
  `promedio_trimestre3` decimal(4,2) DEFAULT NULL,
  `promedio_anual` decimal(4,2) DEFAULT NULL,
  `cantidad_notas` int(11) DEFAULT 0 COMMENT 'Total de notas para esta materia',
  `periodo_lectivo` year NOT NULL,
  `estado` enum('En Curso','Aprobado','Desaprobado','Libre') DEFAULT 'En Curso',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_promedio_unico` (`alumno_usuario_id`, `materia_id`, `periodo_lectivo`),
  KEY `fk_promedio_materia` (`materia_id`),
  CONSTRAINT `fk_promedio_alumno` FOREIGN KEY (`alumno_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_promedio_materia` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla optimizada para promedios calculados por alumno y materia';

-- Trigger para actualizar concepto automáticamente según la calificación
DELIMITER $$
CREATE TRIGGER `tr_nota_concepto_auto` 
BEFORE INSERT ON `nota` 
FOR EACH ROW 
BEGIN
    SET NEW.calificacion_concepto = CASE
        WHEN NEW.calificacion >= 9.00 THEN 'Excelente'
        WHEN NEW.calificacion >= 8.00 THEN 'Muy Bueno'
        WHEN NEW.calificacion >= 6.00 THEN 'Bueno'
        WHEN NEW.calificacion >= 4.00 THEN 'Regular'
        ELSE 'Insuficiente'
    END;
    
    -- Asignar período lectivo actual si no se especifica
    IF NEW.periodo_lectivo IS NULL THEN
        SET NEW.periodo_lectivo = YEAR(CURDATE());
    END IF;
END$$

CREATE TRIGGER `tr_nota_concepto_auto_update` 
BEFORE UPDATE ON `nota` 
FOR EACH ROW 
BEGIN
    SET NEW.calificacion_concepto = CASE
        WHEN NEW.calificacion >= 9.00 THEN 'Excelente'
        WHEN NEW.calificacion >= 8.00 THEN 'Muy Bueno'
        WHEN NEW.calificacion >= 6.00 THEN 'Bueno'
        WHEN NEW.calificacion >= 4.00 THEN 'Regular'
        ELSE 'Insuficiente'
    END;
END$$
DELIMITER ;

-- Insertar datos de ejemplo para testing
INSERT INTO `nota` (
    `alumno_usuario_id`, 
    `materia_id`, 
    `profesor_usuario_id`, 
    `tipo_evaluacion_id`, 
    `calificacion`, 
    `titulo`, 
    `descripcion`, 
    `fecha_evaluacion`, 
    `observaciones`, 
    `trimestre`,
    `periodo_lectivo`
) VALUES
-- Notas para Valentin Acieff (id: 1) en Comunicación de Datos (materia_id: 1), Profesor Correa (id: 42)
(1, 1, 42, 1, 8.50, 'Examen Primer Trimestre - Protocolos de Red', 'Evaluación sobre TCP/IP y protocolos de comunicación', '2024-04-15', 'Buen manejo de conceptos teóricos', 1, 2024),
(1, 1, 42, 2, 9.00, 'TP1 - Configuración de Red', 'Trabajo práctico sobre configuración de switches', '2024-05-10', 'Excelente implementación práctica', 1, 2024),
(1, 1, 42, 4, 7.75, 'Evaluación Oral - Modelo OSI', 'Exposición sobre las capas del modelo OSI', '2024-05-20', 'Buena explicación, faltó profundizar en capa física', 1, 2024),

-- Notas para Pablo Carreras (id: 2) en Lab de Software (materia_id: 2), Profesor Quinteros (id: 43)
(2, 2, 43, 5, 8.25, 'Ensayo - Metodologías Ágiles', 'Investigación sobre SCRUM y Kanban', '2024-04-20', 'Análisis completo y bien estructurado', 1, 2024),
(2, 2, 43, 6, 9.50, 'Proyecto - Sistema de Gestión', 'Desarrollo de aplicación web con Node.js', '2024-06-01', 'Código limpio y documentación excelente', 2, 2024),

-- Notas para Maximiliano Castro (id: 3) en Ed Física (materia_id: 4)
(3, 4, 45, 8, 8.00, 'Participación Deportiva', 'Evaluación continua en actividades deportivas', '2024-05-15', 'Muy buen desempeño en deportes de equipo', 1, 2024),
(3, 4, 45, 1, 7.50, 'Examen Teórico - Deportes', 'Evaluación sobre reglamentos deportivos', '2024-06-10', 'Conoce bien los reglamentos básicos', 2, 2024),

-- Más notas para generar estadísticas
(1, 2, 43, 1, 7.25, 'Examen - Programación Web', 'Evaluación de HTML, CSS y JavaScript', '2024-04-25', 'Domina el frontend, mejorar backend', 1, 2024),
(1, 3, 44, 2, 8.75, 'TP - Configuración de VLAN', 'Trabajo práctico sobre redes virtuales', '2024-05-05', 'Configuración perfecta', 1, 2024),
(2, 1, 42, 3, 6.50, 'Parcial - Redes WAN', 'Evaluación sobre redes de área amplia', '2024-06-15', 'Necesita repasar conceptos de routing', 2, 2024),
(3, 1, 42, 1, 9.25, 'Examen Final - Comunicaciones', 'Evaluación integral de la materia', '2024-07-10', 'Excelente comprensión global', 3, 2024);

-- Crear vista para consultas comunes de notas con información completa
CREATE OR REPLACE VIEW `vista_notas_completa` AS
SELECT 
    n.id AS nota_id,
    n.calificacion,
    n.calificacion_concepto,
    n.titulo,
    n.descripcion,
    n.fecha_evaluacion,
    n.fecha_carga,
    n.observaciones,
    n.peso,
    n.trimestre,
    n.periodo_lectivo,
    
    -- Información del alumno
    ua.id AS alumno_id,
    ua.dni AS alumno_dni,
    CONCAT(ua.nombre, ' ', ua.apellido) AS alumno_nombre_completo,
    ua.email AS alumno_email,
    
    -- Información de la materia
    m.id AS materia_id,
    m.nombre AS materia_nombre,
    m.carga_horaria,
    
    -- Información del profesor
    up.id AS profesor_id,
    up.dni AS profesor_dni,
    CONCAT(up.nombre, ' ', up.apellido) AS profesor_nombre_completo,
    up.email AS profesor_email,
    
    -- Información del tipo de evaluación
    te.id AS tipo_evaluacion_id,
    te.nombre AS tipo_evaluacion_nombre,
    te.descripcion AS tipo_evaluacion_descripcion,
    te.peso_porcentual AS tipo_evaluacion_peso,
    
    -- Información del curso (si el alumno está asignado)
    cd.nombre_legible AS curso_division,
    c.año AS curso_año,
    d.division AS division_nombre
    
FROM nota n
INNER JOIN usuario ua ON n.alumno_usuario_id = ua.id
INNER JOIN materia m ON n.materia_id = m.id  
INNER JOIN usuario up ON n.profesor_usuario_id = up.id
INNER JOIN tipo_evaluacion te ON n.tipo_evaluacion_id = te.id
LEFT JOIN usuario_curso uc ON ua.id = uc.usuario_id
LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
LEFT JOIN curso c ON cd.curso_id = c.id
LEFT JOIN division d ON cd.division_id = d.id
WHERE n.activa = 1
ORDER BY n.fecha_evaluacion DESC;

-- Procedimiento almacenado para calcular promedios
DELIMITER $$
CREATE PROCEDURE `sp_calcular_promedio_alumno`(
    IN p_alumno_id INT,
    IN p_materia_id INT,
    IN p_periodo_lectivo YEAR
)
BEGIN
    DECLARE v_promedio_t1 DECIMAL(4,2) DEFAULT NULL;
    DECLARE v_promedio_t2 DECIMAL(4,2) DEFAULT NULL;
    DECLARE v_promedio_t3 DECIMAL(4,2) DEFAULT NULL;
    DECLARE v_promedio_anual DECIMAL(4,2) DEFAULT NULL;
    DECLARE v_cantidad_notas INT DEFAULT 0;
    DECLARE v_estado VARCHAR(20) DEFAULT 'En Curso';
    
    -- Calcular promedio trimestre 1
    SELECT AVG(calificacion * peso) / AVG(peso) INTO v_promedio_t1
    FROM nota 
    WHERE alumno_usuario_id = p_alumno_id 
      AND materia_id = p_materia_id 
      AND periodo_lectivo = p_periodo_lectivo
      AND trimestre = 1 
      AND activa = 1;
    
    -- Calcular promedio trimestre 2
    SELECT AVG(calificacion * peso) / AVG(peso) INTO v_promedio_t2
    FROM nota 
    WHERE alumno_usuario_id = p_alumno_id 
      AND materia_id = p_materia_id 
      AND periodo_lectivo = p_periodo_lectivo
      AND trimestre = 2 
      AND activa = 1;
    
    -- Calcular promedio trimestre 3
    SELECT AVG(calificacion * peso) / AVG(peso) INTO v_promedio_t3
    FROM nota 
    WHERE alumno_usuario_id = p_alumno_id 
      AND materia_id = p_materia_id 
      AND periodo_lectivo = p_periodo_lectivo
      AND trimestre = 3 
      AND activa = 1;
    
    -- Calcular promedio anual
    SELECT AVG(calificacion * peso) / AVG(peso), COUNT(*) INTO v_promedio_anual, v_cantidad_notas
    FROM nota 
    WHERE alumno_usuario_id = p_alumno_id 
      AND materia_id = p_materia_id 
      AND periodo_lectivo = p_periodo_lectivo
      AND activa = 1;
    
    -- Determinar estado
    IF v_promedio_anual IS NOT NULL THEN
        IF v_promedio_anual >= 6.00 THEN
            SET v_estado = 'Aprobado';
        ELSEIF v_promedio_anual >= 4.00 THEN
            SET v_estado = 'Desaprobado';
        ELSE
            SET v_estado = 'Libre';
        END IF;
    END IF;
    
    -- Insertar o actualizar el registro de promedio
    INSERT INTO promedio_alumno (
        alumno_usuario_id, 
        materia_id, 
        promedio_trimestre1, 
        promedio_trimestre2, 
        promedio_trimestre3, 
        promedio_anual, 
        cantidad_notas, 
        periodo_lectivo, 
        estado
    ) VALUES (
        p_alumno_id, 
        p_materia_id, 
        v_promedio_t1, 
        v_promedio_t2, 
        v_promedio_t3, 
        v_promedio_anual, 
        v_cantidad_notas, 
        p_periodo_lectivo, 
        v_estado
    ) ON DUPLICATE KEY UPDATE
        promedio_trimestre1 = v_promedio_t1,
        promedio_trimestre2 = v_promedio_t2,
        promedio_trimestre3 = v_promedio_t3,
        promedio_anual = v_promedio_anual,
        cantidad_notas = v_cantidad_notas,
        estado = v_estado,
        updated_at = CURRENT_TIMESTAMP;
        
END$$
DELIMITER ;

-- Calcular promedios para los datos de ejemplo
CALL sp_calcular_promedio_alumno(1, 1, 2024);
CALL sp_calcular_promedio_alumno(1, 2, 2024);
CALL sp_calcular_promedio_alumno(1, 3, 2024);
CALL sp_calcular_promedio_alumno(2, 1, 2024);
CALL sp_calcular_promedio_alumno(2, 2, 2024);
CALL sp_calcular_promedio_alumno(3, 1, 2024);
CALL sp_calcular_promedio_alumno(3, 4, 2024);

-- Índices adicionales para optimización
CREATE INDEX idx_nota_periodo_lectivo ON nota(periodo_lectivo);
CREATE INDEX idx_nota_activa ON nota(activa);
CREATE INDEX idx_promedio_periodo ON promedio_alumno(periodo_lectivo);

-- Comentarios finales
-- Esta estructura permite:
-- 1. Registro detallado de todas las evaluaciones
-- 2. Cálculo automático de promedios por trimestre y anual
-- 3. Flexibilidad en tipos de evaluación y pesos
-- 4. Auditoría completa (quién, cuándo, qué)
-- 5. Reportes eficientes mediante vistas y procedimientos
-- 6. Integridad referencial con el resto del sistema