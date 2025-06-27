import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './db';
import { Usuario } from './Usuario';
import { Materia } from './Materia';
import { TipoEvaluacion } from './TipoEvaluacion';

interface NotaAttributes {
  id: number;
  alumno_usuario_id: number;
  materia_id: number;
  tipo_evaluacion_id: number;
  calificacion: number;
  concepto?: string;
  fecha: Date;
  observaciones?: string;
  trimestre?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface NotaCreationAttributes extends Optional<NotaAttributes, 'id' | 'concepto' | 'observaciones' | 'trimestre' | 'created_at' | 'updated_at'> {}

export class Nota extends Model<NotaAttributes, NotaCreationAttributes> implements NotaAttributes {
  public id!: number;
  public alumno_usuario_id!: number;
  public materia_id!: number;
  public tipo_evaluacion_id!: number;
  public calificacion!: number;
  public concepto?: string;
  public fecha!: Date;
  public observaciones?: string;
  public trimestre?: number;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;

  // Asociaciones
  public readonly alumno?: Usuario;
  public readonly materia?: Materia;
  public readonly tipoEvaluacion?: TipoEvaluacion;

  // Métodos estáticos para cálculos
  static async calcularPromedioPorMateria(alumnoId: number, materiaId: number, trimestre?: number): Promise<number> {
    const whereClause: any = {
      alumno_usuario_id: alumnoId,
      materia_id: materiaId
    };
    
    if (trimestre) {
      whereClause.trimestre = trimestre;
    }

    const notas = await Nota.findAll({
      where: whereClause,
      include: [
        {
          model: TipoEvaluacion,
          as: 'tipoEvaluacion'
        }
      ]
    });

    if (notas.length === 0) return 0;

    // Calcular promedio ponderado por peso del tipo de evaluación
    let sumaCalificaciones = 0;
    let sumaPesos = 0;

    for (const nota of notas) {
      const peso = nota.tipoEvaluacion?.peso || 1;
      sumaCalificaciones += nota.calificacion * peso;
      sumaPesos += peso;
    }

    return Math.round((sumaCalificaciones / sumaPesos) * 100) / 100;
  }

  static async calcularPromedioGeneral(alumnoId: number, trimestre?: number): Promise<number> {
    const whereClause: any = {
      alumno_usuario_id: alumnoId
    };
    
    if (trimestre) {
      whereClause.trimestre = trimestre;
    }

    const notas = await Nota.findAll({
      where: whereClause,
      include: [
        {
          model: Materia,
          as: 'materia'
        },
        {
          model: TipoEvaluacion,
          as: 'tipoEvaluacion'
        }
      ]
    });

    if (notas.length === 0) return 0;

    // Agrupar por materia y calcular promedio por materia
    const promediosPorMateria = new Map<number, number>();
    const materias = new Set<number>();

    for (const nota of notas) {
      materias.add(nota.materia_id);
    }

    for (const materiaId of materias) {
      const promedio = await this.calcularPromedioPorMateria(alumnoId, materiaId, trimestre);
      promediosPorMateria.set(materiaId, promedio);
    }

    // Calcular promedio general
    const promedios = Array.from(promediosPorMateria.values());
    const suma = promedios.reduce((acc, promedio) => acc + promedio, 0);
    
    return Math.round((suma / promedios.length) * 100) / 100;
  }

  static mapCalificacionToConcepto(calificacion: number): string {
    if (calificacion >= 9) return 'Excelente';
    if (calificacion >= 8) return 'Muy Bueno';
    if (calificacion >= 7) return 'Bueno';
    if (calificacion >= 6) return 'Satisfactorio';
    if (calificacion >= 4) return 'Regular';
    return 'Insuficiente';
  }
}

Nota.init(
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
      allowNull: false,
      references: {
        model: Materia,
        key: 'id',
      },
    },
    tipo_evaluacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tipo_evaluacion',
        key: 'id',
      },
    },
    calificacion: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    concepto: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trimestre: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 3,
      },
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
    tableName: 'nota',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (nota: Nota) => {
        // Auto-calcular concepto basado en calificación
        nota.concepto = Nota.mapCalificacionToConcepto(nota.calificacion);
      },
    },
  }
);

// Asociaciones
Nota.belongsTo(Usuario, {
  foreignKey: 'alumno_usuario_id',
  as: 'alumno',
});

Nota.belongsTo(Materia, {
  foreignKey: 'materia_id',
  as: 'materia',
});

export default Nota;