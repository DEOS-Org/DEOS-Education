import { 
  Curso, 
  Division, 
  CursoDivision, 
  Materia, 
  Horario,
  Usuario,
  ProfesorMateria,
  CursoDivisionMateria,
  UsuarioCurso,
  Rol,
  CursoInstance,
  DivisionInstance,
  CursoDivisionInstance,
  MateriaInstance,
  HorarioInstance,
  UsuarioInstance,
  ProfesorMateriaInstance,
  CursoDivisionMateriaInstance,
  DiaSemana
} from '../models';
import { AppError } from '../utils/AppError';
import { Op } from 'sequelize';

// Type definitions for models with associations
interface CursoDivisionWithAssociations extends CursoDivisionInstance {
  Curso?: CursoInstance;
  Division?: DivisionInstance;
}

interface CursoDivisionMateriaWithAssociations extends CursoDivisionMateriaInstance {
  Materia?: MateriaInstance;
  CursoDivision?: CursoDivisionWithAssociations;
}

interface HorarioWithAssociations extends HorarioInstance {
  CursoDivisionMateria?: CursoDivisionMateriaWithAssociations;
}

interface ProfesorMateriaWithAssociations extends ProfesorMateriaInstance {
  Usuario?: UsuarioInstance;
  Materia?: MateriaInstance;
}

// ===== CURSOS =====
export const getCursos = async () => {
  const { sequelize } = require('../models/db');
  
  // Get courses with division count
  const [cursosResult] = await sequelize.query(`
    SELECT 
      c.id,
      c.año,
      COUNT(cd.id) as division_count
    FROM curso c
    LEFT JOIN curso_division cd ON c.id = cd.curso_id
    GROUP BY c.id, c.año
    ORDER BY c.año ASC
  `);

  // Transform to match frontend expectations
  return (cursosResult as any[]).map(curso => ({
    id: curso.id,
    nombre: `${curso.año}° Año`,
    nivel: `${curso.año}`,
    descripcion: `Curso de ${curso.año}° año`,
    divisiones: curso.division_count || 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
};

export const createCurso = async (data: {
  nombre: string;
  nivel: string;
  descripcion?: string;
  activo: boolean;
}) => {
  // Extract año from nivel or nombre
  const año = parseInt(data.nivel) || parseInt(data.nombre.match(/\d+/)?.[0] || '1');
  
  if (año < 1 || año > 6) {
    throw new AppError('El año debe estar entre 1 y 6', 400);
  }

  // Check if exists
  const existe = await Curso.findOne({ where: { año } });
  if (existe) {
    throw new AppError('Ya existe un curso con ese año', 400);
  }

  const curso = await Curso.create({ año });

  return {
    id: curso.id,
    nombre: `${curso.año}° Año`,
    nivel: `${curso.año}`,
    descripcion: `Curso de ${curso.año}° año`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const updateCurso = async (id: number, data: {
  nombre: string;
  nivel: string;
  descripcion?: string;
  activo: boolean;
}) => {
  const curso = await Curso.findByPk(id);
  if (!curso) {
    throw new AppError('Curso no encontrado', 404);
  }

  const año = parseInt(data.nivel) || parseInt(data.nombre.match(/\d+/)?.[0] || '1');
  
  if (año < 1 || año > 6) {
    throw new AppError('El año debe estar entre 1 y 6', 400);
  }

  // Check if another curso with this año exists
  const existe = await Curso.findOne({ 
    where: { 
      año,
      id: { [Op.ne]: id }
    } 
  });
  
  if (existe) {
    throw new AppError('Ya existe un curso con ese año', 400);
  }

  await curso.update({ año });

  return {
    id: curso.id,
    nombre: `${curso.año}° Año`,
    nivel: `${curso.año}`,
    descripcion: `Curso de ${curso.año}° año`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const deleteCurso = async (id: number) => {
  const curso = await Curso.findByPk(id);
  if (!curso) {
    throw new AppError('Curso no encontrado', 404);
  }

  // Check if has divisions
  const divisiones = await CursoDivision.findAll({ where: { curso_id: id } });
  if (divisiones.length > 0) {
    throw new AppError('No se puede eliminar un curso que tiene divisiones asignadas', 400);
  }

  await curso.destroy();
  return { message: 'Curso eliminado correctamente' };
};

// ===== DIVISIONES =====
export const getDivisiones = async () => {
  const divisiones = await Division.findAll({
    order: [['division', 'ASC']]
  });

  return divisiones.map(division => ({
    id: division.id,
    nombre: division.division,
    descripcion: `División ${division.division}`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
};

export const getCursosDivisiones = async () => {
  const cursoDivisions = await CursoDivision.findAll({
    include: [
      { model: Curso, attributes: ['id', 'año'] },
      { model: Division, attributes: ['id', 'division'] }
    ],
    order: [[Curso, 'año', 'ASC'], [Division, 'division', 'ASC']]
  }) as CursoDivisionWithAssociations[];

  return cursoDivisions.map(cd => {
    const cursoData = cd.Curso;
    const divisionData = cd.Division;
    
    return {
      id: cd.id,
      nombre: divisionData?.division || 'Sin nombre',
      curso_id: cd.curso_id,
      capacidad: 30, // Default capacity
      activo: true,
      Curso: cursoData ? {
        id: cursoData.id,
        nombre: `${cursoData.año}° Año`,
        nivel: `${cursoData.año}`,
        activo: true
      } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
};

export const getDivisionesByCurso = async (cursoId: number) => {
  const { sequelize } = require('../models/db');
  
  try {
    // Simplified query - get basic divisions first
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

    // Get counts separately for each division
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
        id: cd.id,
        nombre: cd.nombre || 'Sin nombre',
        curso_id: cd.curso_id,
        capacidad: 30,
        estudiantes: parseInt((estudiantesResult[0] as any).count) || 0,
        profesores: parseInt((profesoresResult[0] as any).count) || 0,
        materias: parseInt((materiasResult[0] as any).count) || 0,
        activo: true,
        Curso: {
          id: cd.curso_id,
          nombre: `${cd.curso_año}° Año`,
          nivel: `${cd.curso_año}`,
          activo: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }));

    return divisionesWithStats;
  } catch (error) {
    console.error('Error in getDivisionesByCurso:', error);
    throw error;
  }
};

export const createDivision = async (data: {
  nombre: string;
  activo: boolean;
}) => {
  // Check if exists
  const existe = await Division.findOne({ where: { division: data.nombre } });
  if (existe) {
    throw new AppError('Ya existe una división con ese nombre', 400);
  }

  const division = await Division.create({ division: data.nombre });

  return {
    id: division.id,
    nombre: division.division,
    descripcion: `División ${division.division}`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const updateDivision = async (id: number, data: {
  nombre: string;
  activo: boolean;
}) => {
  const division = await Division.findByPk(id);
  if (!division) {
    throw new AppError('División no encontrada', 404);
  }

  // Check if another division with this name exists
  const existe = await Division.findOne({ 
    where: { 
      division: data.nombre,
      id: { [Op.ne]: id }
    } 
  });
  
  if (existe) {
    throw new AppError('Ya existe una división con ese nombre', 400);
  }

  await division.update({ division: data.nombre });

  return {
    id: division.id,
    nombre: division.division,
    descripcion: `División ${division.division}`,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const deleteDivision = async (id: number) => {
  const division = await Division.findByPk(id);
  if (!division) {
    throw new AppError('División no encontrada', 404);
  }

  // Check if has curso divisions
  const cursoDivisiones = await CursoDivision.findAll({ where: { division_id: id } });
  if (cursoDivisiones.length > 0) {
    throw new AppError('No se puede eliminar una división que está asignada a cursos', 400);
  }

  await division.destroy();
  return { message: 'División eliminada correctamente' };
};

export const createCursoDivision = async (data: {
  curso_id: number;
  division_id: number;
}) => {
  // Check if exists
  const existe = await CursoDivision.findOne({
    where: {
      curso_id: data.curso_id,
      division_id: data.division_id
    }
  });
  
  if (existe) {
    throw new AppError('Ya existe esa combinación de curso y división', 400);
  }

  const cursoDivision = await CursoDivision.create({
    curso_id: data.curso_id,
    division_id: data.division_id
  });

  // Get with relations for response
  const cursoDivisionConRelaciones = await CursoDivision.findByPk(cursoDivision.id, {
    include: [
      { model: Curso, attributes: ['id', 'año'] },
      { model: Division, attributes: ['id', 'division'] }
    ]
  }) as CursoDivisionWithAssociations | null;

  const cursoData = cursoDivisionConRelaciones?.Curso;
  const divisionData = cursoDivisionConRelaciones?.Division;

  return {
    id: cursoDivisionConRelaciones!.id,
    nombre: divisionData?.division || 'Sin nombre',
    curso_id: cursoDivisionConRelaciones!.curso_id,
    capacidad: 30,
    activo: true,
    Curso: cursoData ? {
      id: cursoData.id,
      nombre: `${cursoData.año}° Año`,
      nivel: `${cursoData.año}`,
      activo: true
    } : null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// ===== MATERIAS =====
export const getMaterias = async () => {
  const materias = await Materia.findAll({
    order: [['nombre', 'ASC']]
  });

  return materias.map(materia => ({
    id: materia.id,
    nombre: materia.nombre,
    descripcion: `Materia: ${materia.nombre}`,
    carga_horaria: materia.carga_horaria || 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
};

export const createMateria = async (data: {
  nombre: string;
  carga_horaria: number;
  activo: boolean;
}) => {
  const existe = await Materia.findOne({ where: { nombre: data.nombre } });
  if (existe) {
    throw new AppError('Ya existe una materia con ese nombre', 400);
  }

  const materia = await Materia.create({
    nombre: data.nombre,
    carga_horaria: data.carga_horaria
  });

  return {
    id: materia.id,
    nombre: materia.nombre,
    descripcion: `Materia: ${materia.nombre}`,
    carga_horaria: materia.carga_horaria || 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const updateMateria = async (id: number, data: {
  nombre: string;
  carga_horaria: number;
  activo: boolean;
}) => {
  const materia = await Materia.findByPk(id);
  if (!materia) {
    throw new AppError('Materia no encontrada', 404);
  }

  const existe = await Materia.findOne({ 
    where: { 
      nombre: data.nombre,
      id: { [Op.ne]: id }
    } 
  });
  
  if (existe) {
    throw new AppError('Ya existe una materia con ese nombre', 400);
  }

  await materia.update({
    nombre: data.nombre,
    carga_horaria: data.carga_horaria
  });

  return {
    id: materia.id,
    nombre: materia.nombre,
    descripcion: `Materia: ${materia.nombre}`,
    carga_horaria: materia.carga_horaria || 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const deleteMateria = async (id: number) => {
  const materia = await Materia.findByPk(id);
  if (!materia) {
    throw new AppError('Materia no encontrada', 404);
  }

  // Check if has curso division materias
  const cursoDivisionMaterias = await CursoDivisionMateria.findAll({ where: { materia_id: id } });
  if (cursoDivisionMaterias.length > 0) {
    throw new AppError('No se puede eliminar una materia que está asignada a cursos', 400);
  }

  await materia.destroy();
  return { message: 'Materia eliminada correctamente' };
};

// ===== HORARIOS =====
export const getHorarios = async () => {
  const horarios = await Horario.findAll({
    include: [
      {
        model: CursoDivisionMateria,
        include: [
          { model: Materia, attributes: ['id', 'nombre'] },
          {
            model: CursoDivision,
            include: [
              { model: Curso, attributes: ['id', 'año'] },
              { model: Division, attributes: ['id', 'division'] }
            ]
          }
        ]
      }
    ],
    order: [['dia', 'ASC'], ['hora_inicio', 'ASC']]
  }) as HorarioWithAssociations[];

  return horarios.map(horario => {
    const cdMateria = horario.CursoDivisionMateria;
    const materia = cdMateria?.Materia;
    const cursoDivision = cdMateria?.CursoDivision;
    const curso = cursoDivision?.Curso;
    const division = cursoDivision?.Division;

    return {
      id: horario.id,
      curso_id: curso?.id,
      materia_id: materia?.id,
      dia: horario.dia,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      aula: horario.aula || '',
      profesor: {
        id: horario.profesor_usuario_id,
        nombre: 'Profesor',
        apellido: 'Asignado'
      },
      materia: {
        id: materia?.id,
        nombre: materia?.nombre || 'Sin materia'
      },
      curso: {
        id: curso?.id,
        nombre: `${curso?.año}° ${division?.division}` || 'Sin curso'
      },
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
};

export const createHorario = async (data: {
  curso_division_materia_id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  profesor_usuario_id?: number;
}) => {
  const horario = await Horario.create({
    curso_division_id: 1, // Default value
    curso_division_materia_id: data.curso_division_materia_id,
    dia: data.dia as DiaSemana,
    hora_inicio: data.hora_inicio,
    hora_fin: data.hora_fin,
    aula: data.aula,
    profesor_usuario_id: data.profesor_usuario_id || 1
  });

  const horarioConRelaciones = await Horario.findByPk(horario.id, {
    include: [
      {
        model: CursoDivisionMateria,
        include: [
          { model: Materia, attributes: ['id', 'nombre'] },
          {
            model: CursoDivision,
            include: [
              { model: Curso, attributes: ['id', 'año'] },
              { model: Division, attributes: ['id', 'division'] }
            ]
          }
        ]
      }
    ]
  }) as HorarioWithAssociations | null;

  const cdMateria = horarioConRelaciones?.CursoDivisionMateria;
  const materia = cdMateria?.Materia;
  const cursoDivision = cdMateria?.CursoDivision;
  const curso = cursoDivision?.Curso;
  const division = cursoDivision?.Division;

  return {
    id: horarioConRelaciones!.id,
    curso_division_materia_id: horarioConRelaciones!.curso_division_materia_id,
    dia: horarioConRelaciones!.dia,
    hora_inicio: horarioConRelaciones!.hora_inicio,
    hora_fin: horarioConRelaciones!.hora_fin,
    aula: horarioConRelaciones!.aula || '',
    profesor: {
      id: horarioConRelaciones!.profesor_usuario_id,
      nombre: 'Profesor',
      apellido: 'Asignado'
    },
    materia: {
      id: materia?.id,
      nombre: materia?.nombre || 'Sin materia'
    },
    curso: {
      id: curso?.id,
      nombre: `${curso?.año}° ${division?.division}` || 'Sin curso'
    },
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// ===== ASIGNACIONES =====
export const getAsignaciones = async () => {
  const asignaciones = await ProfesorMateria.findAll({
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre', 'apellido', 'email'],
        include: [
          {
            model: Rol,
            where: { nombre: 'profesor' },
            through: { attributes: [] }
          }
        ]
      },
      { model: Materia, attributes: ['id', 'nombre', 'carga_horaria'] }
    ],
    order: [['id', 'ASC']]
  }) as ProfesorMateriaWithAssociations[];

  return asignaciones.map(asignacion => {
    const usuario = asignacion.Usuario;
    const materia = asignacion.Materia;

    return {
      id: asignacion.id,
      profesor_id: usuario?.id,
      materia_id: materia?.id,
      profesor: {
        id: usuario?.id,
        nombre: usuario?.nombre || 'Sin nombre',
        apellido: usuario?.apellido || 'Sin apellido',
        email: usuario?.email
      },
      materia: {
        id: materia?.id,
        nombre: materia?.nombre || 'Sin nombre',
        descripcion: `Materia: ${materia?.nombre}`,
        carga_horaria: materia?.carga_horaria
      },
      activo: true,
      fecha_asignacion: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
};

export const createAsignacion = async (data: {
  profesor_id: number;
  materia_id: number;
}) => {
  const existe = await ProfesorMateria.findOne({
    where: {
      usuario_id: data.profesor_id,
      materia_id: data.materia_id
    }
  });

  if (existe) {
    throw new AppError('El profesor ya está asignado a esta materia', 400);
  }

  const asignacion = await ProfesorMateria.create({
    usuario_id: data.profesor_id,
    materia_id: data.materia_id
  });

  const asignacionConRelaciones = await ProfesorMateria.findByPk(asignacion.id, {
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre', 'apellido', 'email']
      },
      { model: Materia, attributes: ['id', 'nombre', 'carga_horaria'] }
    ]
  }) as ProfesorMateriaWithAssociations | null;

  const usuario = asignacionConRelaciones?.Usuario;
  const materia = asignacionConRelaciones?.Materia;

  return {
    id: asignacionConRelaciones!.id,
    profesor_id: usuario?.id,
    materia_id: materia?.id,
    profesor: {
      id: usuario?.id,
      nombre: usuario?.nombre || 'Sin nombre',
      apellido: usuario?.apellido || 'Sin apellido',
      email: usuario?.email
    },
    materia: {
      id: materia?.id,
      nombre: materia?.nombre || 'Sin nombre',
      descripcion: `Materia: ${materia?.nombre}`,
      carga_horaria: materia?.carga_horaria
    },
    activo: true,
    fecha_asignacion: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const deleteAsignacion = async (id: number) => {
  const asignacion = await ProfesorMateria.findByPk(id);
  if (!asignacion) {
    throw new AppError('Asignación no encontrada', 404);
  }

  await asignacion.destroy();
  return { message: 'Asignación eliminada correctamente' };
};

// Additional methods for controller compatibility
export const getHorariosByCurso = async (cursoId: number) => {
  const horarios = await Horario.findAll({
    include: [
      {
        model: CursoDivisionMateria,
        include: [
          { model: Materia, attributes: ['id', 'nombre'] },
          {
            model: CursoDivision,
            where: { curso_id: cursoId },
            include: [
              { model: Curso, attributes: ['id', 'año'] },
              { model: Division, attributes: ['id', 'division'] }
            ]
          }
        ]
      }
    ],
    order: [['dia', 'ASC'], ['hora_inicio', 'ASC']]
  }) as HorarioWithAssociations[];

  return horarios.map(horario => {
    const cdMateria = horario.CursoDivisionMateria;
    const materia = cdMateria?.Materia;
    const cursoDivision = cdMateria?.CursoDivision;
    const curso = cursoDivision?.Curso;
    const division = cursoDivision?.Division;

    return {
      id: horario.id,
      curso_id: curso?.id,
      materia_id: materia?.id,
      dia: horario.dia,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      aula: horario.aula || '',
      profesor: {
        id: horario.profesor_usuario_id,
        nombre: 'Profesor',
        apellido: 'Asignado'
      },
      materia: {
        id: materia?.id,
        nombre: materia?.nombre || 'Sin materia'
      },
      curso: {
        id: curso?.id,
        nombre: `${curso?.año}° ${division?.division}` || 'Sin curso'
      },
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
};

export const updateHorario = async (id: number, data: {
  curso_division_materia_id?: number;
  dia?: string;
  hora_inicio?: string;
  hora_fin?: string;
  aula?: string;
  profesor_usuario_id?: number;
}) => {
  const horario = await Horario.findByPk(id);
  if (!horario) {
    throw new AppError('Horario no encontrado', 404);
  }

  await horario.update({
    ...(data.curso_division_materia_id && { curso_division_materia_id: data.curso_division_materia_id }),
    ...(data.dia && { dia: data.dia as DiaSemana }),
    ...(data.hora_inicio && { hora_inicio: data.hora_inicio }),
    ...(data.hora_fin && { hora_fin: data.hora_fin }),
    ...(data.aula !== undefined && { aula: data.aula }),
    ...(data.profesor_usuario_id && { profesor_usuario_id: data.profesor_usuario_id })
  });

  const horarioConRelaciones = await Horario.findByPk(horario.id, {
    include: [
      {
        model: CursoDivisionMateria,
        include: [
          { model: Materia, attributes: ['id', 'nombre'] },
          {
            model: CursoDivision,
            include: [
              { model: Curso, attributes: ['id', 'año'] },
              { model: Division, attributes: ['id', 'division'] }
            ]
          }
        ]
      }
    ]
  }) as HorarioWithAssociations | null;

  const cdMateria = horarioConRelaciones?.CursoDivisionMateria;
  const materia = cdMateria?.Materia;
  const cursoDivision = cdMateria?.CursoDivision;
  const curso = cursoDivision?.Curso;
  const division = cursoDivision?.Division;

  return {
    id: horarioConRelaciones!.id,
    curso_division_materia_id: horarioConRelaciones!.curso_division_materia_id,
    dia: horarioConRelaciones!.dia,
    hora_inicio: horarioConRelaciones!.hora_inicio,
    hora_fin: horarioConRelaciones!.hora_fin,
    aula: horarioConRelaciones!.aula || '',
    profesor: {
      id: horarioConRelaciones!.profesor_usuario_id,
      nombre: 'Profesor',
      apellido: 'Asignado'
    },
    materia: {
      id: materia?.id,
      nombre: materia?.nombre || 'Sin materia'
    },
    curso: {
      id: curso?.id,
      nombre: `${curso?.año}° ${division?.division}` || 'Sin curso'
    },
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const deleteHorario = async (id: number) => {
  const horario = await Horario.findByPk(id);
  if (!horario) {
    throw new AppError('Horario no encontrado', 404);
  }

  await horario.destroy();
  return { message: 'Horario eliminado correctamente' };
};

export const assignProfesorToMateria = async (profesorId: number, materiaId: number) => {
  return await createAsignacion({
    profesor_id: profesorId,
    materia_id: materiaId
  });
};

export const removeProfesorFromMateria = async (profesorId: number, materiaId: number) => {
  const asignacion = await ProfesorMateria.findOne({
    where: {
      usuario_id: profesorId,
      materia_id: materiaId
    }
  });

  if (!asignacion) {
    throw new AppError('Asignación no encontrada', 404);
  }

  await asignacion.destroy();
  return { message: 'Asignación eliminada correctamente' };
};

// ===== NUEVOS MÉTODOS PARA NAVEGACIÓN DE CURSOS Y DIVISIONES =====
export const getCursoDivisionDetails = async (cursoDivisionId: number) => {
  const { sequelize } = require('../models/db');
  
  // Get basic course division info
  const cursoDivision = await CursoDivision.findByPk(cursoDivisionId, {
    include: [
      { model: Curso, attributes: ['id', 'año'] },
      { model: Division, attributes: ['id', 'division'] }
    ]
  }) as CursoDivisionWithAssociations | null;

  if (!cursoDivision) {
    throw new AppError('Curso división no encontrada', 404);
  }

  // Get students using raw SQL
  const [studentsResult] = await sequelize.query(`
    SELECT DISTINCT u.id, u.dni, u.nombre, u.apellido, u.email, u.activo
    FROM usuario u 
    JOIN usuario_curso uc ON u.id = uc.usuario_id 
    JOIN usuario_rol ur ON u.id = ur.usuario_id 
    JOIN rol r ON ur.rol_id = r.id 
    WHERE uc.curso_division_id = ? AND r.nombre = 'alumno'
    ORDER BY u.apellido, u.nombre
  `, {
    replacements: [cursoDivisionId]
  });

  // Get teachers for this course division through subjects
  const [teachersResult] = await sequelize.query(`
    SELECT DISTINCT u.id, u.dni, u.nombre, u.apellido, u.email, m.nombre as materia_nombre
    FROM usuario u 
    JOIN profesor_materia pm ON u.id = pm.usuario_id 
    JOIN materia m ON pm.materia_id = m.id
    JOIN curso_division_materia cdm ON m.id = cdm.materia_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id 
    JOIN rol r ON ur.rol_id = r.id 
    WHERE cdm.curso_division_id = ? AND r.nombre = 'profesor'
    ORDER BY u.apellido, u.nombre
  `, {
    replacements: [cursoDivisionId]
  });

  // Get subjects for this course division
  const [subjectsResult] = await sequelize.query(`
    SELECT m.id, m.nombre, m.carga_horaria
    FROM materia m
    JOIN curso_division_materia cdm ON m.id = cdm.materia_id
    WHERE cdm.curso_division_id = ?
    ORDER BY m.nombre
  `, {
    replacements: [cursoDivisionId]
  });

  // Get recent attendance records (last 30 days)
  const [attendanceResult] = await sequelize.query(`
    SELECT r.id, r.usuario_id, r.tipo, r.fecha, r.hora,
           u.nombre, u.apellido, u.dni
    FROM registro r
    JOIN usuario u ON r.usuario_id = u.id
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    WHERE uc.curso_division_id = ? 
      AND r.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ORDER BY r.fecha DESC, r.hora DESC
    LIMIT 100
  `, {
    replacements: [cursoDivisionId]
  });

  const cursoData = cursoDivision.Curso;
  const divisionData = cursoDivision.Division;

  return {
    id: cursoDivision.id,
    curso: {
      id: cursoData?.id,
      año: cursoData?.año,
      nombre: `${cursoData?.año}° Año`
    },
    division: {
      id: divisionData?.id,
      nombre: divisionData?.division
    },
    nombre_completo: `${cursoData?.año}° ${divisionData?.division}`,
    estudiantes: studentsResult || [],
    profesores: teachersResult || [],
    materias: subjectsResult || [],
    registros_asistencia: attendanceResult || [],
    estadisticas: {
      total_estudiantes: (studentsResult as any[])?.length || 0,
      total_profesores: (teachersResult as any[])?.length || 0,
      total_materias: (subjectsResult as any[])?.length || 0,
      registros_recientes: (attendanceResult as any[])?.length || 0
    }
  };
};

export const getEstudiantesByCursoDivision = async (cursoDivisionId: number) => {
  const { sequelize } = require('../models/db');
  
  const [studentsResult] = await sequelize.query(`
    SELECT DISTINCT u.id, u.dni, u.nombre, u.apellido, u.email, u.activo,
           u.created_at, u.updated_at
    FROM usuario u 
    JOIN usuario_curso uc ON u.id = uc.usuario_id 
    JOIN usuario_rol ur ON u.id = ur.usuario_id 
    JOIN rol r ON ur.rol_id = r.id 
    WHERE uc.curso_division_id = ? AND r.nombre = 'alumno'
    ORDER BY u.apellido, u.nombre
  `, {
    replacements: [cursoDivisionId]
  });

  return studentsResult;
};

export const getProfesoresByCursoDivision = async (cursoDivisionId: number) => {
  const { sequelize } = require('../models/db');
  
  const [teachersResult] = await sequelize.query(`
    SELECT DISTINCT u.id, u.dni, u.nombre, u.apellido, u.email, u.activo,
           m.nombre as materia_nombre, m.id as materia_id
    FROM usuario u 
    JOIN profesor_materia pm ON u.id = pm.usuario_id 
    JOIN materia m ON pm.materia_id = m.id
    JOIN curso_division_materia cdm ON m.id = cdm.materia_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id 
    JOIN rol r ON ur.rol_id = r.id 
    WHERE cdm.curso_division_id = ? AND r.nombre = 'profesor'
    ORDER BY u.apellido, u.nombre
  `, {
    replacements: [cursoDivisionId]
  });

  return teachersResult;
};

export const getRegistrosAsistenciaByCursoDivision = async (cursoDivisionId: number, fechaDesde?: string, fechaHasta?: string) => {
  const { sequelize } = require('../models/db');
  
  let dateFilter = '';
  let replacements: any[] = [cursoDivisionId];
  
  if (fechaDesde && fechaHasta) {
    dateFilter = 'AND r.fecha BETWEEN ? AND ?';
    replacements.push(fechaDesde, fechaHasta);
  } else if (fechaDesde) {
    dateFilter = 'AND r.fecha >= ?';
    replacements.push(fechaDesde);
  } else {
    // Default to last 30 days
    dateFilter = 'AND r.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  }
  
  const [attendanceResult] = await sequelize.query(`
    SELECT r.id, r.usuario_id, r.tipo, r.fecha, r.hora,
           u.nombre, u.apellido, u.dni, u.email,
           df.nombre as dispositivo_nombre
    FROM registro r
    JOIN usuario u ON r.usuario_id = u.id
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    LEFT JOIN dispositivo_fichaje df ON r.dispositivo_fichaje_id = df.id
    WHERE uc.curso_division_id = ? ${dateFilter}
    ORDER BY r.fecha DESC, r.hora DESC
  `, {
    replacements
  });

  return attendanceResult;
};

export const getDivisionDetail = async (divisionId: number) => {
  const { sequelize } = require('../models/db');
  
  // Get the division basic info from curso_division
  const [divisionData] = await sequelize.query(`
    SELECT 
      cd.id,
      d.division as nombre,
      c.id as curso_id,
      c.año as curso_nombre,
      c.año as curso_nivel
    FROM curso_division cd
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE cd.id = ?
  `, { replacements: [divisionId] });

  if (!divisionData || divisionData.length === 0) {
    throw new AppError('División no encontrada', 404);
  }

  const division = divisionData[0] as any;

  // Get students in this division
  const [alumnos] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      u.dni,
      u.email
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ?
    AND r.nombre = 'alumno'
    ORDER BY u.apellido, u.nombre
  `, { replacements: [divisionId] });

  // Get teachers for this division
  const [profesores] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      m.nombre as materia
    FROM usuario u
    JOIN profesor_materia pm ON u.id = pm.usuario_id
    JOIN materia m ON pm.materia_id = m.id
    JOIN curso_division_materia cdm ON pm.materia_id = cdm.materia_id
    WHERE cdm.curso_division_id = ?
    ORDER BY u.apellido, u.nombre
  `, { replacements: [divisionId] });

  // Get subjects for this division
  const [materias] = await sequelize.query(`
    SELECT DISTINCT
      m.id,
      m.nombre,
      CONCAT(u.apellido, ', ', u.nombre) as profesor
    FROM materia m
    JOIN curso_division_materia cdm ON m.id = cdm.materia_id
    LEFT JOIN profesor_materia pm ON m.id = pm.materia_id
    LEFT JOIN usuario u ON pm.usuario_id = u.id
    WHERE cdm.curso_division_id = ?
    ORDER BY m.nombre
  `, { replacements: [divisionId] });

  // Get attendance records (last 30 days)
  // Note: Since we only have ingreso/egreso, we'll count ingresos as presentes
  const [registrosAsistencia] = await sequelize.query(`
    SELECT 
      DATE(r.fecha) as fecha,
      COUNT(CASE WHEN r.tipo = 'ingreso' THEN 1 END) as presentes,
      0 as ausentes,
      0 as tarde,
      COUNT(DISTINCT uc.usuario_id) as total
    FROM usuario_curso uc
    LEFT JOIN registro r ON uc.usuario_id = r.usuario_id 
      AND DATE(r.fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND r.tipo = 'ingreso'
    WHERE uc.curso_division_id = ?
    GROUP BY DATE(r.fecha)
    ORDER BY fecha DESC
    LIMIT 30
  `, { replacements: [divisionId] });

  return {
    id: division.id,
    nombre: division.nombre,
    curso: {
      id: division.curso_id,
      nombre: division.curso_nombre + '° Año',
      nivel: division.curso_nivel
    },
    alumnos,
    profesores,
    materias,
    registrosAsistencia
  };
};

export const getDailyAttendanceDetail = async (divisionId: number, fecha: string) => {
  const { sequelize } = require('../models/db');
  
  // Get division info
  const [divisionData] = await sequelize.query(`
    SELECT 
      cd.id,
      d.division as division_nombre,
      c.año as curso_año,
      CONCAT(c.año, '° ', d.division) as curso_nombre
    FROM curso_division cd
    JOIN curso c ON cd.curso_id = c.id
    JOIN division d ON cd.division_id = d.id
    WHERE cd.id = ?
  `, { replacements: [divisionId] });

  if (!divisionData || divisionData.length === 0) {
    throw new AppError('División no encontrada', 404);
  }

  const division = divisionData[0] as any;

  // Get all students in this division
  const [allStudents] = await sequelize.query(`
    SELECT DISTINCT
      u.id,
      u.nombre,
      u.apellido,
      u.dni
    FROM usuario u
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    JOIN usuario_rol ur ON u.id = ur.usuario_id
    JOIN rol r ON ur.rol_id = r.id
    WHERE uc.curso_division_id = ?
    AND r.nombre = 'alumno'
    ORDER BY u.apellido, u.nombre
  `, { replacements: [divisionId] });

  // Get attendance records for this specific date
  const [registros] = await sequelize.query(`
    SELECT 
      r.id,
      r.usuario_id,
      r.tipo,
      r.hora,
      r.fecha,
      u.nombre,
      u.apellido,
      u.dni,
      df.nombre as dispositivo,
      CASE 
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) <= '08:30:00' THEN 'presente'
        WHEN r.tipo = 'ingreso' AND TIME(r.hora) > '08:30:00' THEN 'tarde'
        ELSE 'presente'
      END as estado
    FROM registro r
    JOIN usuario u ON r.usuario_id = u.id
    JOIN usuario_curso uc ON u.id = uc.usuario_id
    LEFT JOIN dispositivo_fichaje df ON r.dispositivo_fichaje_id = df.id
    WHERE uc.curso_division_id = ?
    AND DATE(r.fecha) = ?
    AND r.tipo = 'ingreso'
    ORDER BY r.hora ASC
  `, { replacements: [divisionId, fecha] });

  // Find students who are absent (not in attendance records for this date)
  const presentStudentIds = new Set((registros as any[]).map(r => r.usuario_id));
  const estudiantesAusentes = (allStudents as any[]).filter(student => 
    !presentStudentIds.has(student.id)
  );

  // Calculate statistics
  const totalEstudiantes = (allStudents as any[]).length;
  const presentes = (registros as any[]).filter(r => r.estado === 'presente').length;
  const tarde = (registros as any[]).filter(r => r.estado === 'tarde').length;
  const ausentes = estudiantesAusentes.length;
  const porcentajeAsistencia = totalEstudiantes > 0 ? 
    Math.round(((presentes + tarde) / totalEstudiantes) * 100) : 0;

  return {
    division: {
      id: division.id,
      nombre: division.division_nombre,
      curso_nombre: division.curso_nombre
    },
    fecha,
    estadisticas: {
      total_estudiantes: totalEstudiantes,
      presentes,
      ausentes,
      tarde,
      porcentaje_asistencia: porcentajeAsistencia
    },
    registros: (registros as any[]).map(r => ({
      id: r.id,
      estudiante: {
        id: r.usuario_id,
        nombre: r.nombre,
        apellido: r.apellido,
        dni: r.dni
      },
      tipo: r.tipo,
      hora: r.hora,
      dispositivo: r.dispositivo || 'No especificado',
      estado: r.estado
    })),
    estudiantes_ausentes: estudiantesAusentes
  };
};