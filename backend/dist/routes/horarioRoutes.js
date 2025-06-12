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
const authMiddleware_1 = require("../middlewares/authMiddleware");
const horarioController = __importStar(require("../controllers/horarioController"));
const router = (0, express_1.Router)();
// Wrapper para manejar errores async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticate);
// === GESTIÓN DE HORARIOS ===
// Crear horario (solo admin)
router.post('/', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(horarioController.createHorario));
// Obtener horario por ID
router.get('/:id', asyncHandler(horarioController.getHorarioById));
// Actualizar horario (solo admin)
router.put('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(horarioController.updateHorario));
// Eliminar horario (solo admin)
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(horarioController.deleteHorario));
// === CONSULTAS ESPECÍFICAS ===
// Obtener horarios por curso-división
router.get('/curso/:curso_division_id', asyncHandler(horarioController.getHorariosByCurso));
// Obtener horarios por profesor
router.get('/profesor/:profesor_id', asyncHandler(horarioController.getHorariosByProfesor));
exports.default = router;
