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
exports.generateTeacherReport = exports.generateSubjectAttendanceReport = exports.generateAttendanceReport = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const AppError_1 = require("../utils/AppError");
const generateAttendanceReport = (filtros) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_desde, fecha_hasta, curso_division_id, usuario_id } = filtros;
        // Construir filtros para usuarios
        const userFilters = { activo: true };
        if (usuario_id) {
            userFilters.id = usuario_id;
        }
        if (curso_division_id) {
            // Filtrar por usuarios del curso específico
            const usuariosDelCurso = yield require('../models').UsuarioCurso.findAll({
                where: { curso_division_id },
                attributes: ['usuario_id']
            });
            userFilters.id = {
                [sequelize_1.Op.in]: usuariosDelCurso.map((uc) => uc.usuario_id)
            };
        }
        // Obtener usuarios relevantes
        const usuarios = yield models_1.Usuario.findAll({
            where: userFilters,
            include: [
                {
                    model: require('../models').Rol,
                    where: { nombre: 'alumno' },
                    through: { attributes: [] }
                }
            ]
        });
        const reporte = [];
        // Generar reporte día por día
        const currentDate = new Date(fecha_desde);
        const endDate = new Date(fecha_hasta);
        while (currentDate <= endDate) {
            const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            for (const usuario of usuarios) {
                const registrosDelDia = yield models_1.Registro.findAll({
                    where: {
                        usuario_id: usuario.id,
                        fecha: {
                            [sequelize_1.Op.gte]: startOfDay,
                            [sequelize_1.Op.lt]: endOfDay
                        }
                    },
                    order: [['fecha', 'ASC']]
                });
                const asistencia = yield processUserAttendance(usuario, registrosDelDia, startOfDay);
                reporte.push(asistencia);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return reporte;
    }
    catch (error) {
        console.error('Error generating attendance report:', error);
        throw new AppError_1.AppError('Error al generar el reporte de asistencia');
    }
});
exports.generateAttendanceReport = generateAttendanceReport;
const processUserAttendance = (usuario, registros, fecha) => __awaiter(void 0, void 0, void 0, function* () {
    const asistencia = {
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            dni: usuario.dni
        },
        fecha: fecha.toISOString().split('T')[0],
        estado: 'ausente'
    };
    if (registros.length === 0) {
        return asistencia;
    }
    // Buscar primer ingreso y último egreso
    const ingresos = registros.filter(r => r.tipo === 'ingreso');
    const egresos = registros.filter(r => r.tipo === 'egreso');
    if (ingresos.length > 0) {
        asistencia.ingreso = ingresos[0].fecha;
        asistencia.estado = 'presente';
        // Verificar tardanza (asumiendo que la entrada debe ser antes de las 8:00 AM)
        const horaEntrada = new Date(asistencia.ingreso);
        const horaLimite = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
        if (horaEntrada > horaLimite) {
            asistencia.estado = 'tardanza';
            asistencia.minutos_tardanza = Math.floor((horaEntrada.getTime() - horaLimite.getTime()) / (1000 * 60));
        }
    }
    if (egresos.length > 0) {
        asistencia.egreso = egresos[egresos.length - 1].fecha;
    }
    else if (asistencia.ingreso) {
        asistencia.estado = 'incompleto'; // Ingresó pero no registró salida
    }
    return asistencia;
});
const generateSubjectAttendanceReport = (curso_division_materia_id, fecha_desde, fecha_hasta) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        // Obtener información de la materia y curso
        const cdMateria = yield models_1.CursoDivisionMateria.findByPk(curso_division_materia_id, {
            include: [
                {
                    model: models_1.Materia,
                    attributes: ['nombre', 'carga_horaria']
                },
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
                }
            ]
        });
        if (!cdMateria) {
            throw new AppError_1.AppError('Materia no encontrada');
        }
        // Obtener horarios de la materia en el rango de fechas
        const horarios = yield models_1.Horario.findAll({
            where: { curso_division_materia_id }
        });
        // Obtener alumnos del curso
        const alumnos = yield require('../models').UsuarioCurso.findAll({
            where: { curso_division_id: cdMateria.curso_division_id },
            include: [
                {
                    model: models_1.Usuario,
                    attributes: ['id', 'nombre', 'apellido', 'dni']
                }
            ]
        });
        const reporte = [];
        // Para cada horario de clase, verificar asistencia
        for (const horario of horarios) {
            const claseFecha = getNextClassDate(horario.dia, fecha_desde, fecha_hasta);
            if (claseFecha) {
                for (const alumno of alumnos) {
                    const asistenciaClase = yield checkClassAttendance(alumno.Usuario, claseFecha, horario.hora_inicio, horario.hora_fin);
                    const cdMateriaTyped = cdMateria;
                    reporte.push(Object.assign(Object.assign({}, asistenciaClase), { materia: ((_a = cdMateriaTyped.Materia) === null || _a === void 0 ? void 0 : _a.nombre) || 'Sin materia', curso: `${((_c = (_b = cdMateriaTyped.CursoDivision) === null || _b === void 0 ? void 0 : _b.Curso) === null || _c === void 0 ? void 0 : _c.año) || '?'}° ${((_e = (_d = cdMateriaTyped.CursoDivision) === null || _d === void 0 ? void 0 : _d.Division) === null || _e === void 0 ? void 0 : _e.division) || '?'}`, fecha_clase: claseFecha, horario: `${horario.hora_inicio} - ${horario.hora_fin}` }));
                }
            }
        }
        return reporte;
    }
    catch (error) {
        console.error('Error generating subject attendance report:', error);
        throw new AppError_1.AppError('Error al generar el reporte de asistencia por materia');
    }
});
exports.generateSubjectAttendanceReport = generateSubjectAttendanceReport;
const getNextClassDate = (dia, fecha_desde, fecha_hasta) => {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const targetDay = diasSemana.indexOf(dia);
    if (targetDay === -1)
        return null;
    const currentDate = new Date(fecha_desde);
    while (currentDate <= fecha_hasta) {
        if (currentDate.getDay() === targetDay) {
            return new Date(currentDate);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return null;
};
const checkClassAttendance = (usuario, fechaClase, horaInicio, horaFin) => __awaiter(void 0, void 0, void 0, function* () {
    const startOfDay = new Date(fechaClase.getFullYear(), fechaClase.getMonth(), fechaClase.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    // Buscar registros del día
    const registros = yield models_1.Registro.findAll({
        where: {
            usuario_id: usuario.id,
            fecha: {
                [sequelize_1.Op.gte]: startOfDay,
                [sequelize_1.Op.lt]: endOfDay
            }
        },
        order: [['fecha', 'ASC']]
    });
    // Determinar si estuvo presente durante el horario de la clase
    const horaInicioClase = parseTimeToDate(fechaClase, horaInicio);
    const horaFinClase = parseTimeToDate(fechaClase, horaFin);
    let presente = false;
    let llegada = null;
    for (const registro of registros) {
        if (registro.tipo === 'ingreso' && registro.fecha <= horaFinClase) {
            presente = true;
            if (!llegada || registro.fecha < llegada) {
                llegada = registro.fecha;
            }
        }
    }
    return {
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            dni: usuario.dni
        },
        presente,
        llegada,
        tardanza: llegada ? llegada > horaInicioClase : false,
        minutos_tardanza: llegada && llegada > horaInicioClase
            ? Math.floor((llegada.getTime() - horaInicioClase.getTime()) / (1000 * 60))
            : 0
    };
});
const parseTimeToDate = (fecha, tiempo) => {
    const [horas, minutos, segundos] = tiempo.split(':').map(Number);
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), horas, minutos, segundos || 0);
};
const generateTeacherReport = (profesor_id, fecha_desde, fecha_hasta) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const horarios = yield models_1.Horario.findAll({
            where: { profesor_usuario_id: profesor_id },
            include: [
                {
                    model: models_1.CursoDivisionMateria,
                    include: [
                        {
                            model: models_1.Materia,
                            attributes: ['nombre']
                        },
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
                        }
                    ]
                }
            ]
        });
        return {
            profesor_id,
            horarios_asignados: horarios.length,
            materias: horarios.map(h => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                const hTyped = h;
                return {
                    materia: ((_b = (_a = hTyped.CursoDivisionMateria) === null || _a === void 0 ? void 0 : _a.Materia) === null || _b === void 0 ? void 0 : _b.nombre) || 'Sin materia',
                    curso: `${((_e = (_d = (_c = hTyped.CursoDivisionMateria) === null || _c === void 0 ? void 0 : _c.CursoDivision) === null || _d === void 0 ? void 0 : _d.Curso) === null || _e === void 0 ? void 0 : _e.año) || '?'}° ${((_h = (_g = (_f = hTyped.CursoDivisionMateria) === null || _f === void 0 ? void 0 : _f.CursoDivision) === null || _g === void 0 ? void 0 : _g.Division) === null || _h === void 0 ? void 0 : _h.division) || '?'}`,
                    dia: h.dia,
                    horario: `${h.hora_inicio} - ${h.hora_fin}`
                };
            })
        };
    }
    catch (error) {
        console.error('Error generating teacher report:', error);
        throw new AppError_1.AppError('Error al generar el reporte del profesor');
    }
});
exports.generateTeacherReport = generateTeacherReport;
