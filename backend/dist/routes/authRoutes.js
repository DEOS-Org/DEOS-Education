"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Wrapper para manejar errores async y evitar el error de tipado
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Rutas públicas
router.post('/register', asyncHandler(authController_1.register));
router.post('/login', asyncHandler(authController_1.login));
router.post('/request-password-reset', asyncHandler(authController_1.requestPasswordReset));
router.post('/reset-password', asyncHandler(authController_1.resetPassword));
// Rutas protegidas
router.post('/change-password', authMiddleware_1.authenticate, asyncHandler(authController_1.changePassword));
exports.default = router;
