-- Agregar columna aula a la tabla horario si no existe
ALTER TABLE horario ADD COLUMN IF NOT EXISTS aula VARCHAR(50) DEFAULT 'Sin asignar';

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
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_division_materia_id) REFERENCES curso_division_materia(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_usuario_id) REFERENCES usuario(id) ON DELETE SET NULL,
  UNIQUE KEY unique_attendance (usuario_id, curso_division_materia_id, fecha)
);

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
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_division_materia_id) REFERENCES curso_division_materia(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Agregar columna profesor_usuario_id a curso_division_materia si no existe
ALTER TABLE curso_division_materia ADD COLUMN IF NOT EXISTS profesor_usuario_id INT;
ALTER TABLE curso_division_materia ADD CONSTRAINT IF NOT EXISTS fk_profesor_curso_division_materia 
  FOREIGN KEY (profesor_usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

-- Verificar que la tabla profesor_materia existe
CREATE TABLE IF NOT EXISTS profesor_materia (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  materia_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materia(id) ON DELETE CASCADE,
  UNIQUE KEY unique_profesor_materia (usuario_id, materia_id)
);

-- Verificar que la tabla usuario_curso existe
CREATE TABLE IF NOT EXISTS usuario_curso (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  curso_division_id INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_division_id) REFERENCES curso_division(id) ON DELETE CASCADE,
  UNIQUE KEY unique_usuario_curso (usuario_id, curso_division_id)
);