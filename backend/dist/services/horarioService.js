"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHorario = exports.updateHorario = exports.getHorariosByProfesor = exports.getHorariosByCurso = exports.createHorario = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const logService = __importStar(require("./logService"));
const sequelize_1 = require("sequelize");
const createHorario = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validaciones
        yield validateHorarioData(data);
        // Verificar conflictos
        yield checkScheduleConflicts(data);
        const horario = yield models_1.Horario.create(data);
        // Log del evento
        yield logService.logUserAction(data.profesor_usuario_id, `Horario creado para ${data.dia} ${data.hora_inicio}-${data.hora_fin}`, 'GESTION_HORARIOS');
        return horario;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error creating horario:', error);
        throw new AppError_1.AppError('Error al crear el horario');
    }
});
exports.createHorario = createHorario;
const validateHorarioData = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar que el curso-división existe
    const cursoDivision = yield models_1.CursoDivision.findByPk(data.curso_division_id);
    if (!cursoDivision) {
        throw new AppError_1.AppError('Curso-división no encontrado');
    }
    // Verificar que el curso-división-materia existe y pertenece al curso-división
    const cdMateria = yield models_1.CursoDivisionMateria.findOne({
        where: {
            id: data.curso_division_materia_id,
            curso_division_id: data.curso_division_id
        }
    });
    if (!cdMateria) {
        throw new AppError_1.AppError('La materia no está asignada a este curso-división');
    }
    // Verificar que el profesor existe y tiene el rol de profesor
    const profesor = yield models_1.Usuario.findByPk(data.profesor_usuario_id, {
        include: [
            {
                model: require('../models').Rol,
                where: { nombre: 'profesor' },
                through: { attributes: [] }
            }
        ]
    });
    if (!profesor) {
        throw new AppError_1.AppError('El usuario no es un profesor válido');
    }
    // Verificar que el profesor puede dar esta materia
    const profesorMateria = yield models_1.ProfesorMateria.findOne({
        where: {
            usuario_id: data.profesor_usuario_id,
            materia_id: cdMateria.materia_id
        }
    });
    if (!profesorMateria) {
        throw new AppError_1.AppError('El profesor no está habilitado para dar esta materia');
    }
    // Validar formato de horas
    if (!isValidTimeFormat(data.hora_inicio) || !isValidTimeFormat(data.hora_fin)) {
        throw new AppError_1.AppError('Formato de hora inválido. Use HH:MM:SS');
    }
    // Validar que hora_fin > hora_inicio
    if (data.hora_fin <= data.hora_inicio) {
        throw new AppError_1.AppError('La hora de fin debe ser posterior a la hora de inicio');
    }
});
const isValidTimeFormat = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(time);
};
const checkScheduleConflicts = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar conflicto de profesor
    const profesorConflict = yield models_1.Horario.findOne({
        where: {
            profesor_usuario_id: data.profesor_usuario_id,
            dia: data.dia,
            [sequelize_1.Op.or]: [
                {
                    // El nuevo horario empieza durante una clase existente
                    hora_inicio: {
                        [sequelize_1.Op.lte]: data.hora_inicio
                    },
                    hora_fin: {
                        [sequelize_1.Op.gt]: data.hora_inicio
                    }
                },
                {
                    // El nuevo horario termina durante una clase existente
                    hora_inicio: {
                        [sequelize_1.Op.lt]: data.hora_fin
                    },
                    hora_fin: {
                        [sequelize_1.Op.gte]: data.hora_fin
                    }
                },
                {
                    // El nuevo horario contiene completamente una clase existente
                    hora_inicio: {
                        [sequelize_1.Op.gte]: data.hora_inicio
                    },
                    hora_fin: {
                        [sequelize_1.Op.lte]: data.hora_fin
                    }
                }
            ]
        }
    });
    if (profesorConflict) {
        throw new AppError_1.AppError('El profesor ya tiene una clase asignada en ese horario');
    }
    // Verificar conflicto de curso-división
    const cursoConflict = yield models_1.Horario.findOne({
        where: {
            curso_division_id: data.curso_division_id,
            dia: data.dia,
            [sequelize_1.Op.or]: [
                {
                    hora_inicio: {
                        [sequelize_1.Op.lte]: data.hora_inicio
                    },
                    hora_fin: {
                        [sequelize_1.Op.gt]: data.hora_inicio
                    }
                },
                {
                    hora_inicio: {
                        [sequelize_1.Op.lt]: data.hora_fin
                    },
                    hora_fin: {
                        [sequelize_1.Op.gte]: data.hora_fin
                    }
                },
                {
                    hora_inicio: {
                        [sequelize_1.Op.gte]: data.hora_inicio
                    },
                    hora_fin: {
                        [sequelize_1.Op.lte]: data.hora_fin
                    }
                }
            ]
        }
    });
    if (cursoConflict) {
        throw new AppError_1.AppError('El curso ya tiene una clase asignada en ese horario');
    }
});
const getHorariosByCurso = (curso_division_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield models_1.Horario.findAll({
            where: { curso_division_id },
            include: [
                {
                    model: models_1.CursoDivisionMateria,
                    include: [
                        {
                            model: models_1.Materia,
                            attributes: ['id', 'nombre', 'carga_horaria']
                        }
                    ]
                },
                {
                    model: models_1.Usuario,
                    as: 'Profesor',
                    attributes: ['id', 'nombre', 'apellido']
                }
            ],
            order: [
                ['dia', 'ASC'],
                ['hora_inicio', 'ASC']
            ]
        });
    }
    catch (error) {
        console.error('Error getting horarios by curso:', error);
        throw new AppError_1.AppError('Error al obtener los horarios del curso');
    }
});
exports.getHorariosByCurso = getHorariosByCurso;
const getHorariosByProfesor = (profesor_usuario_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield models_1.Horario.findAll({
            where: { profesor_usuario_id },
            include: [
                {
                    model: models_1.CursoDivision,
                    include: [
                        {
                            model: require('../models').Curso,
                            attributes: ['año']
                        },
                        {
                            model: require('../models').Division,
                            attributes: ['division']
                        }
                    ]
                },
                {
                    model: models_1.CursoDivisionMateria,
                    include: [
                        {
                            model: models_1.Materia,
                            attributes: ['id', 'nombre', 'carga_horaria']
                        }
                    ]
                }
            ],
            order: [
                ['dia', 'ASC'],
                ['hora_inicio', 'ASC']
            ]
        });
    }
    catch (error) {
        console.error('Error getting horarios by profesor:', error);
        throw new AppError_1.AppError('Error al obtener los horarios del profesor');
    }
});
exports.getHorariosByProfesor = getHorariosByProfesor;
const updateHorario = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const horario = yield models_1.Horario.findByPk(id);
        if (!horario) {
            throw new AppError_1.AppError('Horario no encontrado');
        }
        // Si se están actualizando campos críticos, validar nuevamente
        if (data.curso_division_materia_id || data.profesor_usuario_id ||
            data.dia || data.hora_inicio || data.hora_fin) {
            const updatedData = Object.assign(Object.assign({}, horario.toJSON()), data);
            yield validateHorarioData(updatedData);
            // Verificar conflictos excluyendo el horario actual
            yield checkScheduleConflictsForUpdate(id, updatedData);
        }
        yield horario.update(data);
        // Log del evento
        yield logService.logUserAction(horario.profesor_usuario_id, `Horario actualizado (ID: ${id})`, 'GESTION_HORARIOS');
        return horario;
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error updating horario:', error);
        throw new AppError_1.AppError('Error al actualizar el horario');
    }
});
exports.updateHorario = updateHorario;
const checkScheduleConflictsForUpdate = (horarioId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Similar a checkScheduleConflicts pero excluyendo el horario actual
    const profesorConflict = yield models_1.Horario.findOne({
        where: {
            id: { [sequelize_1.Op.ne]: horarioId },
            profesor_usuario_id: data.profesor_usuario_id,
            dia: data.dia,
            [sequelize_1.Op.or]: [
                {
                    hora_inicio: { [sequelize_1.Op.lte]: data.hora_inicio },
                    hora_fin: { [sequelize_1.Op.gt]: data.hora_inicio }
                },
                {
                    hora_inicio: { [sequelize_1.Op.lt]: data.hora_fin },
                    hora_fin: { [sequelize_1.Op.gte]: data.hora_fin }
                },
                {
                    hora_inicio: { [sequelize_1.Op.gte]: data.hora_inicio },
                    hora_fin: { [sequelize_1.Op.lte]: data.hora_fin }
                }
            ]
        }
    });
    if (profesorConflict) {
        throw new AppError_1.AppError('El profesor ya tiene una clase asignada en ese horario');
    }
    const cursoConflict = yield models_1.Horario.findOne({
        where: {
            id: { [sequelize_1.Op.ne]: horarioId },
            curso_division_id: data.curso_division_id,
            dia: data.dia,
            [sequelize_1.Op.or]: [
                {
                    hora_inicio: { [sequelize_1.Op.lte]: data.hora_inicio },
                    hora_fin: { [sequelize_1.Op.gt]: data.hora_inicio }
                },
                {
                    hora_inicio: { [sequelize_1.Op.lt]: data.hora_fin },
                    hora_fin: { [sequelize_1.Op.gte]: data.hora_fin }
                },
                {
                    hora_inicio: { [sequelize_1.Op.gte]: data.hora_inicio },
                    hora_fin: { [sequelize_1.Op.lte]: data.hora_fin }
                }
            ]
        }
    });
    if (cursoConflict) {
        throw new AppError_1.AppError('El curso ya tiene una clase asignada en ese horario');
    }
});
const deleteHorario = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const horario = yield models_1.Horario.findByPk(id);
        if (!horario) {
            throw new AppError_1.AppError('Horario no encontrado');
        }
        yield horario.destroy();
        // Log del evento
        yield logService.logUserAction(horario.profesor_usuario_id, `Horario eliminado (ID: ${id})`, 'GESTION_HORARIOS');
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error('Error deleting horario:', error);
        throw new AppError_1.AppError('Error al eliminar el horario');
    }
});
exports.deleteHorario = deleteHorario;
