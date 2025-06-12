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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const academicRoutes_1 = __importDefault(require("./routes/academicRoutes"));
const deviceRoutes_1 = __importDefault(require("./routes/deviceRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const biometricRoutes_1 = __importStar(require("./routes/biometricRoutes"));
const horarioRoutes_1 = __importDefault(require("./routes/horarioRoutes"));
const logRoutes_1 = __importDefault(require("./routes/logRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const errorHandler_1 = require("./middlewares/errorHandler");
const models_1 = require("./models");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rutas públicas
app.use('/api/auth', authRoutes_1.default);
// Rutas especiales para ESP32 (sin autenticación JWT)
app.use('/api/esp32', biometricRoutes_1.esp32Router);
// Rutas protegidas
app.use('/api/users', authMiddleware_1.authenticate, userRoutes_1.default);
app.use('/api/roles', roleRoutes_1.default);
app.use('/api/academic', authMiddleware_1.authenticate, academicRoutes_1.default);
app.use('/api/devices', authMiddleware_1.authenticate, deviceRoutes_1.default);
app.use('/api/biometric', authMiddleware_1.authenticate, biometricRoutes_1.default);
app.use('/api/horarios', authMiddleware_1.authenticate, horarioRoutes_1.default);
app.use('/api/logs', authMiddleware_1.authenticate, logRoutes_1.default);
app.use('/api/reports', authMiddleware_1.authenticate, reportRoutes_1.default);
// Middleware de manejo de errores
app.use(errorHandler_1.errorHandler);
// Puerto
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
// Iniciar el servidor
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar conexión a la base de datos sin sincronizar modelos
        yield models_1.sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    }
    catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
});
startServer();
exports.default = app;
