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
const roleController = __importStar(require("../controllers/roleController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(authMiddleware_1.authenticate);
// CRUD básico de roles (solo admin)
router.get('/', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.getRoles);
router.post('/', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.createRole);
router.get('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.getRoleById);
router.put('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.updateRole);
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.deleteRole);
// Gestión de permisos
router.get('/permissions', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.getAvailablePermissions);
router.post('/:id/permissions', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.assignPermissionToRole);
router.delete('/:id/permissions/:permission', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.removePermissionFromRole);
// Consultas adicionales
router.get('/:id/users', (0, authMiddleware_1.authorizeRoles)('admin'), roleController.getUsersWithRole);
exports.default = router;
