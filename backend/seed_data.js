const mysql = require('mysql2/promise');

async function seedData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'biometrico',
      password: 'biometrico123',
      database: 'biometrico'
    });

    console.log('Connected to database');

    // Insert basic courses (1 to 6 year)
    for (let año = 1; año <= 6; año++) {
      await connection.execute(
        'INSERT IGNORE INTO curso (año) VALUES (?)',
        [año]
      );
    }
    console.log('Inserted courses');

    // Insert basic divisions
    const divisions = ['A', 'B', 'C', 'Informática', 'Electrónica'];
    for (const division of divisions) {
      await connection.execute(
        'INSERT IGNORE INTO division (division) VALUES (?)',
        [division]
      );
    }
    console.log('Inserted divisions');

    // Create some curso-division combinations
    const cursos = await connection.execute('SELECT id, año FROM curso');
    const divisionesRes = await connection.execute('SELECT id, division FROM division');
    
    // Create combinations for each year with A and B divisions
    for (const curso of cursos[0]) {
      for (const division of divisionesRes[0]) {
        if (['A', 'B'].includes(division.division)) {
          const añoOrdinal = ['1ro', '2do', '3ro', '4to', '5to', '6to'][curso.año - 1];
          const nombreLegible = `${añoOrdinal} ${division.division}`;
          
          await connection.execute(
            'INSERT IGNORE INTO curso_division (curso_id, division_id, nombre_legible) VALUES (?, ?, ?)',
            [curso.id, division.id, nombreLegible]
          );
        }
      }
    }
    console.log('Created curso-division combinations');

    // Insert basic subjects
    const materias = [
      { nombre: 'Matemáticas', carga_horaria: 6 },
      { nombre: 'Lengua y Literatura', carga_horaria: 5 },
      { nombre: 'Ciencias Naturales', carga_horaria: 4 },
      { nombre: 'Historia', carga_horaria: 3 },
      { nombre: 'Geografía', carga_horaria: 3 },
      { nombre: 'Educación Física', carga_horaria: 2 },
      { nombre: 'Inglés', carga_horaria: 3 },
      { nombre: 'Programación', carga_horaria: 4 },
      { nombre: 'Electrónica', carga_horaria: 4 }
    ];
    
    for (const materia of materias) {
      await connection.execute(
        'INSERT IGNORE INTO materia (nombre, carga_horaria) VALUES (?, ?)',
        [materia.nombre, materia.carga_horaria]
      );
    }
    console.log('Inserted subjects');

    await connection.end();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedData();