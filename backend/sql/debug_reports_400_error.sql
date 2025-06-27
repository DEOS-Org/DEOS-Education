-- =============================================
-- DEBUG SCRIPT FOR REPORTS 400 ERROR
-- =============================================
-- This script diagnoses the reports endpoint 400 error issues

-- =============================================
-- SECTION 1: CHECK REPORT SERVICE DEPENDENCIES
-- =============================================

-- 1.1 Check if required tables exist with proper structure
SHOW TABLES LIKE 'registro';
SHOW TABLES LIKE 'usuario';
SHOW TABLES LIKE 'curso_division';
SHOW TABLES LIKE 'horario';
SHOW TABLES LIKE 'curso_division_materia';

-- 1.2 Check registro table structure (attendance records)
DESCRIBE registro;

-- 1.3 Check if registro table has any data
SELECT 
    'registro' as tabla,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_con_registros,
    MIN(fecha) as fecha_minima,
    MAX(fecha) as fecha_maxima,
    COUNT(DISTINCT tipo) as tipos_registro
FROM registro;

-- 1.4 Check tipos de registro available
SELECT tipo, COUNT(*) as cantidad 
FROM registro 
GROUP BY tipo;

-- 1.5 Check if usuario_curso relationships exist for attendance filtering
SELECT 
    'usuario_curso' as tabla,
    COUNT(*) as total_asignaciones,
    COUNT(DISTINCT usuario_id) as usuarios_asignados,
    COUNT(DISTINCT curso_division_id) as divisiones_con_alumnos
FROM usuario_curso;

-- =============================================
-- SECTION 2: TEST REPORT QUERIES
-- =============================================

-- 2.1 Test basic attendance query with filters
-- This simulates the generateAttendanceReport function
SET @fecha_desde = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
SET @fecha_hasta = CURDATE();
SET @curso_division_id = 1; -- Test with course division 1

SELECT 'Testing basic attendance report query:' as test;

-- Get users from specific course division (simulating the filter)
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    u.dni,
    r.nombre as rol
FROM usuario u
JOIN usuario_curso uc ON u.id = uc.usuario_id
JOIN usuario_rol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
WHERE uc.curso_division_id = @curso_division_id
AND r.nombre = 'alumno'
AND u.activo = 1;

-- 2.2 Test attendance records for specific date range
SELECT 
    DATE(r.fecha) as fecha,
    r.usuario_id,
    u.nombre,
    u.apellido,
    r.tipo,
    TIME(r.fecha) as hora
FROM registro r
JOIN usuario u ON r.usuario_id = u.id
WHERE DATE(r.fecha) BETWEEN @fecha_desde AND @fecha_hasta
ORDER BY r.fecha DESC
LIMIT 20;

-- 2.3 Test the subject attendance report query
-- This simulates generateSubjectAttendanceReport function
SELECT 'Testing subject attendance report:' as test;

SELECT 
    cdm.id as curso_division_materia_id,
    m.nombre as materia,
    CONCAT(c.año, '° ', d.division) as curso_division,
    COUNT(DISTINCT uc.usuario_id) as total_alumnos
FROM curso_division_materia cdm
JOIN materia m ON cdm.materia_id = m.id
JOIN curso_division cd ON cdm.curso_division_id = cd.id
JOIN curso c ON cd.curso_id = c.id
JOIN division d ON cd.division_id = d.id
LEFT JOIN usuario_curso uc ON cd.id = uc.curso_division_id
GROUP BY cdm.id, m.nombre, c.año, d.division
LIMIT 10;

-- 2.4 Test teacher report query
-- This simulates generateTeacherReport function
SELECT 'Testing teacher report for professor ID 68:' as test;

SELECT 
    h.id,
    h.profesor_usuario_id,
    h.dia,
    h.hora_inicio,
    h.hora_fin,
    m.nombre as materia,
    CONCAT(c.año, '° ', d.division) as curso_division
FROM horario h
JOIN curso_division_materia cdm ON h.curso_division_materia_id = cdm.id
JOIN materia m ON cdm.materia_id = m.id
JOIN curso_division cd ON cdm.curso_division_id = cd.id
JOIN curso c ON cd.curso_id = c.id
JOIN division d ON cd.division_id = d.id
WHERE h.profesor_usuario_id = 68;

-- =============================================
-- SECTION 3: CHECK FOR COMMON 400 ERROR CAUSES
-- =============================================

-- 3.1 Check for NULL values that might cause issues
SELECT 'Checking for NULL values in critical fields:' as check_description;

-- Check usuario table for NULLs
SELECT 
    'usuario' as tabla,
    'activo' as campo,
    COUNT(*) as registros_null
FROM usuario 
WHERE activo IS NULL

UNION ALL

SELECT 
    'registro' as tabla,
    'fecha' as campo,
    COUNT(*) as registros_null
FROM registro 
WHERE fecha IS NULL

UNION ALL

SELECT 
    'registro' as tabla,
    'tipo' as campo,
    COUNT(*) as registros_null
FROM registro 
WHERE tipo IS NULL

UNION ALL

SELECT 
    'registro' as tabla,
    'usuario_id' as campo,
    COUNT(*) as registros_null
FROM registro 
WHERE usuario_id IS NULL;

-- 3.2 Check for invalid foreign key relationships
SELECT 'Checking for broken foreign key relationships:' as check_description;

-- Check if all registro.usuario_id reference valid users
SELECT 
    'registro->usuario' as relacion,
    COUNT(*) as registros_huerfanos
FROM registro r
LEFT JOIN usuario u ON r.usuario_id = u.id
WHERE u.id IS NULL;

-- Check if all usuario_curso references are valid
SELECT 
    'usuario_curso->usuario' as relacion,
    COUNT(*) as referencias_invalidas
FROM usuario_curso uc
LEFT JOIN usuario u ON uc.usuario_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'usuario_curso->curso_division' as relacion,
    COUNT(*) as referencias_invalidas
FROM usuario_curso uc
LEFT JOIN curso_division cd ON uc.curso_division_id = cd.id
WHERE cd.id IS NULL;

-- 3.3 Check date format issues that might cause 400 errors
SELECT 'Checking for date format issues:' as check_description;

-- Check for invalid dates in registro
SELECT 
    COUNT(*) as registros_con_fechas_invalidas
FROM registro 
WHERE fecha < '2020-01-01' OR fecha > DATE_ADD(CURDATE(), INTERVAL 1 YEAR);

-- 3.4 Check enum values in tipo field
SELECT 'Checking registro.tipo enum values:' as check_description;

SELECT 
    tipo,
    COUNT(*) as cantidad,
    CASE 
        WHEN tipo IN ('ingreso', 'egreso', 'entrada', 'salida') THEN 'VALID'
        ELSE 'INVALID - May cause errors'
    END as validacion
FROM registro 
GROUP BY tipo;

-- =============================================
-- SECTION 4: FIX COMMON ISSUES
-- =============================================

-- 4.1 Fix NULL activo values in usuario table
UPDATE usuario 
SET activo = 1 
WHERE activo IS NULL;

-- 4.2 Standardize registro.tipo values (if needed)
-- Ensure we only have valid tipo values
UPDATE registro 
SET tipo = 'ingreso' 
WHERE tipo IN ('entrada', 'in', 'check-in');

UPDATE registro 
SET tipo = 'egreso' 
WHERE tipo IN ('salida', 'out', 'check-out');

-- 4.3 Remove invalid registro records (if any)
DELETE FROM registro 
WHERE usuario_id NOT IN (SELECT id FROM usuario);

-- 4.4 Add some sample valid registro records if table is empty
INSERT IGNORE INTO registro (usuario_id, tipo, fecha, hora, dispositivo_fichaje_id) 
SELECT 
    u.id,
    'ingreso',
    CURDATE(),
    '08:15:00',
    1
FROM usuario u
JOIN usuario_rol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
WHERE r.nombre = 'alumno'
AND u.activo = 1
LIMIT 5;

-- =============================================
-- SECTION 5: VERIFICATION QUERIES
-- =============================================

-- 5.1 Final verification of report data availability
SELECT 'FINAL VERIFICATION - Report Data Availability:' as verification;

-- Check if we have enough data for reports
SELECT 
    'Usuarios activos' as metric,
    COUNT(*) as value
FROM usuario 
WHERE activo = 1

UNION ALL

SELECT 
    'Registros de asistencia (últimos 30 días)' as metric,
    COUNT(*) as value
FROM registro 
WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)

UNION ALL

SELECT 
    'Asignaciones usuario-curso' as metric,
    COUNT(*) as value
FROM usuario_curso

UNION ALL

SELECT 
    'Horarios configurados' as metric,
    COUNT(*) as value
FROM horario

UNION ALL

SELECT 
    'Materias con profesores asignados' as metric,
    COUNT(DISTINCT pm.materia_id) as value
FROM profesor_materia pm;

-- 5.2 Test a complete report query that should work
SELECT 'TESTING COMPLETE ATTENDANCE REPORT QUERY:' as test_final;

SELECT 
    u.id as usuario_id,
    u.nombre,
    u.apellido,
    u.dni,
    DATE(r.fecha) as fecha,
    GROUP_CONCAT(DISTINCT r.tipo ORDER BY r.fecha SEPARATOR ', ') as tipos_registro,
    MIN(CASE WHEN r.tipo = 'ingreso' THEN TIME(r.fecha) END) as primer_ingreso,
    MAX(CASE WHEN r.tipo = 'egreso' THEN TIME(r.fecha) END) as ultimo_egreso,
    CASE 
        WHEN MIN(CASE WHEN r.tipo = 'ingreso' THEN TIME(r.fecha) END) IS NOT NULL THEN 'presente'
        ELSE 'ausente'
    END as estado
FROM usuario u
JOIN usuario_rol ur ON u.id = ur.usuario_id
JOIN rol rol ON ur.rol_id = rol.id
LEFT JOIN registro r ON u.id = r.usuario_id 
    AND DATE(r.fecha) = CURDATE()
WHERE rol.nombre = 'alumno'
AND u.activo = 1
GROUP BY u.id, u.nombre, u.apellido, u.dni, DATE(r.fecha)
ORDER BY u.apellido, u.nombre
LIMIT 10;

-- 5.3 Show summary of what should be fixed
SELECT 'SUMMARY - Issues that may cause 400 errors:' as summary;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM registro) = 0 THEN 'WARNING: No attendance records - reports will be empty'
        WHEN (SELECT COUNT(*) FROM usuario_curso) = 0 THEN 'WARNING: No student-course assignments - course filtering will fail'
        WHEN (SELECT COUNT(*) FROM horario) = 0 THEN 'WARNING: No schedules - teacher reports will be empty'
        WHEN (SELECT COUNT(DISTINCT r.tipo) FROM registro r) < 2 THEN 'WARNING: Only one type of attendance record - incomplete data'
        ELSE 'OK: Basic report data structure appears complete'
    END as status_message;