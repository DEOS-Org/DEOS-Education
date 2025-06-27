-- =============================================
-- DEBUG SCRIPT FOR PROFESSOR PORTAL ISSUES
-- =============================================
-- This script diagnoses and fixes the professor portal showing 0 data
-- Run each section step by step to identify and resolve issues

-- =============================================
-- SECTION 1: DIAGNOSTIC QUERIES
-- =============================================

-- 1.1 Check if user ID 68 (f@p.com) exists and has professor role
SELECT 
    u.id, 
    u.email, 
    u.nombre, 
    u.apellido, 
    u.activo,
    GROUP_CONCAT(r.nombre SEPARATOR ', ') as roles
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
WHERE u.email = 'f@p.com' OR u.id = 68
GROUP BY u.id;

-- 1.2 Check profesor_materia table - assignments for user ID 68
SELECT 
    pm.id,
    pm.usuario_id,
    pm.materia_id,
    u.email,
    u.nombre as profesor_nombre,
    m.nombre as materia_nombre
FROM profesor_materia pm
JOIN usuario u ON pm.usuario_id = u.id
JOIN materia m ON pm.materia_id = m.id
WHERE pm.usuario_id = 68;

-- 1.3 Check curso_division_materia table - course-division-subject relationships
SELECT 
    cdm.id,
    cdm.curso_division_id,
    cdm.materia_id,
    c.año as curso,
    d.division,
    m.nombre as materia
FROM curso_division_materia cdm
JOIN curso_division cd ON cdm.curso_division_id = cd.id
JOIN curso c ON cd.curso_id = c.id
JOIN division d ON cd.division_id = d.id
JOIN materia m ON cdm.materia_id = m.id
ORDER BY c.año, d.division, m.nombre;

-- 1.4 Check the full query that getProfessorClasses is running
SELECT DISTINCT
    cdm.id,
    m.id as materia_id,
    m.nombre as materia,
    cd.id as curso_division_id,
    CONCAT(c.año, '° ', d.division) as division,
    c.año as curso,
    d.division as division_nombre,
    COUNT(DISTINCT uc.usuario_id) as students,
    m.carga_horaria as horas_semana
FROM profesor_materia pm
JOIN materia m ON pm.materia_id = m.id
JOIN curso_division_materia cdm ON m.id = cdm.materia_id
JOIN curso_division cd ON cdm.curso_division_id = cd.id
JOIN curso c ON cd.curso_id = c.id
JOIN division d ON cd.division_id = d.id
LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
WHERE pm.usuario_id = 68
GROUP BY cdm.id, m.id, cd.id, c.año, d.division
ORDER BY c.año, d.division, m.nombre;

-- 1.5 Check if tables have any data at all
SELECT 'usuario' as tabla, COUNT(*) as total FROM usuario
UNION ALL
SELECT 'rol' as tabla, COUNT(*) as total FROM rol
UNION ALL
SELECT 'usuario_rol' as tabla, COUNT(*) as total FROM usuario_rol
UNION ALL
SELECT 'materia' as tabla, COUNT(*) as total FROM materia
UNION ALL
SELECT 'curso' as tabla, COUNT(*) as total FROM curso
UNION ALL
SELECT 'division' as tabla, COUNT(*) as total FROM division
UNION ALL
SELECT 'curso_division' as tabla, COUNT(*) as total FROM curso_division
UNION ALL
SELECT 'curso_division_materia' as tabla, COUNT(*) as total FROM curso_division_materia
UNION ALL
SELECT 'profesor_materia' as tabla, COUNT(*) as total FROM profesor_materia
UNION ALL
SELECT 'usuario_curso' as tabla, COUNT(*) as total FROM usuario_curso;

-- 1.6 Check existing professors and their assignments
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.apellido,
    COUNT(pm.materia_id) as materias_asignadas,
    GROUP_CONCAT(m.nombre SEPARATOR ', ') as materias
FROM usuario u
JOIN usuario_rol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
LEFT JOIN profesor_materia pm ON u.id = pm.usuario_id
LEFT JOIN materia m ON pm.materia_id = m.id
WHERE r.nombre = 'profesor'
GROUP BY u.id, u.email, u.nombre, u.apellido
ORDER BY u.email;

-- =============================================
-- SECTION 2: IDENTIFY MISSING DATA
-- =============================================

-- 2.1 Check if f@p.com user exists, if not we need to create it
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'USER_MISSING - Need to create f@p.com user'
        ELSE CONCAT('USER_EXISTS - ID: ', MIN(id))
    END as user_status
FROM usuario 
WHERE email = 'f@p.com';

-- 2.2 Check if basic academic structure exists
SELECT 
    'CURSOS' as tipo,
    CASE WHEN COUNT(*) = 0 THEN 'MISSING - Need to create courses' ELSE CONCAT('EXISTS - ', COUNT(*), ' courses') END as status
FROM curso
UNION ALL
SELECT 
    'DIVISIONES' as tipo,
    CASE WHEN COUNT(*) = 0 THEN 'MISSING - Need to create divisions' ELSE CONCAT('EXISTS - ', COUNT(*), ' divisions') END as status
FROM division
UNION ALL
SELECT 
    'MATERIAS' as tipo,
    CASE WHEN COUNT(*) = 0 THEN 'MISSING - Need to create subjects' ELSE CONCAT('EXISTS - ', COUNT(*), ' subjects') END as status
FROM materia
UNION ALL
SELECT 
    'CURSO_DIVISION' as tipo,
    CASE WHEN COUNT(*) = 0 THEN 'MISSING - Need to create course-division relationships' ELSE CONCAT('EXISTS - ', COUNT(*), ' course-divisions') END as status
FROM curso_division
UNION ALL
SELECT 
    'CURSO_DIVISION_MATERIA' as tipo,
    CASE WHEN COUNT(*) = 0 THEN 'MISSING - Need to create course-division-subject relationships' ELSE CONCAT('EXISTS - ', COUNT(*), ' relationships') END as status
FROM curso_division_materia;

-- =============================================
-- SECTION 3: TEST DATA CREATION
-- =============================================

-- 3.1 Create test user f@p.com if it doesn't exist
INSERT IGNORE INTO usuario (id, dni, nombre, apellido, email, password, activo, created_at, updated_at)
VALUES (68, '12345678', 'Profesor', 'Test', 'f@p.com', '$2b$10$example.hash.here', 1, NOW(), NOW());

-- 3.2 Ensure profesor role exists
INSERT IGNORE INTO rol (id, nombre, descripcion) 
VALUES (3, 'profesor', 'Profesor del sistema');

-- 3.3 Assign profesor role to user ID 68
INSERT IGNORE INTO usuario_rol (usuario_id, rol_id)
VALUES (68, 3);

-- 3.4 Create basic academic structure if missing

-- Create courses (1st to 6th grade)
INSERT IGNORE INTO curso (id, año) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6);

-- Create divisions (A, B, C)
INSERT IGNORE INTO division (id, division) VALUES
(1, 'A'), (2, 'B'), (3, 'C');

-- Create course-division combinations
INSERT IGNORE INTO curso_division (id, curso_id, division_id) VALUES
(1, 5, 1),  -- 5° A
(2, 5, 2),  -- 5° B
(3, 6, 1),  -- 6° A
(4, 6, 2),  -- 6° B
(5, 4, 1),  -- 4° A
(6, 4, 2);  -- 4° B

-- Create sample subjects
INSERT IGNORE INTO materia (id, nombre, carga_horaria) VALUES
(1, 'Matemáticas', 5),
(2, 'Lengua y Literatura', 4),
(3, 'Ciencias Naturales', 3),
(4, 'Ciencias Sociales', 3),
(5, 'Educación Física', 2),
(6, 'Inglés', 3),
(7, 'Arte', 2),
(8, 'Música', 2),
(9, 'Tecnología', 2),
(10, 'Formación Ética y Ciudadana', 2);

-- Assign subjects to course-divisions
INSERT IGNORE INTO curso_division_materia (id, curso_division_id, materia_id) VALUES
-- 5° A
(1, 1, 1),   -- Matemáticas
(2, 1, 2),   -- Lengua
(3, 1, 3),   -- Ciencias Naturales
(4, 1, 4),   -- Ciencias Sociales
(5, 1, 5),   -- Ed. Física
(6, 1, 6),   -- Inglés
-- 5° B
(7, 2, 1),   -- Matemáticas
(8, 2, 2),   -- Lengua
(9, 2, 3),   -- Ciencias Naturales
(10, 2, 4),  -- Ciencias Sociales
(11, 2, 5),  -- Ed. Física
(12, 2, 6),  -- Inglés
-- 6° A
(13, 3, 1),  -- Matemáticas
(14, 3, 2),  -- Lengua
(15, 3, 3),  -- Ciencias Naturales
(16, 3, 4),  -- Ciencias Sociales
(17, 3, 6),  -- Inglés
(18, 3, 7),  -- Arte
-- 6° B
(19, 4, 1),  -- Matemáticas
(20, 4, 2),  -- Lengua
(21, 4, 3),  -- Ciencias Naturales
(22, 4, 4),  -- Ciencias Sociales
(23, 4, 6),  -- Inglés
(24, 4, 7);  -- Arte

-- 3.5 Assign professor (user ID 68) to specific subjects
INSERT IGNORE INTO profesor_materia (usuario_id, materia_id) VALUES
(68, 1),  -- Matemáticas
(68, 3),  -- Ciencias Naturales
(68, 9);  -- Tecnología

-- 3.6 Create some test students and assign them to courses
INSERT IGNORE INTO usuario (id, dni, nombre, apellido, email, password, activo, created_at, updated_at) VALUES
(100, '20123456', 'Estudiante', 'Uno', 'est1@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(101, '20123457', 'Estudiante', 'Dos', 'est2@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(102, '20123458', 'Estudiante', 'Tres', 'est3@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(103, '20123459', 'Estudiante', 'Cuatro', 'est4@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(104, '20123460', 'Estudiante', 'Cinco', 'est5@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW());

-- Ensure alumno role exists
INSERT IGNORE INTO rol (id, nombre, descripcion) 
VALUES (4, 'alumno', 'Estudiante del sistema');

-- Assign alumno role to test students
INSERT IGNORE INTO usuario_rol (usuario_id, rol_id) VALUES
(100, 4), (101, 4), (102, 4), (103, 4), (104, 4);

-- Assign students to course-divisions
INSERT IGNORE INTO usuario_curso (usuario_id, curso_division_id) VALUES
(100, 1),  -- Student 1 -> 5° A
(101, 1),  -- Student 2 -> 5° A
(102, 1),  -- Student 3 -> 5° A
(103, 2),  -- Student 4 -> 5° B
(104, 2);  -- Student 5 -> 5° B

-- =============================================
-- SECTION 4: VERIFICATION QUERIES
-- =============================================

-- 4.1 Test the professor classes query again
SELECT 'TESTING getProfessorClasses query for user ID 68:' as test_description;

SELECT DISTINCT
    cdm.id,
    m.id as materia_id,
    m.nombre as materia,
    cd.id as curso_division_id,
    CONCAT(c.año, '° ', d.division) as division,
    c.año as curso,
    d.division as division_nombre,
    COUNT(DISTINCT uc.usuario_id) as students,
    m.carga_horaria as horas_semana
FROM profesor_materia pm
JOIN materia m ON pm.materia_id = m.id
JOIN curso_division_materia cdm ON m.id = cdm.materia_id
JOIN curso_division cd ON cdm.curso_division_id = cd.id
JOIN curso c ON cd.curso_id = c.id
JOIN division d ON cd.division_id = d.id
LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
WHERE pm.usuario_id = 68
GROUP BY cdm.id, m.id, cd.id, c.año, d.division
ORDER BY c.año, d.division, m.nombre;

-- 4.2 Test professor subjects query
SELECT 'TESTING getProfessorSubjects query for user ID 68:' as test_description;

SELECT DISTINCT
    m.id,
    m.nombre,
    m.carga_horaria,
    COUNT(DISTINCT cdm.curso_division_id) as total_divisiones,
    COUNT(DISTINCT uc.usuario_id) as total_estudiantes
FROM profesor_materia pm
JOIN materia m ON pm.materia_id = m.id
LEFT JOIN curso_division_materia cdm ON m.id = cdm.materia_id
LEFT JOIN curso_division cd ON cdm.curso_division_id = cd.id
LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
WHERE pm.usuario_id = 68
GROUP BY m.id, m.nombre, m.carga_horaria
ORDER BY m.nombre;

-- 4.3 Show final verification
SELECT 
    'VERIFICATION' as section,
    'Professor should now have data' as status,
    COUNT(DISTINCT cdm.id) as total_class_assignments,
    COUNT(DISTINCT m.id) as total_subjects_assigned
FROM profesor_materia pm
JOIN materia m ON pm.materia_id = m.id
JOIN curso_division_materia cdm ON m.id = cdm.materia_id
WHERE pm.usuario_id = 68;

-- =============================================
-- SECTION 5: ADDITIONAL TEST DATA FOR RICH EXPERIENCE
-- =============================================

-- Create more comprehensive test data for better professor experience

-- Add more students to existing divisions
INSERT IGNORE INTO usuario (id, dni, nombre, apellido, email, password, activo, created_at, updated_at) VALUES
(105, '30123461', 'Ana', 'García', 'ana.garcia@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(106, '30123462', 'Carlos', 'López', 'carlos.lopez@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(107, '30123463', 'María', 'Rodríguez', 'maria.rodriguez@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(108, '30123464', 'Juan', 'Martínez', 'juan.martinez@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(109, '30123465', 'Laura', 'Sánchez', 'laura.sanchez@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(110, '30123466', 'Diego', 'Fernández', 'diego.fernandez@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(111, '30123467', 'Sofía', 'González', 'sofia.gonzalez@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(112, '30123468', 'Pablo', 'Ruiz', 'pablo.ruiz@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(113, '30123469', 'Valentina', 'Díaz', 'valentina.diaz@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW()),
(114, '30123470', 'Mateo', 'Torres', 'mateo.torres@test.com', '$2b$10$example.hash.here', 1, NOW(), NOW());

-- Assign alumno role to new students
INSERT IGNORE INTO usuario_rol (usuario_id, rol_id) VALUES
(105, 4), (106, 4), (107, 4), (108, 4), (109, 4), 
(110, 4), (111, 4), (112, 4), (113, 4), (114, 4);

-- Distribute students across divisions
INSERT IGNORE INTO usuario_curso (usuario_id, curso_division_id) VALUES
-- More students for 5° A
(105, 1), (106, 1), (107, 1), (108, 1),
-- More students for 5° B  
(109, 2), (110, 2), (111, 2), (112, 2),
-- Students for 6° A
(113, 3), (114, 3);

-- Create sample schedules for the professor
INSERT IGNORE INTO horario (id, curso_division_id, curso_division_materia_id, dia, hora_inicio, hora_fin, aula, profesor_usuario_id) VALUES
(1, 1, 1, 'Lunes', '08:00', '09:30', 'Aula 101', 68),      -- Matemáticas 5° A
(2, 2, 7, 'Lunes', '10:00', '11:30', 'Aula 101', 68),      -- Matemáticas 5° B
(3, 1, 3, 'Martes', '08:00', '09:30', 'Lab Ciencias', 68), -- Ciencias Naturales 5° A
(4, 2, 9, 'Martes', '10:00', '11:30', 'Lab Ciencias', 68), -- Ciencias Naturales 5° B
(5, 3, 13, 'Miércoles', '08:00', '09:30', 'Aula 102', 68), -- Matemáticas 6° A
(6, 4, 19, 'Miércoles', '10:00', '11:30', 'Aula 102', 68), -- Matemáticas 6° B
(7, 3, 15, 'Jueves', '08:00', '09:30', 'Lab Ciencias', 68),-- Ciencias Naturales 6° A
(8, 4, 21, 'Jueves', '10:00', '11:30', 'Lab Ciencias', 68);-- Ciencias Naturales 6° B

-- Add some recent attendance records for testing
INSERT IGNORE INTO registro (usuario_id, tipo, fecha, hora, dispositivo_fichaje_id) VALUES
-- Records for today
(100, 'ingreso', CURDATE(), '08:15', 1),
(101, 'ingreso', CURDATE(), '08:05', 1),
(102, 'ingreso', CURDATE(), '08:45', 1), -- Late
(103, 'ingreso', CURDATE(), '08:10', 1),
(104, 'ingreso', CURDATE(), '08:20', 1),
(105, 'ingreso', CURDATE(), '08:08', 1),
(106, 'ingreso', CURDATE(), '08:12', 1),
-- Records for yesterday
(100, 'ingreso', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:10', 1),
(101, 'ingreso', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:15', 1),
(102, 'ingreso', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:05', 1),
(103, 'ingreso', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:30', 1),
(104, 'ingreso', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:25', 1);

-- Ensure dispositivo_fichaje table has at least one device
INSERT IGNORE INTO dispositivo_fichaje (id, nombre, ubicacion, activo) VALUES
(1, 'Dispositivo Principal', 'Entrada Principal', 1);

-- =============================================
-- FINAL VERIFICATION
-- =============================================

SELECT '=== FINAL VERIFICATION ===' as status;

SELECT 
    'Total professors:' as description,
    COUNT(DISTINCT u.id) as count
FROM usuario u 
JOIN usuario_rol ur ON u.id = ur.usuario_id 
JOIN rol r ON ur.rol_id = r.id 
WHERE r.nombre = 'profesor'

UNION ALL

SELECT 
    'Assignments for user 68:' as description,
    COUNT(*) as count
FROM profesor_materia pm 
WHERE pm.usuario_id = 68

UNION ALL

SELECT 
    'Course-division-subjects:' as description,
    COUNT(*) as count
FROM curso_division_materia

UNION ALL

SELECT 
    'Students enrolled:' as description,
    COUNT(*) as count
FROM usuario_curso uc
JOIN usuario u ON uc.usuario_id = u.id
JOIN usuario_rol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
WHERE r.nombre = 'alumno';

-- Show what the professor should see now
SELECT '=== WHAT PROFESSOR ID 68 SHOULD SEE ===' as final_check;

SELECT DISTINCT
    cdm.id,
    m.nombre as materia,
    CONCAT(c.año, '° ', d.division) as division,
    COUNT(DISTINCT uc.usuario_id) as students,
    m.carga_horaria as horas_semana
FROM profesor_materia pm
JOIN materia m ON pm.materia_id = m.id
JOIN curso_division_materia cdm ON m.id = cdm.materia_id
JOIN curso_division cd ON cdm.curso_division_id = cd.id
JOIN curso c ON cd.curso_id = c.id
JOIN division d ON cd.division_id = d.id
LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
WHERE pm.usuario_id = 68
GROUP BY cdm.id, m.id, cd.id, c.año, d.division
ORDER BY c.año, d.division, m.nombre;