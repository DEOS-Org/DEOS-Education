-- Agregar columna aula a la tabla horario si no existe
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'horario' AND COLUMN_NAME = 'aula') = 0,
  'ALTER TABLE horario ADD COLUMN aula VARCHAR(50) DEFAULT "Sin asignar"',
  'SELECT "Column aula already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla asistencia si no existe
CREATE TABLE IF NOT EXISTS asistencia (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_division_materia_id INT NOT NULL,
  fecha DATE NOT NULL,
  estado ENUM('presente', 'ausente', 'tardanza', 'justificado') NOT NULL DEFAULT 'ausente',
  observaciones TEXT,
  hora_entrada TIME,
  hora_salida TIME,
  hora_entrada_almuerzo TIME,
  hora_salida_almuerzo TIME,
  calculado_automaticamente BOOLEAN DEFAULT TRUE,
  profesor_usuario_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario_fecha (usuario_id, fecha),
  INDEX idx_curso_division_materia (curso_division_materia_id),
  UNIQUE KEY unique_attendance (usuario_id, curso_division_materia_id, fecha)
);

-- Agregar foreign keys a asistencia si no existen
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'asistencia' AND CONSTRAINT_NAME = 'fk_asistencia_usuario') = 0,
  'ALTER TABLE asistencia ADD CONSTRAINT fk_asistencia_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE',
  'SELECT "FK asistencia_usuario already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'asistencia' AND CONSTRAINT_NAME = 'fk_asistencia_curso_division_materia') = 0,
  'ALTER TABLE asistencia ADD CONSTRAINT fk_asistencia_curso_division_materia FOREIGN KEY (curso_division_materia_id) REFERENCES curso_division_materia(id) ON DELETE CASCADE',
  'SELECT "FK asistencia_curso_division_materia already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla calificacion si no existe
CREATE TABLE IF NOT EXISTS calificacion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_division_materia_id INT NOT NULL,
  tipo_evaluacion ENUM('examen', 'tarea', 'proyecto', 'participacion', 'quiz', 'exposicion') NOT NULL,
  descripcion TEXT NOT NULL,
  calificacion DECIMAL(5,2) NOT NULL,
  calificacion_maxima DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  fecha_evaluacion DATE NOT NULL,
  fecha_entrega DATE,
  observaciones TEXT,
  profesor_usuario_id INT NOT NULL,
  trimestre INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario_calificacion (usuario_id),
  INDEX idx_profesor_calificacion (profesor_usuario_id),
  INDEX idx_curso_division_materia_calificacion (curso_division_materia_id)
);

-- Agregar foreign keys a calificacion si no existen
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'calificacion' AND CONSTRAINT_NAME = 'fk_calificacion_usuario') = 0,
  'ALTER TABLE calificacion ADD CONSTRAINT fk_calificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE',
  'SELECT "FK calificacion_usuario already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'calificacion' AND CONSTRAINT_NAME = 'fk_calificacion_curso_division_materia') = 0,
  'ALTER TABLE calificacion ADD CONSTRAINT fk_calificacion_curso_division_materia FOREIGN KEY (curso_division_materia_id) REFERENCES curso_division_materia(id) ON DELETE CASCADE',
  'SELECT "FK calificacion_curso_division_materia already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'calificacion' AND CONSTRAINT_NAME = 'fk_calificacion_profesor') = 0,
  'ALTER TABLE calificacion ADD CONSTRAINT fk_calificacion_profesor FOREIGN KEY (profesor_usuario_id) REFERENCES usuario(id) ON DELETE CASCADE',
  'SELECT "FK calificacion_profesor already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna profesor_usuario_id a curso_division_materia si no existe
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'curso_division_materia' AND COLUMN_NAME = 'profesor_usuario_id') = 0,
  'ALTER TABLE curso_division_materia ADD COLUMN profesor_usuario_id INT',
  'SELECT "Column profesor_usuario_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar foreign key a curso_division_materia si no existe
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'curso_division_materia' AND CONSTRAINT_NAME = 'fk_profesor_curso_division_materia') = 0,
  'ALTER TABLE curso_division_materia ADD CONSTRAINT fk_profesor_curso_division_materia FOREIGN KEY (profesor_usuario_id) REFERENCES usuario(id) ON DELETE SET NULL',
  'SELECT "FK profesor_curso_division_materia already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla profesor_materia si no existe
CREATE TABLE IF NOT EXISTS profesor_materia (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  materia_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_profesor_materia (usuario_id, materia_id)
);

-- Agregar foreign keys a profesor_materia si no existen
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'profesor_materia' AND CONSTRAINT_NAME = 'fk_profesor_materia_usuario') = 0,
  'ALTER TABLE profesor_materia ADD CONSTRAINT fk_profesor_materia_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE',
  'SELECT "FK profesor_materia_usuario already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'profesor_materia' AND CONSTRAINT_NAME = 'fk_profesor_materia_materia') = 0,
  'ALTER TABLE profesor_materia ADD CONSTRAINT fk_profesor_materia_materia FOREIGN KEY (materia_id) REFERENCES materia(id) ON DELETE CASCADE',
  'SELECT "FK profesor_materia_materia already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla usuario_curso si no existe
CREATE TABLE IF NOT EXISTS usuario_curso (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_division_id INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_usuario_curso (usuario_id, curso_division_id)
);

-- Agregar foreign keys a usuario_curso si no existen
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'usuario_curso' AND CONSTRAINT_NAME = 'fk_usuario_curso_usuario') = 0,
  'ALTER TABLE usuario_curso ADD CONSTRAINT fk_usuario_curso_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE',
  'SELECT "FK usuario_curso_usuario already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'biometrico' AND TABLE_NAME = 'usuario_curso' AND CONSTRAINT_NAME = 'fk_usuario_curso_division') = 0,
  'ALTER TABLE usuario_curso ADD CONSTRAINT fk_usuario_curso_division FOREIGN KEY (curso_division_id) REFERENCES curso_division(id) ON DELETE CASCADE',
  'SELECT "FK usuario_curso_division already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;