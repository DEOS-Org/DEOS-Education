-- Base de datos DEOS-Education
-- Estructura completa actualizada
-- Incluye: usuarios, roles, académico, biométrico, comunicados, sanciones y mensajería

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `biometrico` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `biometrico`;

-- =====================================================
-- TABLAS BASE: USUARIOS Y ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS `rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('M','F','O') DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_apellido_nombre` (`apellido`, `nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuario_rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_rol_unique` (`usuario_id`, `rol_id`),
  KEY `fk_usuario_rol_rol` (`rol_id`),
  CONSTRAINT `fk_usuario_rol_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuario_rol_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `alumno_padre` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_usuario_id` int(11) NOT NULL,
  `padre_usuario_id` int(11) NOT NULL,
  `relacion` enum('padre','madre','tutor','otro') DEFAULT 'padre',
  `es_tutor_legal` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `alumno_padre_unique` (`alumno_usuario_id`, `padre_usuario_id`),
  KEY `fk_alumno_padre_padre` (`padre_usuario_id`),
  CONSTRAINT `fk_alumno_padre_alumno` FOREIGN KEY (`alumno_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alumno_padre_padre` FOREIGN KEY (`padre_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS ACADÉMICAS
-- =====================================================

CREATE TABLE IF NOT EXISTS `curso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `año` int(11) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_año` (`año`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `division` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `division` varchar(10) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `division` (`division`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `curso_division` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `año_lectivo` int(11) NOT NULL,
  `turno` enum('mañana','tarde','noche','completo') DEFAULT 'mañana',
  `aula` varchar(20) DEFAULT NULL,
  `capacidad_maxima` int(11) DEFAULT 30,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `curso_division_año_unique` (`curso_id`, `division_id`, `año_lectivo`),
  KEY `fk_curso_division_division` (`division_id`),
  KEY `idx_año_lectivo` (`año_lectivo`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_curso_division_curso` FOREIGN KEY (`curso_id`) REFERENCES `curso` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_curso_division_division` FOREIGN KEY (`division_id`) REFERENCES `division` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `carga_horaria` int(11) DEFAULT NULL,
  `tipo` enum('obligatoria','optativa','taller','extracurricular') DEFAULT 'obligatoria',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `curso_division_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_division_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `curso_division_materia_unique` (`curso_division_id`, `materia_id`),
  KEY `fk_cdm_materia` (`materia_id`),
  CONSTRAINT `fk_cdm_curso_division` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cdm_materia` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profesor_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profesor_materia_unique` (`usuario_id`, `materia_id`),
  KEY `fk_profesor_materia_materia` (`materia_id`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_profesor_materia_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profesor_materia_materia` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuario_curso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `curso_division_id` int(11) NOT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_curso_unique` (`usuario_id`, `curso_division_id`),
  KEY `fk_usuario_curso_cd` (`curso_division_id`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_usuario_curso_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuario_curso_cd` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `horario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_division_materia_id` int(11) NOT NULL,
  `dia` enum('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `aula` varchar(20) DEFAULT NULL,
  `profesor_usuario_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_horario_cdm` (`curso_division_materia_id`),
  KEY `fk_horario_profesor` (`profesor_usuario_id`),
  KEY `idx_dia` (`dia`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_horario_cdm` FOREIGN KEY (`curso_division_materia_id`) REFERENCES `curso_division_materia` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_horario_profesor` FOREIGN KEY (`profesor_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS BIOMÉTRICAS
-- =====================================================

CREATE TABLE IF NOT EXISTS `dispositivo_fichaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `tipo` enum('entrada','salida','aula','general') DEFAULT 'general',
  `estado` enum('activo','inactivo','mantenimiento') DEFAULT 'activo',
  `ultimo_ping` timestamp NULL DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `huella` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `template` longblob NOT NULL,
  `dedo` enum('pulgar_der','indice_der','medio_der','anular_der','menique_der','pulgar_izq','indice_izq','medio_izq','anular_izq','menique_izq') NOT NULL,
  `calidad` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_dedo_unique` (`usuario_id`, `dedo`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_huella_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_fichaje_id` int(11) NOT NULL,
  `tipo` enum('entrada','salida','presente') NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `metodo` enum('huella','tarjeta','manual','facial') DEFAULT 'huella',
  `exitoso` tinyint(1) DEFAULT 1,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_registro_usuario` (`usuario_id`),
  KEY `fk_registro_dispositivo` (`dispositivo_fichaje_id`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_exitoso` (`exitoso`),
  CONSTRAINT `fk_registro_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_registro_dispositivo` FOREIGN KEY (`dispositivo_fichaje_id`) REFERENCES `dispositivo_fichaje` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE COMUNICADOS Y SANCIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS `comunicado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `tipo` enum('general','urgente','informativo','evento') NOT NULL DEFAULT 'general',
  `estado` enum('borrador','publicado','archivado') NOT NULL DEFAULT 'borrador',
  `fecha_publicacion` datetime DEFAULT NULL,
  `fecha_vencimiento` datetime DEFAULT NULL,
  `usuario_creador_id` int(11) NOT NULL,
  `dirigido_a` enum('todos','estudiantes','padres','profesores','admin') NOT NULL DEFAULT 'todos',
  `curso_division_id` int(11) DEFAULT NULL,
  `archivo_adjunto` varchar(255) DEFAULT NULL,
  `prioridad` enum('baja','media','alta') NOT NULL DEFAULT 'media',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_estado_fecha` (`estado`, `fecha_publicacion`),
  KEY `idx_dirigido_a` (`dirigido_a`),
  KEY `idx_tipo` (`tipo`),
  KEY `fk_comunicado_usuario` (`usuario_creador_id`),
  KEY `fk_comunicado_curso_division` (`curso_division_id`),
  CONSTRAINT `fk_comunicado_usuario` FOREIGN KEY (`usuario_creador_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_comunicado_curso_division` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comunicado_lectura` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comunicado_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_lectura` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `comunicado_usuario_unique` (`comunicado_id`, `usuario_id`),
  KEY `fk_comunicado_lectura_usuario` (`usuario_id`),
  KEY `idx_fecha_lectura` (`fecha_lectura`),
  CONSTRAINT `fk_comunicado_lectura_comunicado` FOREIGN KEY (`comunicado_id`) REFERENCES `comunicado` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comunicado_lectura_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sancion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('amonestacion','suspension','expulsion','advertencia','citacion_padres') NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `gravedad` enum('leve','moderada','grave','muy_grave') NOT NULL,
  `estado` enum('activa','cumplida','anulada','en_proceso') NOT NULL DEFAULT 'activa',
  `fecha_sancion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `dias_suspension` int(11) DEFAULT NULL,
  `usuario_sancionador_id` int(11) NOT NULL,
  `curso_division_id` int(11) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `padres_notificados` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_notificacion_padres` datetime DEFAULT NULL,
  `archivo_adjunto` varchar(255) DEFAULT NULL,
  `medidas_pedagogicas` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_sancion_usuario` (`usuario_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_gravedad` (`gravedad`),
  KEY `idx_fecha_sancion` (`fecha_sancion`),
  KEY `fk_sancion_sancionador` (`usuario_sancionador_id`),
  KEY `fk_sancion_curso_division` (`curso_division_id`),
  CONSTRAINT `fk_sancion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_sancion_sancionador` FOREIGN KEY (`usuario_sancionador_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_sancion_curso_division` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE MENSAJERÍA
-- =====================================================

CREATE TABLE IF NOT EXISTS `grupo_chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('privado','materia','curso','custom') NOT NULL DEFAULT 'custom',
  `avatar` varchar(255) DEFAULT NULL,
  `usuario_creador_id` int(11) NOT NULL,
  `curso_division_materia_id` int(11) DEFAULT NULL,
  `curso_division_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tipo` (`tipo`),
  KEY `fk_grupo_chat_creador` (`usuario_creador_id`),
  KEY `fk_grupo_chat_cdm` (`curso_division_materia_id`),
  KEY `fk_grupo_chat_cd` (`curso_division_id`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_grupo_chat_creador` FOREIGN KEY (`usuario_creador_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_grupo_chat_cdm` FOREIGN KEY (`curso_division_materia_id`) REFERENCES `curso_division_materia` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_grupo_chat_cd` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `grupo_chat_miembro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grupo_chat_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `rol` enum('admin','moderador','miembro') NOT NULL DEFAULT 'miembro',
  `puede_enviar_mensajes` tinyint(1) NOT NULL DEFAULT 1,
  `silenciado_hasta` datetime DEFAULT NULL,
  `fecha_union` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_salida` datetime DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `grupo_usuario_unique` (`grupo_chat_id`, `usuario_id`),
  KEY `fk_grupo_miembro_usuario` (`usuario_id`),
  KEY `idx_activo` (`activo`),
  KEY `idx_rol` (`rol`),
  CONSTRAINT `fk_grupo_miembro_grupo` FOREIGN KEY (`grupo_chat_id`) REFERENCES `grupo_chat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grupo_miembro_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mensaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contenido` text NOT NULL,
  `tipo` enum('texto','imagen','archivo','audio','video') NOT NULL DEFAULT 'texto',
  `usuario_emisor_id` int(11) NOT NULL,
  `usuario_receptor_id` int(11) DEFAULT NULL,
  `grupo_chat_id` int(11) DEFAULT NULL,
  `mensaje_padre_id` int(11) DEFAULT NULL,
  `archivo_url` varchar(500) DEFAULT NULL,
  `archivo_nombre` varchar(255) DEFAULT NULL,
  `archivo_tamano` int(11) DEFAULT NULL,
  `editado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_edicion` datetime DEFAULT NULL,
  `eliminado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_eliminacion` datetime DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_mensaje_emisor` (`usuario_emisor_id`),
  KEY `fk_mensaje_receptor` (`usuario_receptor_id`),
  KEY `fk_mensaje_grupo` (`grupo_chat_id`),
  KEY `fk_mensaje_padre` (`mensaje_padre_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_eliminado` (`eliminado`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `fk_mensaje_emisor` FOREIGN KEY (`usuario_emisor_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_mensaje_receptor` FOREIGN KEY (`usuario_receptor_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mensaje_grupo` FOREIGN KEY (`grupo_chat_id`) REFERENCES `grupo_chat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mensaje_padre` FOREIGN KEY (`mensaje_padre_id`) REFERENCES `mensaje` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mensaje_estado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mensaje_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `entregado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_entrega` datetime DEFAULT NULL,
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_lectura` datetime DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `mensaje_usuario_unique` (`mensaje_id`, `usuario_id`),
  KEY `fk_mensaje_estado_usuario` (`usuario_id`),
  KEY `idx_leido` (`leido`),
  KEY `idx_entregado` (`entregado`),
  CONSTRAINT `fk_mensaje_estado_mensaje` FOREIGN KEY (`mensaje_id`) REFERENCES `mensaje` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mensaje_estado_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE SISTEMA Y LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('info','warning','error','security','audit') NOT NULL DEFAULT 'info',
  `modulo` varchar(50) NOT NULL,
  `accion` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `datos_adicionales` json DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_log_usuario` (`usuario_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_modulo` (`modulo`),
  KEY `idx_fecha` (`fecha_creacion`),
  CONSTRAINT `fk_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `configuracion_sistema` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) NOT NULL,
  `valor` text NOT NULL,
  `tipo` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
  `descripcion` varchar(255) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `editable` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notificacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `datos` json DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `fecha_lectura` datetime DEFAULT NULL,
  `prioridad` enum('baja','normal','alta','urgente') DEFAULT 'normal',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_notificacion_usuario` (`usuario_id`),
  KEY `idx_leida` (`leida`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_prioridad` (`prioridad`),
  KEY `idx_fecha` (`fecha_creacion`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE CALIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS `tipo_evaluacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT 1.00,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `nota` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `curso_division_materia_id` int(11) NOT NULL,
  `tipo_evaluacion_id` int(11) NOT NULL,
  `valor_numerico` decimal(5,2) DEFAULT NULL,
  `valor_concepto` varchar(50) DEFAULT NULL,
  `fecha_evaluacion` date NOT NULL,
  `periodo` int(11) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `profesor_id` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_nota_usuario` (`usuario_id`),
  KEY `fk_nota_cdm` (`curso_division_materia_id`),
  KEY `fk_nota_tipo` (`tipo_evaluacion_id`),
  KEY `fk_nota_profesor` (`profesor_id`),
  KEY `idx_periodo` (`periodo`),
  KEY `idx_fecha_evaluacion` (`fecha_evaluacion`),
  CONSTRAINT `fk_nota_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_nota_cdm` FOREIGN KEY (`curso_division_materia_id`) REFERENCES `curso_division_materia` (`id`),
  CONSTRAINT `fk_nota_tipo` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipo_evaluacion` (`id`),
  CONSTRAINT `fk_nota_profesor` FOREIGN KEY (`profesor_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promedio_alumno` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `curso_division_materia_id` int(11) NOT NULL,
  `periodo` int(11) NOT NULL,
  `promedio` decimal(5,2) NOT NULL,
  `cantidad_notas` int(11) NOT NULL,
  `fecha_calculo` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_materia_periodo` (`usuario_id`, `curso_division_materia_id`, `periodo`),
  KEY `fk_promedio_cdm` (`curso_division_materia_id`),
  CONSTRAINT `fk_promedio_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_promedio_cdm` FOREIGN KEY (`curso_division_materia_id`) REFERENCES `curso_division_materia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar roles básicos
INSERT INTO `rol` (`nombre`, `descripcion`) VALUES
('admin', 'Administrador del sistema'),
('profesor', 'Profesor de la institución'),
('estudiante', 'Estudiante matriculado'),
('padre', 'Padre o tutor de estudiante'),
('preceptor', 'Preceptor de la institución');

-- Insertar configuraciones básicas del sistema
INSERT INTO `configuracion_sistema` (`clave`, `valor`, `tipo`, `descripcion`, `categoria`) VALUES
('institucion_nombre', 'DEOS Education', 'string', 'Nombre de la institución', 'general'),
('institucion_direccion', 'Av. Principal 123', 'string', 'Dirección de la institución', 'general'),
('institucion_telefono', '123-456-7890', 'string', 'Teléfono de contacto', 'general'),
('institucion_email', 'info@deoseducation.edu', 'string', 'Email institucional', 'general'),
('horario_entrada', '08:00', 'string', 'Horario de entrada', 'horarios'),
('horario_salida', '18:00', 'string', 'Horario de salida', 'horarios'),
('tolerancia_entrada_minutos', '15', 'number', 'Minutos de tolerancia para entrada', 'asistencia'),
('tolerancia_salida_minutos', '15', 'number', 'Minutos de tolerancia para salida', 'asistencia'),
('nota_minima_aprobacion', '6', 'number', 'Nota mínima para aprobar', 'calificaciones'),
('porcentaje_asistencia_minimo', '75', 'number', 'Porcentaje mínimo de asistencia', 'asistencia');

-- Insertar tipos de evaluación básicos
INSERT INTO `tipo_evaluacion` (`nombre`, `descripcion`, `peso`) VALUES
('Examen Parcial', 'Evaluación parcial del período', 2.00),
('Examen Final', 'Evaluación final del período', 3.00),
('Trabajo Práctico', 'Trabajo práctico individual o grupal', 1.00),
('Participación', 'Participación en clase', 0.50),
('Tarea', 'Tareas para el hogar', 0.50);

COMMIT;