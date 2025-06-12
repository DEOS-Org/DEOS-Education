"use strict";
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
exports.removeProfesorFromMateria = exports.assignProfesorToMateria = exports.deleteHorario = exports.updateHorario = exports.getHorariosByCurso = exports.deleteAsignacion = exports.createAsignacion = exports.getAsignaciones = exports.createHorario = exports.getHorarios = exports.deleteMateria = exports.updateMateria = exports.createMateria = exports.getMaterias = exports.createCursoDivision = exports.deleteDivision = exports.updateDivision = exports.createDivision = exports.getDivisionesByCurso = exports.getCursosDivisiones = exports.getDivisiones = exports.deleteCurso = exports.updateCurso = exports.createCurso = exports.getCursos = void 0;
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const sequelize_1 = require("sequelize");
// ===== CURSOS =====
const getCursos = () => __awaiter(void 0, void 0, void 0, function* () {
    const cursos = yield models_1.Curso.findAll({
        order: [['año', 'ASC']]
    });
    // Transform to match frontend expectations
    return cursos.map(curso => ({
        id: curso.id,
        nombre: `${curso.año}° Año`,
        nivel: `${curso.año}`,
        descripcion: `Curso de ${curso.año}° año`,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
});
exports.getCursos = getCursos;
const createCurso = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extract año from nivel or nombre
    const año = parseInt(data.nivel) || parseInt(((_a = data.nombre.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || '1');
    if (año < 1 || año > 6) {
        throw new AppError_1.AppError('El año debe estar entre 1 y 6', 400);
    }
    // Check if exists
    const existe = yield models_1.Curso.findOne({ where: { año } });
    if (existe) {
        throw new AppError_1.AppError('Ya existe un curso con ese año', 400);
    }
    const curso = yield models_1.Curso.create({ año });
    return {
        id: curso.id,
        nombre: `${curso.año}° Año`,
        nivel: `${curso.año}`,
        descripcion: `Curso de ${curso.año}° año`,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.createCurso = createCurso;
const updateCurso = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const curso = yield models_1.Curso.findByPk(id);
    if (!curso) {
        throw new AppError_1.AppError('Curso no encontrado', 404);
    }
    const año = parseInt(data.nivel) || parseInt(((_a = data.nombre.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || '1');
    if (año < 1 || año > 6) {
        throw new AppError_1.AppError('El año debe estar entre 1 y 6', 400);
    }
    // Check if another curso with this año exists
    const existe = yield models_1.Curso.findOne({
        where: {
            año,
            id: { [sequelize_1.Op.ne]: id }
        }
    });
    if (existe) {
        throw new AppError_1.AppError('Ya existe un curso con ese año', 400);
    }
    yield curso.update({ año });
    return {
        id: curso.id,
        nombre: `${curso.año}° Año`,
        nivel: `${curso.año}`,
        descripcion: `Curso de ${curso.año}° año`,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.updateCurso = updateCurso;
const deleteCurso = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const curso = yield models_1.Curso.findByPk(id);
    if (!curso) {
        throw new AppError_1.AppError('Curso no encontrado', 404);
    }
    // Check if has divisions
    const divisiones = yield models_1.CursoDivision.findAll({ where: { curso_id: id } });
    if (divisiones.length > 0) {
        throw new AppError_1.AppError('No se puede eliminar un curso que tiene divisiones asignadas', 400);
    }
    yield curso.destroy();
    return { message: 'Curso eliminado correctamente' };
});
exports.deleteCurso = deleteCurso;
// ===== DIVISIONES =====
const getDivisiones = () => __awaiter(void 0, void 0, void 0, function* () {
    const divisiones = yield models_1.Division.findAll({
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
});
exports.getDivisiones = getDivisiones;
const getCursosDivisiones = () => __awaiter(void 0, void 0, void 0, function* () {
    const cursoDivisions = yield models_1.CursoDivision.findAll({
        include: [
            { model: models_1.Curso, attributes: ['id', 'año'] },
            { model: models_1.Division, attributes: ['id', 'division'] }
        ],
        order: [[models_1.Curso, 'año', 'ASC'], [models_1.Division, 'division', 'ASC']]
    });
    return cursoDivisions.map(cd => {
        const cursoData = cd.Curso;
        const divisionData = cd.Division;
        return {
            id: cd.id,
            nombre: (divisionData === null || divisionData === void 0 ? void 0 : divisionData.division) || 'Sin nombre',
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
});
exports.getCursosDivisiones = getCursosDivisiones;
const getDivisionesByCurso = (cursoId) => __awaiter(void 0, void 0, void 0, function* () {
    const cursoDivisions = yield models_1.CursoDivision.findAll({
        where: { curso_id: cursoId },
        include: [
            { model: models_1.Curso, attributes: ['id', 'año'] },
            { model: models_1.Division, attributes: ['id', 'division'] }
        ],
        order: [[models_1.Division, 'division', 'ASC']]
    });
    return cursoDivisions.map(cd => {
        const cursoData = cd.Curso;
        const divisionData = cd.Division;
        return {
            id: cd.id,
            nombre: (divisionData === null || divisionData === void 0 ? void 0 : divisionData.division) || 'Sin nombre',
            curso_id: cd.curso_id,
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
    });
});
exports.getDivisionesByCurso = getDivisionesByCurso;
const createDivision = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if exists
    const existe = yield models_1.Division.findOne({ where: { division: data.nombre } });
    if (existe) {
        throw new AppError_1.AppError('Ya existe una división con ese nombre', 400);
    }
    const division = yield models_1.Division.create({ division: data.nombre });
    return {
        id: division.id,
        nombre: division.division,
        descripcion: `División ${division.division}`,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.createDivision = createDivision;
const updateDivision = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const division = yield models_1.Division.findByPk(id);
    if (!division) {
        throw new AppError_1.AppError('División no encontrada', 404);
    }
    // Check if another division with this name exists
    const existe = yield models_1.Division.findOne({
        where: {
            division: data.nombre,
            id: { [sequelize_1.Op.ne]: id }
        }
    });
    if (existe) {
        throw new AppError_1.AppError('Ya existe una división con ese nombre', 400);
    }
    yield division.update({ division: data.nombre });
    return {
        id: division.id,
        nombre: division.division,
        descripcion: `División ${division.division}`,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.updateDivision = updateDivision;
const deleteDivision = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const division = yield models_1.Division.findByPk(id);
    if (!division) {
        throw new AppError_1.AppError('División no encontrada', 404);
    }
    // Check if has curso divisions
    const cursoDivisiones = yield models_1.CursoDivision.findAll({ where: { division_id: id } });
    if (cursoDivisiones.length > 0) {
        throw new AppError_1.AppError('No se puede eliminar una división que está asignada a cursos', 400);
    }
    yield division.destroy();
    return { message: 'División eliminada correctamente' };
});
exports.deleteDivision = deleteDivision;
const createCursoDivision = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if exists
    const existe = yield models_1.CursoDivision.findOne({
        where: {
            curso_id: data.curso_id,
            division_id: data.division_id
        }
    });
    if (existe) {
        throw new AppError_1.AppError('Ya existe esa combinación de curso y división', 400);
    }
    const cursoDivision = yield models_1.CursoDivision.create({
        curso_id: data.curso_id,
        division_id: data.division_id
    });
    // Get with relations for response
    const cursoDivisionConRelaciones = yield models_1.CursoDivision.findByPk(cursoDivision.id, {
        include: [
            { model: models_1.Curso, attributes: ['id', 'año'] },
            { model: models_1.Division, attributes: ['id', 'division'] }
        ]
    });
    const cursoData = cursoDivisionConRelaciones === null || cursoDivisionConRelaciones === void 0 ? void 0 : cursoDivisionConRelaciones.Curso;
    const divisionData = cursoDivisionConRelaciones === null || cursoDivisionConRelaciones === void 0 ? void 0 : cursoDivisionConRelaciones.Division;
    return {
        id: cursoDivisionConRelaciones.id,
        nombre: (divisionData === null || divisionData === void 0 ? void 0 : divisionData.division) || 'Sin nombre',
        curso_id: cursoDivisionConRelaciones.curso_id,
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
});
exports.createCursoDivision = createCursoDivision;
// ===== MATERIAS =====
const getMaterias = () => __awaiter(void 0, void 0, void 0, function* () {
    const materias = yield models_1.Materia.findAll({
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
});
exports.getMaterias = getMaterias;
const createMateria = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const existe = yield models_1.Materia.findOne({ where: { nombre: data.nombre } });
    if (existe) {
        throw new AppError_1.AppError('Ya existe una materia con ese nombre', 400);
    }
    const materia = yield models_1.Materia.create({
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
});
exports.createMateria = createMateria;
const updateMateria = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const materia = yield models_1.Materia.findByPk(id);
    if (!materia) {
        throw new AppError_1.AppError('Materia no encontrada', 404);
    }
    const existe = yield models_1.Materia.findOne({
        where: {
            nombre: data.nombre,
            id: { [sequelize_1.Op.ne]: id }
        }
    });
    if (existe) {
        throw new AppError_1.AppError('Ya existe una materia con ese nombre', 400);
    }
    yield materia.update({
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
});
exports.updateMateria = updateMateria;
const deleteMateria = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const materia = yield models_1.Materia.findByPk(id);
    if (!materia) {
        throw new AppError_1.AppError('Materia no encontrada', 404);
    }
    // Check if has curso division materias
    const cursoDivisionMaterias = yield models_1.CursoDivisionMateria.findAll({ where: { materia_id: id } });
    if (cursoDivisionMaterias.length > 0) {
        throw new AppError_1.AppError('No se puede eliminar una materia que está asignada a cursos', 400);
    }
    yield materia.destroy();
    return { message: 'Materia eliminada correctamente' };
});
exports.deleteMateria = deleteMateria;
// ===== HORARIOS =====
const getHorarios = () => __awaiter(void 0, void 0, void 0, function* () {
    const horarios = yield models_1.Horario.findAll({
        include: [
            {
                model: models_1.CursoDivisionMateria,
                include: [
                    { model: models_1.Materia, attributes: ['id', 'nombre'] },
                    {
                        model: models_1.CursoDivision,
                        include: [
                            { model: models_1.Curso, attributes: ['id', 'año'] },
                            { model: models_1.Division, attributes: ['id', 'division'] }
                        ]
                    }
                ]
            }
        ],
        order: [['dia', 'ASC'], ['hora_inicio', 'ASC']]
    });
    return horarios.map(horario => {
        const cdMateria = horario.CursoDivisionMateria;
        const materia = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.Materia;
        const cursoDivision = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.CursoDivision;
        const curso = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Curso;
        const division = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Division;
        return {
            id: horario.id,
            curso_id: curso === null || curso === void 0 ? void 0 : curso.id,
            materia_id: materia === null || materia === void 0 ? void 0 : materia.id,
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
                id: materia === null || materia === void 0 ? void 0 : materia.id,
                nombre: (materia === null || materia === void 0 ? void 0 : materia.nombre) || 'Sin materia'
            },
            curso: {
                id: curso === null || curso === void 0 ? void 0 : curso.id,
                nombre: `${curso === null || curso === void 0 ? void 0 : curso.año}° ${division === null || division === void 0 ? void 0 : division.division}` || 'Sin curso'
            },
            activo: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    });
});
exports.getHorarios = getHorarios;
const createHorario = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const horario = yield models_1.Horario.create({
        curso_division_id: 1, // Default value
        curso_division_materia_id: data.curso_division_materia_id,
        dia: data.dia,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        aula: data.aula,
        profesor_usuario_id: data.profesor_usuario_id || 1
    });
    const horarioConRelaciones = yield models_1.Horario.findByPk(horario.id, {
        include: [
            {
                model: models_1.CursoDivisionMateria,
                include: [
                    { model: models_1.Materia, attributes: ['id', 'nombre'] },
                    {
                        model: models_1.CursoDivision,
                        include: [
                            { model: models_1.Curso, attributes: ['id', 'año'] },
                            { model: models_1.Division, attributes: ['id', 'division'] }
                        ]
                    }
                ]
            }
        ]
    });
    const cdMateria = horarioConRelaciones === null || horarioConRelaciones === void 0 ? void 0 : horarioConRelaciones.CursoDivisionMateria;
    const materia = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.Materia;
    const cursoDivision = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.CursoDivision;
    const curso = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Curso;
    const division = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Division;
    return {
        id: horarioConRelaciones.id,
        curso_division_materia_id: horarioConRelaciones.curso_division_materia_id,
        dia: horarioConRelaciones.dia,
        hora_inicio: horarioConRelaciones.hora_inicio,
        hora_fin: horarioConRelaciones.hora_fin,
        aula: horarioConRelaciones.aula || '',
        profesor: {
            id: horarioConRelaciones.profesor_usuario_id,
            nombre: 'Profesor',
            apellido: 'Asignado'
        },
        materia: {
            id: materia === null || materia === void 0 ? void 0 : materia.id,
            nombre: (materia === null || materia === void 0 ? void 0 : materia.nombre) || 'Sin materia'
        },
        curso: {
            id: curso === null || curso === void 0 ? void 0 : curso.id,
            nombre: `${curso === null || curso === void 0 ? void 0 : curso.año}° ${division === null || division === void 0 ? void 0 : division.division}` || 'Sin curso'
        },
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.createHorario = createHorario;
// ===== ASIGNACIONES =====
const getAsignaciones = () => __awaiter(void 0, void 0, void 0, function* () {
    const asignaciones = yield models_1.ProfesorMateria.findAll({
        include: [
            {
                model: models_1.Usuario,
                attributes: ['id', 'nombre', 'apellido', 'email'],
                include: [
                    {
                        model: models_1.Rol,
                        where: { nombre: 'profesor' },
                        through: { attributes: [] }
                    }
                ]
            },
            { model: models_1.Materia, attributes: ['id', 'nombre', 'carga_horaria'] }
        ],
        order: [['id', 'ASC']]
    });
    return asignaciones.map(asignacion => {
        const usuario = asignacion.Usuario;
        const materia = asignacion.Materia;
        return {
            id: asignacion.id,
            profesor_id: usuario === null || usuario === void 0 ? void 0 : usuario.id,
            materia_id: materia === null || materia === void 0 ? void 0 : materia.id,
            profesor: {
                id: usuario === null || usuario === void 0 ? void 0 : usuario.id,
                nombre: (usuario === null || usuario === void 0 ? void 0 : usuario.nombre) || 'Sin nombre',
                apellido: (usuario === null || usuario === void 0 ? void 0 : usuario.apellido) || 'Sin apellido',
                email: usuario === null || usuario === void 0 ? void 0 : usuario.email
            },
            materia: {
                id: materia === null || materia === void 0 ? void 0 : materia.id,
                nombre: (materia === null || materia === void 0 ? void 0 : materia.nombre) || 'Sin nombre',
                descripcion: `Materia: ${materia === null || materia === void 0 ? void 0 : materia.nombre}`,
                carga_horaria: materia === null || materia === void 0 ? void 0 : materia.carga_horaria
            },
            activo: true,
            fecha_asignacion: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
    });
});
exports.getAsignaciones = getAsignaciones;
const createAsignacion = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const existe = yield models_1.ProfesorMateria.findOne({
        where: {
            usuario_id: data.profesor_id,
            materia_id: data.materia_id
        }
    });
    if (existe) {
        throw new AppError_1.AppError('El profesor ya está asignado a esta materia', 400);
    }
    const asignacion = yield models_1.ProfesorMateria.create({
        usuario_id: data.profesor_id,
        materia_id: data.materia_id
    });
    const asignacionConRelaciones = yield models_1.ProfesorMateria.findByPk(asignacion.id, {
        include: [
            {
                model: models_1.Usuario,
                attributes: ['id', 'nombre', 'apellido', 'email']
            },
            { model: models_1.Materia, attributes: ['id', 'nombre', 'carga_horaria'] }
        ]
    });
    const usuario = asignacionConRelaciones === null || asignacionConRelaciones === void 0 ? void 0 : asignacionConRelaciones.Usuario;
    const materia = asignacionConRelaciones === null || asignacionConRelaciones === void 0 ? void 0 : asignacionConRelaciones.Materia;
    return {
        id: asignacionConRelaciones.id,
        profesor_id: usuario === null || usuario === void 0 ? void 0 : usuario.id,
        materia_id: materia === null || materia === void 0 ? void 0 : materia.id,
        profesor: {
            id: usuario === null || usuario === void 0 ? void 0 : usuario.id,
            nombre: (usuario === null || usuario === void 0 ? void 0 : usuario.nombre) || 'Sin nombre',
            apellido: (usuario === null || usuario === void 0 ? void 0 : usuario.apellido) || 'Sin apellido',
            email: usuario === null || usuario === void 0 ? void 0 : usuario.email
        },
        materia: {
            id: materia === null || materia === void 0 ? void 0 : materia.id,
            nombre: (materia === null || materia === void 0 ? void 0 : materia.nombre) || 'Sin nombre',
            descripcion: `Materia: ${materia === null || materia === void 0 ? void 0 : materia.nombre}`,
            carga_horaria: materia === null || materia === void 0 ? void 0 : materia.carga_horaria
        },
        activo: true,
        fecha_asignacion: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.createAsignacion = createAsignacion;
const deleteAsignacion = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const asignacion = yield models_1.ProfesorMateria.findByPk(id);
    if (!asignacion) {
        throw new AppError_1.AppError('Asignación no encontrada', 404);
    }
    yield asignacion.destroy();
    return { message: 'Asignación eliminada correctamente' };
});
exports.deleteAsignacion = deleteAsignacion;
// Additional methods for controller compatibility
const getHorariosByCurso = (cursoId) => __awaiter(void 0, void 0, void 0, function* () {
    const horarios = yield models_1.Horario.findAll({
        include: [
            {
                model: models_1.CursoDivisionMateria,
                include: [
                    { model: models_1.Materia, attributes: ['id', 'nombre'] },
                    {
                        model: models_1.CursoDivision,
                        where: { curso_id: cursoId },
                        include: [
                            { model: models_1.Curso, attributes: ['id', 'año'] },
                            { model: models_1.Division, attributes: ['id', 'division'] }
                        ]
                    }
                ]
            }
        ],
        order: [['dia', 'ASC'], ['hora_inicio', 'ASC']]
    });
    return horarios.map(horario => {
        const cdMateria = horario.CursoDivisionMateria;
        const materia = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.Materia;
        const cursoDivision = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.CursoDivision;
        const curso = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Curso;
        const division = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Division;
        return {
            id: horario.id,
            curso_id: curso === null || curso === void 0 ? void 0 : curso.id,
            materia_id: materia === null || materia === void 0 ? void 0 : materia.id,
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
                id: materia === null || materia === void 0 ? void 0 : materia.id,
                nombre: (materia === null || materia === void 0 ? void 0 : materia.nombre) || 'Sin materia'
            },
            curso: {
                id: curso === null || curso === void 0 ? void 0 : curso.id,
                nombre: `${curso === null || curso === void 0 ? void 0 : curso.año}° ${division === null || division === void 0 ? void 0 : division.division}` || 'Sin curso'
            },
            activo: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    });
});
exports.getHorariosByCurso = getHorariosByCurso;
const updateHorario = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const horario = yield models_1.Horario.findByPk(id);
    if (!horario) {
        throw new AppError_1.AppError('Horario no encontrado', 404);
    }
    yield horario.update(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.curso_division_materia_id && { curso_division_materia_id: data.curso_division_materia_id })), (data.dia && { dia: data.dia })), (data.hora_inicio && { hora_inicio: data.hora_inicio })), (data.hora_fin && { hora_fin: data.hora_fin })), (data.aula !== undefined && { aula: data.aula })), (data.profesor_usuario_id && { profesor_usuario_id: data.profesor_usuario_id })));
    const horarioConRelaciones = yield models_1.Horario.findByPk(horario.id, {
        include: [
            {
                model: models_1.CursoDivisionMateria,
                include: [
                    { model: models_1.Materia, attributes: ['id', 'nombre'] },
                    {
                        model: models_1.CursoDivision,
                        include: [
                            { model: models_1.Curso, attributes: ['id', 'año'] },
                            { model: models_1.Division, attributes: ['id', 'division'] }
                        ]
                    }
                ]
            }
        ]
    });
    const cdMateria = horarioConRelaciones === null || horarioConRelaciones === void 0 ? void 0 : horarioConRelaciones.CursoDivisionMateria;
    const materia = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.Materia;
    const cursoDivision = cdMateria === null || cdMateria === void 0 ? void 0 : cdMateria.CursoDivision;
    const curso = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Curso;
    const division = cursoDivision === null || cursoDivision === void 0 ? void 0 : cursoDivision.Division;
    return {
        id: horarioConRelaciones.id,
        curso_division_materia_id: horarioConRelaciones.curso_division_materia_id,
        dia: horarioConRelaciones.dia,
        hora_inicio: horarioConRelaciones.hora_inicio,
        hora_fin: horarioConRelaciones.hora_fin,
        aula: horarioConRelaciones.aula || '',
        profesor: {
            id: horarioConRelaciones.profesor_usuario_id,
            nombre: 'Profesor',
            apellido: 'Asignado'
        },
        materia: {
            id: materia === null || materia === void 0 ? void 0 : materia.id,
            nombre: (materia === null || materia === void 0 ? void 0 : materia.nombre) || 'Sin materia'
        },
        curso: {
            id: curso === null || curso === void 0 ? void 0 : curso.id,
            nombre: `${curso === null || curso === void 0 ? void 0 : curso.año}° ${division === null || division === void 0 ? void 0 : division.division}` || 'Sin curso'
        },
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
});
exports.updateHorario = updateHorario;
const deleteHorario = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const horario = yield models_1.Horario.findByPk(id);
    if (!horario) {
        throw new AppError_1.AppError('Horario no encontrado', 404);
    }
    yield horario.destroy();
    return { message: 'Horario eliminado correctamente' };
});
exports.deleteHorario = deleteHorario;
const assignProfesorToMateria = (profesorId, materiaId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.createAsignacion)({
        profesor_id: profesorId,
        materia_id: materiaId
    });
});
exports.assignProfesorToMateria = assignProfesorToMateria;
const removeProfesorFromMateria = (profesorId, materiaId) => __awaiter(void 0, void 0, void 0, function* () {
    const asignacion = yield models_1.ProfesorMateria.findOne({
        where: {
            usuario_id: profesorId,
            materia_id: materiaId
        }
    });
    if (!asignacion) {
        throw new AppError_1.AppError('Asignación no encontrada', 404);
    }
    yield asignacion.destroy();
    return { message: 'Asignación eliminada correctamente' };
});
exports.removeProfesorFromMateria = removeProfesorFromMateria;
