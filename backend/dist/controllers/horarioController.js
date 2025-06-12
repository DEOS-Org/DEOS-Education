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
exports.getHorarioById = exports.deleteHorario = exports.updateHorario = exports.getHorariosByProfesor = exports.getHorariosByCurso = exports.createHorario = void 0;
const horarioService = __importStar(require("../services/horarioService"));
const createHorario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { curso_division_id, dia, hora_inicio, hora_fin, curso_division_materia_id, profesor_usuario_id } = req.body;
        // Validaciones básicas
        if (!curso_division_id || !dia || !hora_inicio || !hora_fin ||
            !curso_division_materia_id || !profesor_usuario_id) {
            return res.status(400).json({
                message: 'Todos los campos son requeridos'
            });
        }
        const horario = yield horarioService.createHorario({
            curso_division_id,
            dia,
            hora_inicio,
            hora_fin,
            curso_division_materia_id,
            profesor_usuario_id
        });
        res.status(201).json({
            message: 'Horario creado exitosamente',
            horario
        });
    }
    catch (error) {
        console.error('Error in createHorario:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.createHorario = createHorario;
const getHorariosByCurso = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { curso_division_id } = req.params;
        const horarios = yield horarioService.getHorariosByCurso(parseInt(curso_division_id));
        res.json(horarios);
    }
    catch (error) {
        console.error('Error in getHorariosByCurso:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getHorariosByCurso = getHorariosByCurso;
const getHorariosByProfesor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { profesor_id } = req.params;
        const horarios = yield horarioService.getHorariosByProfesor(parseInt(profesor_id));
        res.json(horarios);
    }
    catch (error) {
        console.error('Error in getHorariosByProfesor:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getHorariosByProfesor = getHorariosByProfesor;
const updateHorario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const horario = yield horarioService.updateHorario(parseInt(id), updateData);
        res.json({
            message: 'Horario actualizado exitosamente',
            horario
        });
    }
    catch (error) {
        console.error('Error in updateHorario:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.updateHorario = updateHorario;
const deleteHorario = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield horarioService.deleteHorario(parseInt(id));
        res.json({ message: 'Horario eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error in deleteHorario:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.deleteHorario = deleteHorario;
const getHorarioById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const horario = yield require('../models').Horario.findByPk(id, {
            include: [
                {
                    model: require('../models').CursoDivision,
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
                    model: require('../models').CursoDivisionMateria,
                    include: [
                        {
                            model: require('../models').Materia,
                            attributes: ['id', 'nombre', 'carga_horaria']
                        }
                    ]
                },
                {
                    model: require('../models').Usuario,
                    as: 'Profesor',
                    attributes: ['id', 'nombre', 'apellido']
                }
            ]
        });
        if (!horario) {
            return res.status(404).json({
                message: 'Horario no encontrado'
            });
        }
        res.json(horario);
    }
    catch (error) {
        console.error('Error in getHorarioById:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});
exports.getHorarioById = getHorarioById;
