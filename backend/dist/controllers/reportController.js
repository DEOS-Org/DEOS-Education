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
exports.getAttendanceSummary = exports.getTeacherReport = exports.getSubjectAttendanceReport = exports.getAttendanceReport = void 0;
const reportService = __importStar(require("../services/reportService"));
const getAttendanceReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_desde, fecha_hasta, curso_division_id, usuario_id } = req.query;
        if (!fecha_desde || !fecha_hasta) {
            return res.status(400).json({
                message: 'fecha_desde y fecha_hasta son requeridos'
            });
        }
        const filtros = {
            fecha_desde: new Date(fecha_desde),
            fecha_hasta: new Date(fecha_hasta),
            curso_division_id: curso_division_id ? parseInt(curso_division_id) : undefined,
            usuario_id: usuario_id ? parseInt(usuario_id) : undefined
        };
        const reporte = yield reportService.generateAttendanceReport(filtros);
        res.json({
            filtros,
            total_registros: reporte.length,
            datos: reporte
        });
    }
    catch (error) {
        console.error('Error in getAttendanceReport:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.getAttendanceReport = getAttendanceReport;
const getSubjectAttendanceReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { curso_division_materia_id } = req.params;
        const { fecha_desde, fecha_hasta } = req.query;
        if (!fecha_desde || !fecha_hasta) {
            return res.status(400).json({
                message: 'fecha_desde y fecha_hasta son requeridos'
            });
        }
        const reporte = yield reportService.generateSubjectAttendanceReport(parseInt(curso_division_materia_id), new Date(fecha_desde), new Date(fecha_hasta));
        res.json({
            curso_division_materia_id: parseInt(curso_division_materia_id),
            periodo: {
                desde: fecha_desde,
                hasta: fecha_hasta
            },
            datos: reporte
        });
    }
    catch (error) {
        console.error('Error in getSubjectAttendanceReport:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.getSubjectAttendanceReport = getSubjectAttendanceReport;
const getTeacherReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { profesor_id } = req.params;
        const { fecha_desde, fecha_hasta } = req.query;
        if (!fecha_desde || !fecha_hasta) {
            return res.status(400).json({
                message: 'fecha_desde y fecha_hasta son requeridos'
            });
        }
        const reporte = yield reportService.generateTeacherReport(parseInt(profesor_id), new Date(fecha_desde), new Date(fecha_hasta));
        res.json(reporte);
    }
    catch (error) {
        console.error('Error in getTeacherReport:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.getTeacherReport = getTeacherReport;
const getAttendanceSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fecha_desde, fecha_hasta, curso_division_id } = req.query;
        if (!fecha_desde || !fecha_hasta) {
            return res.status(400).json({
                message: 'fecha_desde y fecha_hasta son requeridos'
            });
        }
        const filtros = {
            fecha_desde: new Date(fecha_desde),
            fecha_hasta: new Date(fecha_hasta),
            curso_division_id: curso_division_id ? parseInt(curso_division_id) : undefined
        };
        const reporte = yield reportService.generateAttendanceReport(filtros);
        // Calcular estadísticas
        const estadisticas = {
            total_registros: reporte.length,
            presentes: reporte.filter(r => r.estado === 'presente').length,
            ausentes: reporte.filter(r => r.estado === 'ausente').length,
            tardanzas: reporte.filter(r => r.estado === 'tardanza').length,
            incompletos: reporte.filter(r => r.estado === 'incompleto').length,
            porcentaje_asistencia: 0
        };
        const totalAsistencias = estadisticas.presentes + estadisticas.tardanzas + estadisticas.incompletos;
        estadisticas.porcentaje_asistencia = estadisticas.total_registros > 0
            ? Math.round((totalAsistencias / estadisticas.total_registros) * 100)
            : 0;
        res.json({
            periodo: filtros,
            estadisticas,
            detalles_por_estado: {
                presentes: reporte.filter(r => r.estado === 'presente'),
                ausentes: reporte.filter(r => r.estado === 'ausente'),
                tardanzas: reporte.filter(r => r.estado === 'tardanza'),
                incompletos: reporte.filter(r => r.estado === 'incompleto')
            }
        });
    }
    catch (error) {
        console.error('Error in getAttendanceSummary:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});
exports.getAttendanceSummary = getAttendanceSummary;
