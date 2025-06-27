const express = require('express');
const app = express();

// Simple test endpoint to verify we can add notas
app.get('/api/test/student-notas', (req, res) => {
    res.json({
        message: "Test endpoint",
        notas: [
            {
                id: 1,
                materia: "Matemáticas",
                materiaId: 1,
                profesor: "Pérez, Juan",
                evaluaciones: [
                    {
                        id: 1,
                        tipoEvaluacion: "Examen",
                        descripcion: "Examen Unidad 1",
                        fecha: "2024-05-15",
                        nota: 8.5,
                        notaMaxima: 10,
                        porcentaje: 85,
                        observaciones: "Buen desempeño"
                    }
                ],
                promedioGeneral: 8.5,
                proximasEvaluaciones: [
                    {
                        fecha: "2024-06-20",
                        tipo: "Examen",
                        descripcion: "Examen Final"
                    }
                ]
            }
        ]
    });
});

app.listen(3001, () => {
    console.log('Test server running on port 3001');
});