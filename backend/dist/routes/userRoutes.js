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
const userController = __importStar(require("../controllers/userController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Rutas protegidas por autenticación (ya aplicada en app.ts)
// router.use(authenticate);
// Rutas de usuarios
router.get('/', userController.getUsers);
router.post('/', (0, authMiddleware_1.authorizeRoles)('admin'), userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), userController.updateUser);
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), userController.deleteUser);
// Rutas de roles
router.post('/:id/roles', (0, authMiddleware_1.authorizeRoles)('admin'), userController.assignRole);
router.delete('/:id/roles', (0, authMiddleware_1.authorizeRoles)('admin'), userController.removeRole);
router.get('/:id/roles', userController.getUserRoles);
// Rutas de relación alumno-padre
router.post('/alumnos/:alumnoId/padres', (0, authMiddleware_1.authorizeRoles)('admin'), userController.assignParent);
router.delete('/alumnos/:alumnoId/padres/:padreId', (0, authMiddleware_1.authorizeRoles)('admin'), userController.removeParent);
router.get('/alumnos/:alumnoId/padres', userController.getStudentParents);
router.get('/padres/:padreId/alumnos', userController.getParentStudents);
exports.default = router;
