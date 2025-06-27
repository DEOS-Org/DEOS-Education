import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';
import { Usuario } from './Usuario';
import { Materia } from './Materia';

interface PromedioAlumnoAttributes {
  id: number;
  alumno_usuario_id: number;
  materia_id?: number;
  trimestre: number;
  promedio: number;
  promedio_general?: number;
  cantidad_notas: number;
  estado: 'Aprobado' | 'Desaprobado' | 'Pendiente';
  fecha_calculo: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface PromedioAlumnoCreationAttributes extends Optional<PromedioAlumnoAttributes, 'id' | 'materia_id' | 'promedio_general' | 'created_at' | 'updated_at'> {}

export class PromedioAlumno extends Model<PromedioAlumnoAttributes, PromedioAlumnoCreationAttributes> implements PromedioAlumnoAttributes {
  public id!: number;
  public alumno_usuario_id!: number;
  public materia_id?: number;
  public trimestre!: number;
  public promedio!: number;
  public promedio_general?: number;
  public cantidad_notas!: number;
  public estado!: 'Aprobado' | 'Desaprobado' | 'Pendiente';
  public fecha_calculo!: Date;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;

  // Asociaciones
  public readonly alumno?: Usuario;
  public readonly materia?: Materia;

  // Métodos estáticos para gestión de promedios
  static async actualizarPromedios(alumnoId: number, materiaId?: number, trimestre?: number): Promise<void> {
    const { Nota } = await import('./Nota');

    // Si se especifica materia y trimestre, actualizar ese promedio específico
    if (materiaId && trimestre) {
      const promedio = await Nota.calcularPromedioPorMateria(alumnoId, materiaId, trimestre);
      const cantidadNotas = await Nota.count({
        where: {
          alumno_usuario_id: alumnoId,
          materia_id: materiaId,
          trimestre: trimestre
        }
      });

      await PromedioAlumno.upsert({
        alumno_usuario_id: alumnoId,
        materia_id: materiaId,
        trimestre: trimestre,
        promedio: promedio,
        cantidad_notas: cantidadNotas,
        estado: promedio >= 6 ? 'Aprobado' : promedio >= 4 ? 'Pendiente' : 'Desaprobado',
        fecha_calculo: new Date()
      });
    }

    // Calcular promedio general por trimestre
    if (trimestre) {
      const promedioGeneral = await Nota.calcularPromedioGeneral(alumnoId, trimestre);
      
      await PromedioAlumno.upsert({
        alumno_usuario_id: alumnoId,
        trimestre: trimestre,
        promedio: promedioGeneral,
        promedio_general: promedioGeneral,
        cantidad_notas: 0, // Para promedios generales
        estado: promedioGeneral >= 6 ? 'Aprobado' : promedioGeneral >= 4 ? 'Pendiente' : 'Desaprobado',
        fecha_calculo: new Date()
      });
    }
  }

  static async obtenerBoletinCompleto(alumnoId: number, trimestre?: number): Promise<any> {
    const whereClause: any = {
      alumno_usuario_id: alumnoId
    };

    if (trimestre) {
      whereClause.trimestre = trimestre;
    }

    const promedios = await PromedioAlumno.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'alumno',
          attributes: ['id', 'nombre', 'apellido', 'dni']
        },
        {
          model: Materia,
          as: 'materia',
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['trimestre', 'ASC'], ['materia_id', 'ASC']]
    });

    // Organizar datos por trimestre
    const boletinPorTrimestre: any = {};

    for (const promedio of promedios) {
      const trim = promedio.trimestre;
      
      if (!boletinPorTrimestre[trim]) {
        boletinPorTrimestre[trim] = {
          trimestre: trim,
          materias: [],
          promedio_general: null,
          estado_general: 'Pendiente'
        };
      }

      if (promedio.materia_id) {
        // Promedio por materia
        boletinPorTrimestre[trim].materias.push({
          materia: promedio.materia,
          promedio: promedio.promedio,
          cantidad_notas: promedio.cantidad_notas,
          estado: promedio.estado
        });
      } else {
        // Promedio general del trimestre
        boletinPorTrimestre[trim].promedio_general = promedio.promedio;
        boletinPorTrimestre[trim].estado_general = promedio.estado;
      }
    }

    return {
      alumno: promedios[0]?.alumno || null,
      boletines: Object.values(boletinPorTrimestre)
    };
  }
}

PromedioAlumno.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    alumno_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id',
      },
    },
    materia_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Materia,
        key: 'id',
      },
    },
    trimestre: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 3,
      },
    },
    promedio: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    promedio_general: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 10,
      },
    },
    cantidad_notas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.ENUM('Aprobado', 'Desaprobado', 'Pendiente'),
      allowNull: false,
      defaultValue: 'Pendiente',
    },
    fecha_calculo: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'promedio_alumno',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['alumno_usuario_id', 'materia_id', 'trimestre'],
        name: 'idx_promedio_alumno_materia_trimestre'
      },
      {
        unique: true,
        fields: ['alumno_usuario_id', 'trimestre'],
        where: {
          materia_id: null
        },
        name: 'idx_promedio_general_trimestre'
      }
    ]
  }
);

// Asociaciones
PromedioAlumno.belongsTo(Usuario, {
  foreignKey: 'alumno_usuario_id',
  as: 'alumno',
});

PromedioAlumno.belongsTo(Materia, {
  foreignKey: 'materia_id',
  as: 'materia',
});

export default PromedioAlumno;