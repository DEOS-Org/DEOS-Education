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
exports.removeProfesorFromMateria = exports.assignProfesorToMateria = exports.getAsignaciones = exports.deleteHorario = exports.updateHorario = exports.createHorario = exports.getHorariosByCurso = exports.getHorarios = exports.deleteMateria = exports.updateMateria = exports.createMateria = exports.getMaterias = exports.deleteDivision = exports.updateDivision = exports.createDivision = exports.getDivisionesByCurso = exports.getDivisiones = exports.deleteCurso = exports.updateCurso = exports.createCurso = exports.getCursos = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
const AppError_1 = require("../utils/AppError");
const academicService = __importStar(require("../services/academicService"));
// ===== CURSOS =====
exports.getCursos = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cursos = yield academicService.getCursos();
    res.json(cursos);
}));
exports.createCurso = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, nivel, descripcion } = req.body;
    if (!nombre || !nivel) {
        throw new AppError_1.AppError('El nombre y nivel son requeridos', 400);
    }
    const curso = yield academicService.createCurso({
        nombre,
        nivel,
        descripcion,
        activo: true
    });
    res.status(201).json(curso);
}));
exports.updateCurso = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, nivel, descripcion, activo } = req.body;
    const curso = yield academicService.updateCurso(Number(id), {
        nombre,
        nivel,
        descripcion,
        activo
    });
    res.json(curso);
}));
exports.deleteCurso = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield academicService.deleteCurso(Number(id));
    res.json({ message: 'Curso eliminado exitosamente' });
}));
// ===== DIVISIONES =====
exports.getDivisiones = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const divisiones = yield academicService.getDivisiones();
    res.json(divisiones);
}));
exports.getDivisionesByCurso = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cursoId } = req.params;
    const divisiones = yield academicService.getDivisionesByCurso(Number(cursoId));
    res.json(divisiones);
}));
exports.createDivision = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre } = req.body;
    if (!nombre) {
        throw new AppError_1.AppError('El nombre es requerido', 400);
    }
    const division = yield academicService.createDivision({
        nombre,
        activo: true
    });
    res.status(201).json(division);
}));
exports.updateDivision = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, activo } = req.body;
    const division = yield academicService.updateDivision(Number(id), {
        nombre,
        activo
    });
    res.json(division);
}));
exports.deleteDivision = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield academicService.deleteDivision(Number(id));
    res.json({ message: 'División eliminada exitosamente' });
}));
// ===== MATERIAS =====
exports.getMaterias = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const materias = yield academicService.getMaterias();
    res.json(materias);
}));
exports.createMateria = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, carga_horaria } = req.body;
    if (!nombre || !carga_horaria) {
        throw new AppError_1.AppError('El nombre y la carga horaria son requeridos', 400);
    }
    const materia = yield academicService.createMateria({
        nombre,
        carga_horaria,
        activo: true
    });
    res.status(201).json(materia);
}));
exports.updateMateria = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, carga_horaria, activo } = req.body;
    const materia = yield academicService.updateMateria(Number(id), {
        nombre,
        carga_horaria,
        activo
    });
    res.json(materia);
}));
exports.deleteMateria = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield academicService.deleteMateria(Number(id));
    res.json({ message: 'Materia eliminada exitosamente' });
}));
// ===== HORARIOS =====
exports.getHorarios = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const horarios = yield academicService.getHorarios();
    res.json(horarios);
}));
exports.getHorariosByCurso = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cursoId } = req.params;
    const horarios = yield academicService.getHorariosByCurso(Number(cursoId));
    res.json(horarios);
}));
exports.createHorario = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { curso_division_materia_id, dia, hora_inicio, hora_fin, aula, profesor_usuario_id } = req.body;
    if (!curso_division_materia_id || !dia || !hora_inicio || !hora_fin) {
        throw new AppError_1.AppError('Todos los campos obligatorios deben ser proporcionados', 400);
    }
    const horario = yield academicService.createHorario({
        curso_division_materia_id,
        dia,
        hora_inicio,
        hora_fin,
        aula,
        profesor_usuario_id
    });
    res.status(201).json(horario);
}));
exports.updateHorario = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { curso_division_materia_id, dia, hora_inicio, hora_fin, aula, profesor_usuario_id } = req.body;
    const horario = yield academicService.updateHorario(Number(id), {
        curso_division_materia_id,
        dia,
        hora_inicio,
        hora_fin,
        aula,
        profesor_usuario_id
    });
    res.json(horario);
}));
exports.deleteHorario = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield academicService.deleteHorario(Number(id));
    res.json({ message: 'Horario eliminado exitosamente' });
}));
// ===== ASIGNACIONES =====
exports.getAsignaciones = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const asignaciones = yield academicService.getAsignaciones();
    res.json(asignaciones);
}));
exports.assignProfesorToMateria = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { profesor_usuario_id, materia_id } = req.body;
    if (!profesor_usuario_id || !materia_id) {
        throw new AppError_1.AppError('El profesor y la materia son requeridos', 400);
    }
    const asignacion = yield academicService.assignProfesorToMateria(profesor_usuario_id, materia_id);
    res.status(201).json(asignacion);
}));
exports.removeProfesorFromMateria = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { profesorId, materiaId } = req.params;
    yield academicService.removeProfesorFromMateria(Number(profesorId), Number(materiaId));
    res.json({ message: 'Asignación eliminada exitosamente' });
}));
