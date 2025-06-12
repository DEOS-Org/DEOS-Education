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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicController = __importStar(require("../controllers/academicController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticate);
// ===== RUTAS DE CURSOS =====
router.get('/cursos', academicController.getCursos);
router.post('/cursos', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.createCurso);
router.put('/cursos/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.updateCurso);
router.delete('/cursos/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.deleteCurso);
// ===== RUTAS DE DIVISIONES =====
router.get('/divisiones', academicController.getDivisiones);
router.get('/cursos/:cursoId/divisiones', academicController.getDivisionesByCurso);
router.post('/divisiones', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.createDivision);
router.put('/divisiones/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.updateDivision);
router.delete('/divisiones/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.deleteDivision);
// ===== RUTAS DE MATERIAS =====
router.get('/materias', academicController.getMaterias);
router.post('/materias', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.createMateria);
router.put('/materias/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.updateMateria);
router.delete('/materias/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.deleteMateria);
// ===== RUTAS DE HORARIOS =====
router.get('/horarios', academicController.getHorarios);
router.get('/cursos/:cursoId/horarios', academicController.getHorariosByCurso);
router.post('/horarios', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.createHorario);
router.put('/horarios/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.updateHorario);
router.delete('/horarios/:id', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.deleteHorario);
// ===== RUTAS DE ASIGNACIONES =====
router.get('/asignaciones', academicController.getAsignaciones);
router.post('/asignaciones', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.assignProfesorToMateria);
router.delete('/asignaciones/:profesorId/:materiaId', (0, authMiddleware_1.authorizeRoles)('admin'), academicController.removeProfesorFromMateria);
exports.default = router;
