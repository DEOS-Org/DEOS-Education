const axios = require('axios');

async function testAcademicCounts() {
  try {
    console.log('=== TESTING ACADEMIC COUNTS ===');
    
    // First, login to get token
    console.log('\n0. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@biofirma.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtained:', token ? 'YES' : 'NO');
    
    // Configure axios with token
    const api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Test getCursos
    console.log('\n1. Testing GET /api/academic/cursos...');
    const cursosResponse = await api.get('/academic/cursos');
    console.log('Cursos response:', JSON.stringify(cursosResponse.data, null, 2));
    
    // Test getDivisionesByCurso for first curso
    if (cursosResponse.data.data && cursosResponse.data.data.length > 0) {
      const firstCurso = cursosResponse.data.data[0];
      console.log('\n2. Testing GET /api/academic/cursos/' + firstCurso.id + '/divisiones...');
      const divisionesResponse = await api.get(`/academic/cursos/${firstCurso.id}/divisiones`);
      console.log('Divisiones response:', JSON.stringify(divisionesResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAcademicCounts();