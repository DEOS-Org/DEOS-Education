-- Adminer Style Dump for BioFirma v4 Schema with Combined Data

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

-- Asegurarse de que el usuario root tenga todos los privilegios
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS biometrico;

-- Crear el usuario biofirma y darle permisos
DROP USER IF EXISTS 'biofirma'@'%';
CREATE USER 'biofirma'@'%' IDENTIFIED BY 'biofirma';
GRANT ALL PRIVILEGES ON biometrico.* TO 'biofirma'@'%';
FLUSH PRIVILEGES;

USE biometrico;

-- Crear las tablas necesarias
CREATE TABLE IF NOT EXISTS rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(15) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar roles básicos
INSERT IGNORE INTO rol (nombre) VALUES 
('admin'),
('profesor'),
('alumno'),
('padre'),
('preceptor');

-- Insertar un usuario administrador por defecto
INSERT IGNORE INTO usuario (dni, nombre, apellido, email, contraseña, activo) 
VALUES ('00000000', 'Admin', 'Sistema', 'admin@biofirma.com', '$2b$10$YourHashedPasswordHere', true);

--
-- Table structure for table `usuario`
--
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dni` varchar(15) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contraseña` varchar(255) DEFAULT NULL COMMENT 'Se almacenará hasheada',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el usuario está activo',
  `created_at` datetime DEFAULT NULL COMMENT 'Gestionado por el backend',
  `updated_at` datetime DEFAULT NULL COMMENT 'Gestionado por el backend',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `usuario` from your original script
INSERT INTO `usuario` (`id`, `dni`, `nombre`, `apellido`, `email`, `contraseña`, `activo`, `created_at`, `updated_at`) VALUES
(1, '47727235', 'Valentin', 'Acieff', 'a.acieff@alumno.etec.um.edu.ar', '$2a$12$dummyHashVA', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(2, '47531504', 'Pablo Benjamin', 'Carreras', 'p.carreras@alumno.etec.um.edu.ar', '$2a$12$dummyHashPC', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(3, '47610427', 'Maximiliano Martin', 'Castro Corradi', 'mc.castro@alumno.etec.um.edu.ar',  '$2a$12$dummyHashMC', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(4, '48038589', 'Benicio',  'Corro',  'b.corro@alumno.etec.um.edu.ar',  '$2a$12$dummyHashBC', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(5, '47531005', 'Lucas Emilio', 'Cruceño Fratti', 'l.cruseno@alumno.etec.um.edu.ar',  '$2a$12$dummyHashLCF', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(6, '47966018', 'Ulises', 'Dalmau Abad',  'u.dalmau@alumno.etec.um.edu.ar', '$2a$12$dummyHashUD', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(7, '47874238', 'Matias Federico',  'Diaz Corvalan',  'mfc.diaz@alumno.etec.um.edu.ar', '$2a$12$dummyHashMDC', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(8, '47529260', 'Lander', 'Echavarria', 'l.echavarria@alummo.etec.um.edu.ar', '$2a$12$dummyHashLE', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(9, '47447715', 'Bruno',  'Emili',  'b.emili@alumno.etec.um.edu.ar',  '$2a$12$dummyHashBE', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(10, '47811164', 'Naiara Belen', 'Errecalde',  'n.errecalde@alumno.etec.um.edu.ar',  '$2a$12$dummyHashNE', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(11, '47966065', 'Tomás Alejandro',  'Fuentes Barraquero', 't.fuente@alummo.etec.um.edu.ar', '$2a$12$dummyHashTFB', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(12, '47811476', 'Iñaki',  'Gongora Rosi', 'i.gongora@alumno.etec.um.edu.ar',  '$2a$12$dummyHashIGR', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(13, '47811194', 'Facundo',  'Gonzalez Pelaitai',  'fp.gonzalez@alumno.etec.um.edu.ar',  '$2a$12$S/jfdYtcgclZ2l.7z1wyTuIGN8/aWKOrTtsZ51HeiWU1j2rQ6E6kS', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(14, '47809973', 'Facundo Mariano',  'Llamas', 'f.llamas@alumno.etec.um.edu.ar', '$2a$12$dummyHashFLL', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(15, '47808695', 'Ignacio Sebastián',  'Maldonado',  'i.maldonado@alumno.etec.um.edu.ar',  '$2a$12$dummyHashIM', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(16, '48076506', 'Lucio',  'Manitta Mazzaresi',  'lm.manitta@alumno.etec.um.edu.ar', '$2a$12$dummyHashLMM', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(17, '47611730', 'Santiago', 'Marthi', 's.marthi@alumno.etec.um.edu.ar', '$2a$12$dummyHashSM', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(18, '47725886', 'Matias Nicolas', 'Paez Delgadillo',  'mn.paez@alumno.etec.um.edu.ar',  '$2a$12$dummyHashMPD', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(19, '47529283', 'Federico', 'Pagano Guiñazú', 'fg.pagano@alumno.etec.um.edu.ar',  '$2a$12$dummyHashFPG', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(20, '47726037', 'Lucas Alejandro',  'Rada Lizarraga', 'l.rada@alumno.etec.um.edu.ar', '$2a$12$dummyHashLRL', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(21, '47532232', 'Juan Martín',  'Romito Nazar', 'j.romito@alumno.etec.um.edu.ar', '$2a$12$dummyHashJRN', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(22, '47811247', 'Santino',  'Sabatini Cialone', 'sc.sabatini@alumno.etec.um.edu.ar',  '$2a$12$dummyHashSSC', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(23, '47373027', 'Ivo',  'Schugurensky', 'i.schugurensky@alumno.etec.um.edu.ar', '$2a$12$dummyHashIS', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(24, '47967442', 'Emilio', 'Varaschin',  'e.varaschin@alumno.etec.um.edu.ar',  '$2a$12$dummyHashEV', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(25, '47532442', 'Amparo Maria', 'Appiolaza Carabal',  'a.appiolaza@alumno.etec.um.edu.ar',  '$2a$12$dummyHashAAC', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(26, '47611777', 'Lucas',  'Brusotti Velasco', 'l.brusotti@alumno.etec.um.edu.ar', '$2a$12$dummyHashLBV', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(27, '47529800', 'Victoria Elisa', 'Castillo Lagazzi', 've.castillo@alumno.etec.um.edu.ar',  '$2a$12$dummyHashVCL', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(28, '48050669', 'Nicolas Mateo',  'Castro Reale', 'mn.castro@alumno.etec.um.edu.ar',  '$2a$12$dummyHashNCR', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(29, '47613237', 'Francisco',  'Derka Payeres',  'f.derka@alumno.etec.um.edu.ar',  '$2a$12$dummyHashFDP', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(30, '48051568', 'Mauricio Andres',  'Duca Garritano', 'm.duca@alumno.etec.um.edu.ar', '$2a$12$dummyHashMDG', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(31, '47268993', 'Ignacio',  'Funes Ivulich',  'ii.funes@alumno.etec.um.edu.ar', '$2a$12$dummyHashIFI', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(32, '47300466', 'Lucia Anabella', 'Garrido',  'l.garrido@alumno.etec.um.edu.ar',  '$2a$12$dummyHashLAG', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(33, '47573490', 'Noha Ezequiel',  'Guerrero', 'ne.guerrero@alumno.etec.um.edu.ar',  '$2a$12$dummyHashNEG', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(34, '48050693', 'Manuel', 'Juñent Allegrini', 'm.junent@alumno.etec.um.edu.ar', '$2a$12$dummyHashMJA', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(35, '47602482', 'Mariano',  'Lopez Fara', 'mafa.lopez@alummo.etec.um.edu.ar', '$2a$12$dummyHashMLF', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(36, '47532417', 'Lautaro',  'Malisani', 'l.malisani@alumno.etec.um.edu.ar', '$2a$12$dummyHashLM', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(37, '47969046', 'Sebastian',  'Manno Velez',  's.manno@alumno.etec.um.edu.ar',  '$2a$12$dummyHashSMV', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(38, '47532409', 'Facundo',  'Ortiz',  'fh.ortiz@alumno.etec.um.edu.ar', '$2a$12$dummyHashFO', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(39, '47448084', 'María Pilar',  'Perez Pasten', 'mp.perez@alumno.etec.um.edu.ar', '$2a$12$dummyHashMPP', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(40, '51701752', 'Martin', 'Rubio Dussel', 'md.rubio@alumno.etec.um.edu.ar', '$2a$12$dummyHashMRD', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(41, '47610440', 'Angel Agustin',  'Vega', 'ana.vega@alumno.etec.um.edu.ar', '$2a$12$dummyHashAAV', 1,  '2025-06-02 13:38:34',  '2025-06-02 13:38:34'),
(42, 'P-1',  'Hector', 'Correa', 'hector.correa@etec.um.edu.ar', '$2a$12$dummyHashHC', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(43, 'P-2',  'Daniel', 'Quinteros',  'daniel.quinteros@etec.um.edu.ar',  '$2a$12$dummyHashDQ', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(44, 'P-3',  'Raul', 'Vargas', 'raul.vargas@etec.um.edu.ar', '$2a$12$dummyHashRV', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(45, 'P-4',  'Guillermo',  'César Sanchez',  'guillermo.sanchez@etec.um.edu.ar', '$2a$12$dummyHashGCS', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(46, 'P-5',  'Alejandro',  'Marchena', 'alejandro.marchena@etec.um.edu.ar',  '$2a$12$dummyHashAM', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(47, 'P-6',  'Ceferino', 'Mulet',  'ceferino.mulet@etec.um.edu.ar',  '$2a$12$dummyHashCM', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(48, 'P-7',  'Gabriela', 'Millares', 'gabriela.millares@etec.um.edu.ar', '$2a$12$dummyHashGM', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(49, 'P-8',  'Paula Carina', 'Marañon',  'paula.maranon@etec.um.edu.ar', '$2a$12$dummyHashPCM', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(50, 'P-9',  'Matias', 'Albornoz', 'matias.albornoz@etec.um.edu.ar', '$2a$12$dummyHashMA', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(51, 'P-10', 'Carla',  'Fabretti', 'carla.fabbretti@etec.um.edu.ar', '$2a$12$dummyHashCF', 1,  '2025-06-02 14:28:29',  '2025-06-02 14:28:29'),
(52, '00000001', 'Admin',  'BioFirma', 'admin@biofirma.com', '$2a$12$QEF53y8ORlwRnKpKNdFYxun.dgXbRJuZusUbwCg6.iERe34mCk0US', 1,  '2025-06-03 13:38:07',  '2025-06-03 13:38:07'),
(53, '12345678', 'Test', 'User', 'test.user@alumno.etec.um.edu.ar',  '$2b$12$oiYQwXTDMrK.Ed3QEm/f5.mfdQ9q7P566XnnMgyutKSPF43cmXTgm', 1,  '2025-06-03 13:43:43',  '2025-06-03 13:43:43'),
(54, 'PADRE-1', 'Juan', 'Perez', 'juan.perez@email.com', '$2a$12$dummyHashPadre1', 1, NOW(), NOW()); -- Usuario Padre de ejemplo

--
-- Table structure for table `rol`
--
DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL COMMENT 'admin, preceptor, alumno, directivo, profesor, padre',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `rol` (`id`, `nombre`) VALUES
(1, 'admin'),
(2, 'preceptor'),
(3, 'alumno'),
(4, 'directivo'),
(5, 'profesor'),
(6, 'padre'); -- Nuevo rol

--
-- Table structure for table `usuario_rol`
--
DROP TABLE IF EXISTS `usuario_rol`;
CREATE TABLE `usuario_rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `rol_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_usuario_rol_unique` (`usuario_id`,`rol_id`),
  KEY `fk_usuario_rol_rol_id` (`rol_id`),
  CONSTRAINT `fk_usuario_rol_rol_id` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario_rol_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for `usuario_rol` from your original script (adaptado)
INSERT INTO `usuario_rol` (`id`, `usuario_id`, `rol_id`) VALUES
(1, 1,  3), (2, 2,  3), (3, 3,  3), (4, 4,  3), (5, 5,  3), (6, 6,  3), (7, 7,  3), (8, 8,  3), (9, 9,  3), (10, 10, 3),
(11, 11, 3), (12, 12, 3), (13, 13, 1), -- Facundo Gonzalez Pelaitai es admin
(14, 14, 3), (15, 15, 3), (16, 16, 3), (17, 17, 3), (18, 18, 3), (19, 19, 3), (20, 20, 3),
(21, 21, 3), (22, 22, 3), (23, 23, 3), (24, 24, 3), (25, 25, 3), (26, 26, 3), (27, 27, 3), (28, 28, 3), (29, 29, 3), (30, 30, 3),
(31, 31, 3), (32, 32, 3), (33, 33, 3), (34, 34, 3), (35, 35, 3), (36, 36, 3), (37, 37, 3), (38, 38, 3), (39, 39, 3), (40, 40, 3),
(41, 41, 3), (42, 42, 5), (43, 43, 5), (44, 44, 5), (45, 45, 2), (46, 46, 5), (47, 47, 5), (48, 48, 5), (49, 49, 4), (50, 50, 5),
(51, 51, 5), -- Corregido: Usuario 51 (Carla Fabretti) es profesor
(52, 52, 1), -- Admin BioFirma es admin
(53, 53, 3), -- Test User es alumno
(54, 54, 6); -- Juan Perez es padre

--
-- Table structure for table `alumno_padre`
--
DROP TABLE IF EXISTS `alumno_padre`;
CREATE TABLE `alumno_padre` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumno_usuario_id` int(11) NOT NULL COMMENT 'Usuario con rol alumno',
  `padre_usuario_id` int(11) NOT NULL COMMENT 'Usuario con rol padre',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_alumno_padre_unique` (`alumno_usuario_id`,`padre_usuario_id`),
  KEY `fk_alumno_padre_padre_id` (`padre_usuario_id`),
  CONSTRAINT `fk_alumno_padre_alumno_id` FOREIGN KEY (`alumno_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alumno_padre_padre_id` FOREIGN KEY (`padre_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Vincula a un alumno con su padre/tutor para control de acceso a información.';

-- Example Data for `alumno_padre`
INSERT INTO `alumno_padre` (`alumno_usuario_id`, `padre_usuario_id`) VALUES
(1, 54); -- Valentin Acieff (alumno id 1) es hijo de Juan Perez (padre id 54)

--
-- Table structure for table `curso`
--
DROP TABLE IF EXISTS `curso`;
CREATE TABLE `curso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `año` int(11) NOT NULL COMMENT 'Ej: 5 (1 a 6)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `curso` (`id`, `año`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6);

--
-- Table structure for table `division`
--
DROP TABLE IF EXISTS `division`;
CREATE TABLE `division` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `division` varchar(50) NOT NULL COMMENT 'Ej: A, B, Informática, Electrónica',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `division` (`id`, `division`) VALUES
(1, 'A'),
(2, 'B'),
(3, 'Informática'),
(4, 'Electrónica');

--
-- Table structure for table `curso_division`
--
DROP TABLE IF EXISTS `curso_division`;
CREATE TABLE `curso_division` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `nombre_legible` varchar(100) DEFAULT NULL COMMENT 'Ej: 5to Informática. Generado/gestionado por el backend.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_curso_division_unique` (`curso_id`,`division_id`),
  KEY `fk_curso_division_division_id` (`division_id`),
  CONSTRAINT `fk_curso_division_curso_id` FOREIGN KEY (`curso_id`) REFERENCES `curso` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_curso_division_division_id` FOREIGN KEY (`division_id`) REFERENCES `division` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `curso_division` (`id`, `curso_id`, `division_id`, `nombre_legible`) VALUES
(1, 1,  1, '1ro A'),
(2, 1,  2, '1ro B'),
(3, 2,  1, '2do A'),
(4, 2,  2, '2do B'),
(5, 3,  3, '3ro Informática'),
(6, 3,  4, '3ro Electrónica'),
(7, 4,  3, '4to Informática'),
(8, 4,  4, '4to Electrónica'),
(9, 5,  3, '5to Informática'),
(10, 5,  4, '5to Electrónica'),
(11, 6,  3, '6to Informática'),
(12, 6,  4, '6to Electrónica');

--
-- Table structure for table `usuario_curso`
--
DROP TABLE IF EXISTS `usuario_curso`;
CREATE TABLE `usuario_curso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL COMMENT 'Principalmente alumnos',
  `curso_division_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_usuario_curso_unique` (`usuario_id`,`curso_division_id`) COMMENT 'Un usuario solo una vez en el mismo curso/división activo',
  KEY `fk_usuario_curso_cd_id` (`curso_division_id`),
  CONSTRAINT `fk_usuario_curso_cd_id` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario_curso_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Considerar lógica de backend para que un alumno esté en un solo curso_division activo a la vez.';

-- Data for `usuario_curso` from your original script
INSERT INTO `usuario_curso` (`id`, `usuario_id`, `curso_division_id`) VALUES
(1, 1,  11), (2, 2,  11), (3, 3,  11), (4, 4,  11), (5, 5,  11), (6, 6,  11), (7, 7,  11), (8, 8,  11), (9, 9,  11), (10, 10, 11),
(11, 11, 11), (12, 12, 11), (13, 13, 11), (14, 14, 11), (15, 15, 11), (16, 16, 11), (17, 17, 11), (18, 18, 11), (19, 19, 11), (20, 20, 11),
(21, 21, 11), (22, 22, 11), (23, 23, 11), (24, 24, 11), (25, 25, 12), (26, 26, 12), (27, 27, 12), (28, 28, 12), (29, 29, 12), (30, 30, 12),
(31, 31, 12), (32, 32, 12), (33, 33, 12), (34, 34, 12), (35, 35, 12), (36, 36, 12), (37, 37, 12), (38, 38, 12), (39, 39, 12), (40, 40, 12),
(41, 41, 12);

--
-- Table structure for table `materia`
--
DROP TABLE IF EXISTS `materia`;
CREATE TABLE `materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `carga_horaria` int(11) DEFAULT NULL COMMENT 'Horas semanales estimadas. Para referencia o validación.',
  `carga_horaria_minutos` int(11) GENERATED ALWAYS AS (`carga_horaria` * 40) STORED COMMENT 'Campo generado como en tu script original',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `materia` (`id`, `nombre`, `carga_horaria`) VALUES
(1, 'Comunicacion de Datos',  4),
(2, 'Lab de Software',  5),
(3, 'Lab de Redes 2', 5),
(4, 'Ed Fisica',  2),
(5, 'Programacion 4', 6),
(6, 'Seguridad Informatica',  4),
(7, 'Proyecto Integrador',  5),
(8, 'Etica y Legislacion Laboral',  4),
(9, 'Formacion y Evaluacion de Proyectos',  4),
(10,  'Practicas Profesionalizantes', 3),
(11,  'Orientacion y Tutoria',  2),
(12, 'Matemática 1ro', 5),
(13, 'Lengua 1ro', 5);

--
-- Table structure for table `curso_division_materia`
--
DROP TABLE IF EXISTS `curso_division_materia`;
CREATE TABLE `curso_division_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_division_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cdm_unique` (`curso_division_id`,`materia_id`),
  KEY `fk_cdm_materia_id` (`materia_id`),
  CONSTRAINT `fk_cdm_cd_id` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cdm_materia_id` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Define qué materias se dictan en cada curso y división.';

-- Data for `curso_division_materia` from your original script
INSERT INTO `curso_division_materia` (`id`, `materia_id`, `curso_division_id`) VALUES
(1, 1,  11),
(2, 2,  11),
(3, 3,  11),
(4, 4,  11),
(5, 5,  11),
(6, 6,  11),
(7, 7,  11),
(8, 8,  11),
(9, 9,  11),
(10, 10, 11),
(11, 11, 11);
-- Additional example data for new structure
INSERT INTO `curso_division_materia` (`curso_division_id`, `materia_id`) VALUES (1, 12), (1, 13);


--
-- Table structure for table `profesor_materia`
--
DROP TABLE IF EXISTS `profesor_materia`;
CREATE TABLE `profesor_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL COMMENT 'Usuario con rol profesor',
  `materia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_profesor_materia_unique` (`usuario_id`,`materia_id`),
  KEY `fk_pm_materia_id` (`materia_id`),
  CONSTRAINT `fk_pm_materia_id` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pm_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Define qué materias está habilitado para enseñar un profesor.';

-- Data for `profesor_materia` from your original script
INSERT INTO `profesor_materia` (`id`, `usuario_id`, `materia_id`) VALUES
(1, 42, 1),
(2, 43, 2),
(3, 43, 7),
(4, 44, 3),
(5, 45, 4), -- User 45 (Guillermo Sanchez) es preceptor, ¿puede dar Ed Fisica? Asumiendo que sí para mantener datos.
(6, 46, 5),
(7, 47, 6),
(8, 48, 8),
(9, 49, 10), -- User 49 (Paula Marañon) es directivo, ¿puede dar Prácticas? Asumiendo que sí.
(10, 50, 9),
(11, 51, 11);

--
-- Table structure for table `huella`
--
DROP TABLE IF EXISTS `huella`;
CREATE TABLE `huella` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `sensor_id` int(11) DEFAULT NULL COMMENT 'ID (0-127) asignado por el sensor AS608 a esta huella en el momento del enrolamiento. NO es único globalmente si hay varios sensores o se reutilizan slots.',
  `template` text NOT NULL COMMENT 'Huella codificada (base64 o string binario)',
  `fecha_registro` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_huella_usuario_id_unique` (`usuario_id`),
  CONSTRAINT `fk_huella_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Example Data for `huella` (sensor_id no es UNIQUE)
INSERT INTO `huella` (`usuario_id`, `sensor_id`, `template`, `fecha_registro`) VALUES
(1, 5, 'template_base64_valentin_acieff', NOW()),
(2, 10, 'template_base64_pablo_carreras', NOW()),
(13, 5, 'template_base64_facundo_gonzalez', NOW()); -- Mismo sensor_id que usuario 1, pero diferente usuario_id (permitido)

--
-- Table structure for table `dispositivo_fichaje`
--
DROP TABLE IF EXISTS `dispositivo_fichaje`;
CREATE TABLE `dispositivo_fichaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identificador_unico` varchar(100) NOT NULL COMMENT 'Ej: ESP32_PUERTA_PRINCIPAL',
  `descripcion` varchar(255) DEFAULT NULL,
  `ubicacion` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identificador_unico` (`identificador_unico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `dispositivo_fichaje` (`id`, `identificador_unico`, `descripcion`, `ubicacion`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'ESP32_ENTRADA_PRINCIPAL', 'Lector de huellas en puerta principal', 'Entrada Colegio', 1, NOW(), NOW()),
(2, 'ESP32_LAB_INFORMATICA', 'Lector de huellas en laboratorio de informática', 'Laboratorio 1', 1, NOW(), NOW());

--
-- Table structure for table `registro`
--
DROP TABLE IF EXISTS `registro`;
CREATE TABLE `registro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL COMMENT 'Indica si es un ingreso o salida de la escuela',
  `fecha` datetime NOT NULL,
  `dispositivo_fichaje_id` int(11) DEFAULT NULL COMMENT 'Referencia al dispositivo que originó el registro',
  `origen_manual` varchar(100) DEFAULT NULL COMMENT 'Para casos donde no hay dispositivo o es un registro manual (si se decide permitir)',
  PRIMARY KEY (`id`),
  KEY `fk_registro_usuario_id` (`usuario_id`),
  KEY `fk_registro_dispositivo_id` (`dispositivo_fichaje_id`),
  CONSTRAINT `fk_registro_dispositivo_id` FOREIGN KEY (`dispositivo_fichaje_id`) REFERENCES `dispositivo_fichaje` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_registro_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `registro` (`usuario_id`, `tipo`, `fecha`, `dispositivo_fichaje_id`) VALUES
(1, 'ingreso', '2025-06-03 07:55:00', 1),
(1, 'egreso', '2025-06-03 13:30:00', 1),
(2, 'ingreso', '2025-06-03 07:58:00', 1);

--
-- Table structure for table `horario`
--
DROP TABLE IF EXISTS `horario`;
CREATE TABLE `horario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso_division_id` int(11) NOT NULL COMMENT 'A qué curso/división pertenece este bloque horario',
  `dia` enum('Lunes','Martes','Miércoles','Jueves','Viernes') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `curso_division_materia_id` int(11) NOT NULL COMMENT 'Qué materia específica de ese curso/división se dicta',
  `profesor_usuario_id` int(11) NOT NULL COMMENT 'Qué profesor (usuario con rol profesor) está a cargo',
  PRIMARY KEY (`id`),
  KEY `fk_horario_cd_id` (`curso_division_id`),
  KEY `fk_horario_cdm_id` (`curso_division_materia_id`),
  KEY `fk_horario_profesor_id` (`profesor_usuario_id`),
  CONSTRAINT `fk_horario_cd_id` FOREIGN KEY (`curso_division_id`) REFERENCES `curso_division` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_horario_cdm_id` FOREIGN KEY (`curso_division_materia_id`) REFERENCES `curso_division_materia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_horario_profesor_id` FOREIGN KEY (`profesor_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `idx_horario_curso_dia_inicio_materia` (`curso_division_id`,`dia`,`hora_inicio`,`curso_division_materia_id`),
  UNIQUE KEY `idx_horario_profesor_dia_inicio` (`profesor_usuario_id`,`dia`,`hora_inicio`) COMMENT 'Un profesor no puede estar en dos clases a la misma hora de inicio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Define un bloque de clase específico: qué materia da qué profesor, en qué curso/división, día y hora.';

-- Example Data for `horario`
-- Asumiendo que curso_division_id 11 es 6to Informática (id de curso_division)
-- Asumiendo que curso_division_materia_id 1 (id de curso_division_materia) corresponde a (cd_id 11, materia_id 1 [Comunicacion de Datos])
-- Asumiendo que profesor_usuario_id 42 es Hector Correa
INSERT INTO `horario` (`curso_division_id`, `dia`, `hora_inicio`, `hora_fin`, `curso_division_materia_id`, `profesor_usuario_id`) VALUES
(11, 'Lunes', '08:00:00', '09:20:00', 1, 42), -- 6to Info, Lunes 8:00-9:20, Com. Datos (cdm_id 1), Prof. Correa (user_id 42)
(11, 'Lunes', '09:30:00', '10:50:00', 2, 43); -- 6to Info, Lunes 9:30-10:50, Lab Software (cdm_id 2), Prof. Quinteros (user_id 43)

--
-- Table structure for table `log`
--
DROP TABLE IF EXISTS `log`;
CREATE TABLE `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL COMMENT 'Usuario que originó la acción o fue afectado. Puede ser NULL para eventos del sistema.',
  `tipo` enum('error','configuracion','seguridad','conexion','autenticacion','auditoria','otro') NOT NULL,
  `descripcion` text NOT NULL COMMENT 'Descripción detallada del evento',
  `origen` varchar(100) DEFAULT NULL COMMENT 'Ej: API_USUARIOS, ESP32_AULA4, PANEL_ADMIN, SISTEMA',
  `fecha` datetime NOT NULL,
  `ip_origen` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_log_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_log_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `log` (`usuario_id`, `tipo`, `descripcion`, `origen`, `fecha`, `ip_origen`) VALUES
(52, 'autenticacion', 'Login exitoso del usuario admin', 'API_LOGIN', NOW(), '192.168.1.100'),
(NULL, 'error', 'Fallo al conectar con sensor biométrico X', 'SISTEMA_BIOMETRICO', NOW(), NULL);

SET foreign_key_checks = 1;

-- Asegurarse de que el usuario tenga todos los privilegios necesarios
GRANT ALL PRIVILEGES ON biometrico.* TO 'biofirma'@'%';
FLUSH PRIVILEGES;
