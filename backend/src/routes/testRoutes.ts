import { Router } from 'express';
import { sequelize } from '../models/db';

const router = Router();

// Test route without authentication
router.get('/test/curso-counts', async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        c.id,
        c.año,
        COUNT(cd.id) as division_count
      FROM curso c
      LEFT JOIN curso_division cd ON c.id = cd.curso_id
      GROUP BY c.id, c.año
      ORDER BY c.año ASC
    `);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test route for division statistics
router.get('/test/division-stats/:cursoId', async (req, res) => {
  try {
    const { cursoId } = req.params;
    
    // Get divisions with stats for a course
    const [divisionesResult] = await sequelize.query(`
      SELECT 
        cd.id,
        d.division as nombre,
        cd.curso_id,
        c.año as curso_año
      FROM curso_division cd
      JOIN curso c ON cd.curso_id = c.id
      JOIN division d ON cd.division_id = d.id
      WHERE cd.curso_id = ?
      ORDER BY d.division ASC
    `, { replacements: [cursoId] });

    // Get counts for each division
    const divisionesWithStats = await Promise.all((divisionesResult as any[]).map(async (cd) => {
      // Count students
      const [estudiantesResult] = await sequelize.query(`
        SELECT COUNT(DISTINCT uc.usuario_id) as count
        FROM usuario_curso uc
        JOIN usuario_rol ur ON uc.usuario_id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.id
        WHERE uc.curso_division_id = ? AND r.nombre = 'alumno'
      `, { replacements: [cd.id] });
      
      // Count teachers
      const [profesoresResult] = await sequelize.query(`
        SELECT COUNT(DISTINCT pm.usuario_id) as count
        FROM curso_division_materia cdm
        JOIN profesor_materia pm ON cdm.materia_id = pm.materia_id
        WHERE cdm.curso_division_id = ?
      `, { replacements: [cd.id] });
      
      // Count subjects
      const [materiasResult] = await sequelize.query(`
        SELECT COUNT(DISTINCT cdm.materia_id) as count
        FROM curso_division_materia cdm
        WHERE cdm.curso_division_id = ?
      `, { replacements: [cd.id] });
      
      return {
        ...cd,
        estudiantes: parseInt((estudiantesResult[0] as any).count) || 0,
        profesores: parseInt((profesoresResult[0] as any).count) || 0,
        materias: parseInt((materiasResult[0] as any).count) || 0
      };
    }));
    
    res.json({
      success: true,
      data: divisionesWithStats
    });
  } catch (error) {
    console.error('Test division stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;