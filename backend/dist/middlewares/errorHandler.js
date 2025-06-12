"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    var _a;
    console.error(err);
    const error = err;
    // Si es un error de Sequelize
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
            message: 'Error de validación',
            errors: (_a = error.errors) === null || _a === void 0 ? void 0 : _a.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
        return;
    }
    // Si es un error personalizado con código de estado
    if (error.statusCode) {
        res.status(error.statusCode).json({
            message: error.message
        });
        return;
    }
    // Error por defecto
    res.status(500).json({
        message: 'Error interno del servidor'
    });
};
exports.errorHandler = errorHandler;
