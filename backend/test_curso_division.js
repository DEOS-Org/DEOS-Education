// Script para agregar datos de prueba en curso_division
const mysql = require('mysql2/promise');

async function addTestData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'biometrico'
  });

  try {
    // Limpiar datos existentes
    await connection.execute('DELETE FROM curso_division');
    
    // Insertar divisiones para cada curso
    const insertions = [
      // Curso 1 (1° Año)
      [1, 1], [1, 2], // Divisiones A, B
      // Curso 2 (2° Año) 
      [2, 1], [2, 2], // Divisiones A, B
      // Curso 3 (3° Año)
      [3, 1], [3, 2], [3, 3], // Divisiones A, B, Informática
      // Curso 4 (4° Año)
      [4, 1], [4, 3], [4, 4], // Divisiones A, Informática, Electrónica
      // Curso 5 (5° Año)
      [5, 3], [5, 4], // Divisiones Informática, Electrónica
      // Curso 6 (6° Año)
      [6, 3], [6, 4], // Divisiones Informática, Electrónica
    ];

    for (const [curso_id, division_id] of insertions) {
      await connection.execute(
        'INSERT INTO curso_division (curso_id, division_id) VALUES (?, ?)',
        [curso_id, division_id]
      );
    }

    console.log('Datos de prueba insertados en curso_division');
    
    // Verificar los datos
    const [rows] = await connection.execute(`
      SELECT cd.id, c.año as curso, d.division 
      FROM curso_division cd
      JOIN curso c ON cd.curso_id = c.id
      JOIN division d ON cd.division_id = d.id
      ORDER BY c.año, d.division
    `);
    
    console.log('Datos en curso_division:');
    console.table(rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

addTestData();