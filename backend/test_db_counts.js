const mysql = require('mysql2/promise');

async function testDatabaseCounts() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root_password',
      database: 'biometrico'
    });
    
    console.log('=== TESTING DATABASE COUNTS ===\n');
    
    // Test 1: Count divisions per course
    console.log('1. Divisiones por curso:');
    const [cursos] = await connection.execute(`
      SELECT 
        c.id,
        c.año,
        COUNT(cd.id) as division_count
      FROM curso c
      LEFT JOIN curso_division cd ON c.id = cd.curso_id
      GROUP BY c.id, c.año
      ORDER BY c.año ASC
    `);
    console.log('Cursos con divisiones:', cursos);
    
    // Test 2: Get divisions with counts for first course
    if (cursos.length > 0) {
      const firstCursoId = cursos[0].id;
      console.log('\n2. Divisiones del curso ' + firstCursoId + ' con estadísticas:');
      
      const [divisiones] = await connection.execute(`
        SELECT 
          cd.id,
          d.division as nombre,
          cd.curso_id,
          c.año as curso_año,
          
          -- Count students
          COALESCE(estudiantes.count, 0) as estudiantes,
          
          -- Count teachers
          COALESCE(profesores.count, 0) as profesores,
          
          -- Count subjects
          COALESCE(materias.count, 0) as materias
          
        FROM curso_division cd
        JOIN curso c ON cd.curso_id = c.id
        JOIN division d ON cd.division_id = d.id
        
        -- Count students in this division
        LEFT JOIN (
          SELECT 
            uc.curso_division_id,
            COUNT(DISTINCT u.id) as count
          FROM usuario_curso uc
          JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
          JOIN rol r ON ur.rol_id = r.id
          WHERE r.nombre = 'alumno'
          GROUP BY uc.curso_division_id
        ) estudiantes ON cd.id = estudiantes.curso_division_id
        
        -- Count teachers for this division
        LEFT JOIN (
          SELECT 
            cdm.curso_division_id,
            COUNT(DISTINCT pm.usuario_id) as count
          FROM curso_division_materia cdm
          JOIN profesor_materia pm ON cdm.materia_id = pm.materia_id
          GROUP BY cdm.curso_division_id
        ) profesores ON cd.id = profesores.curso_division_id
        
        -- Count subjects for this division
        LEFT JOIN (
          SELECT 
            cdm.curso_division_id,
            COUNT(DISTINCT cdm.materia_id) as count
          FROM curso_division_materia cdm
          GROUP BY cdm.curso_division_id
        ) materias ON cd.id = materias.curso_division_id
        
        WHERE cd.curso_id = ?
        ORDER BY d.division ASC
      `, [firstCursoId]);
      
      console.log('Divisiones:', divisiones);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

testDatabaseCounts();