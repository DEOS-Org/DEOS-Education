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
exports.authorizeRoles = exports.authenticate = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticate = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Token no proporcionado' });
            return;
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};
exports.authenticate = authenticate;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const hasRole = req.user.roles.some(role => roles.includes(role));
        if (!hasRole) {
            res.status(403).json({
                message: 'No autorizado',
                requiredRoles: roles,
                userRoles: req.user.roles
            });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
