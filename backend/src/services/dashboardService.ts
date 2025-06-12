import { 
  Usuario, 
  UsuarioRol, 
  Rol, 
  Curso, 
  Division, 
  CursoDivision, 
  UsuarioCurso, 
  DispositivoFichaje,
  Registro,
  Huella
} from '../models';

export interface DashboardStats {
  usuarios: {
    total: number;
    por_rol: {
      alumnos: number;
      profesores: number;
      padres: number;
      administradores: number;
      preceptores: number;
      directivos: number;
    };
  };
  academico: {
    total_cursos: number;
    total_divisiones: number;
    total_curso_divisiones: number;
    estudiantes_por_curso: Array<{
      curso: string;
      division: string;
      estudiantes: number;
    }>;
  };
  biometrico: {
    total_huellas_registradas: number;
    total_dispositivos: number;
    dispositivos_activos: number;
    registros_hoy: number;
    registros_esta_semana: number;
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Estadísticas de usuarios
    const totalUsuarios = await Usuario.count();
    
    // Contar usuarios por rol usando consultas directas
    const { sequelize } = require('../models/db');
    
    const [alumnosResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = 'alumno'
    `);
    const alumnosCount = alumnosResult[0]?.count || 0;

    const [profesoresResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = 'profesor'
    `);
    const profesoresCount = profesoresResult[0]?.count || 0;

    const [padresResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = 'padre'
    `);
    const padresCount = padresResult[0]?.count || 0;

    const [adminResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = 'admin'
    `);
    const adminCount = adminResult[0]?.count || 0;

    const [preceptoresResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = 'preceptor'
    `);
    const preceptoresCount = preceptoresResult[0]?.count || 0;

    const [directivosResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = 'directivo'
    `);
    const directivosCount = directivosResult[0]?.count || 0;

    // Estadísticas académicas
    const totalCursos = await Curso.count();
    const totalDivisiones = await Division.count();
    const totalCursoDivisiones = await CursoDivision.count();

    // Estudiantes por curso-división - simplified approach
    const estudiantesPorCurso: any[] = [];

    const estudiantesPorCursoFormatted = estudiantesPorCurso;

    // Estadísticas biométricas
    const totalHuellas = await Huella.count();
    const totalDispositivos = await DispositivoFichaje.count();
    const dispositivosActivos = await DispositivoFichaje.count({
      where: { activo: true }
    });

    // Registros de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const registrosHoy = await Registro.count({
      where: {
        fecha: {
          [require('sequelize').Op.gte]: hoy,
          [require('sequelize').Op.lt]: mañana
        }
      }
    });

    // Registros de esta semana
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    
    const registrosEstaSemana = await Registro.count({
      where: {
        fecha: {
          [require('sequelize').Op.gte]: inicioSemana,
          [require('sequelize').Op.lt]: mañana
        }
      }
    });

    return {
      usuarios: {
        total: totalUsuarios,
        por_rol: {
          alumnos: alumnosCount,
          profesores: profesoresCount,
          padres: padresCount,
          administradores: adminCount,
          preceptores: preceptoresCount,
          directivos: directivosCount
        }
      },
      academico: {
        total_cursos: totalCursos,
        total_divisiones: totalDivisiones,
        total_curso_divisiones: totalCursoDivisiones,
        estudiantes_por_curso: estudiantesPorCursoFormatted
      },
      biometrico: {
        total_huellas_registradas: totalHuellas,
        total_dispositivos: totalDispositivos,
        dispositivos_activos: dispositivosActivos,
        registros_hoy: registrosHoy,
        registros_esta_semana: registrosEstaSemana
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

export const getUserCountByRole = async (role: string): Promise<number> => {
  try {
    const { sequelize } = require('../models/db');
    const [result] = await sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM usuario u 
      JOIN usuario_rol ur ON u.id = ur.usuario_id 
      JOIN rol r ON ur.rol_id = r.id 
      WHERE r.nombre = ?
    `, {
      replacements: [role]
    });
    return result[0]?.count || 0;
  } catch (error) {
    console.error(`Error counting users with role ${role}:`, error);
    throw error;
  }
};

export const getStudentCountByCourse = async (cursoId?: number, divisionId?: number): Promise<number> => {
  try {
    // Simplified approach - return 0 for now, can implement later if needed
    return 0;
  } catch (error) {
    console.error('Error counting students by course:', error);
    throw error;
  }
};

export const getAttendanceStats = async () => {
  const { sequelize } = require('../models/db');
  
  try {
    // Get today's attendance data
    const [todayStats] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN r.tipo = 'ingreso' THEN 1 END) as presentes_hoy,
        0 as ausentes_hoy,
        0 as tarde_hoy,
        COUNT(DISTINCT r.usuario_id) as total_registros_hoy
      FROM registro r
      WHERE DATE(r.fecha) = CURDATE()
    `);

    // Get yesterday's attendance for comparison
    const [yesterdayStats] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN r.tipo = 'ingreso' THEN 1 END) as presentes_ayer
      FROM registro r
      WHERE DATE(r.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `);

    // Get last 7 days attendance data for charts
    const [weeklyData] = await sequelize.query(`
      SELECT 
        DATE(r.fecha) as fecha,
        COUNT(CASE WHEN r.tipo = 'ingreso' THEN 1 END) as presentes,
        0 as ausentes,
        COUNT(CASE WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN 1 END) as tarde,
        COUNT(DISTINCT r.usuario_id) as total
      FROM registro r
      WHERE DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(r.fecha)
      ORDER BY fecha ASC
    `);

    // Calculate average attendance percentage
    const [avgAttendance] = await sequelize.query(`
      SELECT 
        ROUND(AVG(
          CASE 
            WHEN total_users.total > 0 THEN 
              (daily_attendance.presentes / total_users.total) * 100 
            ELSE 0 
          END
        ), 2) as promedio_asistencia
      FROM (
        SELECT 
          DATE(r.fecha) as fecha,
          COUNT(CASE WHEN r.tipo = 'ingreso' THEN 1 END) as presentes
        FROM registro r
        WHERE DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(r.fecha)
      ) daily_attendance
      CROSS JOIN (
        SELECT COUNT(DISTINCT u.id) as total
        FROM usuario u
        JOIN usuario_rol ur ON u.id = ur.usuario_id
        JOIN rol r ON ur.rol_id = r.id
        WHERE r.nombre = 'alumno'
      ) total_users
    `);

    const today = todayStats[0] as any;
    const yesterday = yesterdayStats[0] as any;
    const average = avgAttendance[0] as any;

    // Calculate trends
    const trendPresentes = yesterday.presentes_ayer > 0 
      ? Math.round(((today.presentes_hoy - yesterday.presentes_ayer) / yesterday.presentes_ayer) * 100)
      : 0;

    return {
      stats: {
        totalPresentes: today.presentes_hoy || 0,
        totalAusentes: today.ausentes_hoy || 0,
        totalTarde: today.tarde_hoy || 0,
        porcentajeAsistencia: average.promedio_asistencia || 0,
        trendPresentes: trendPresentes,
        trendAusentes: 0,
        promedioTardanzas: 0
      },
      weeklyData: weeklyData || []
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return {
      stats: {
        totalPresentes: 0,
        totalAusentes: 0,
        totalTarde: 0,
        porcentajeAsistencia: 0,
        trendPresentes: 0,
        trendAusentes: 0,
        promedioTardanzas: 0
      },
      weeklyData: []
    };
  }
};