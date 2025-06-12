import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import academicRoutes from './routes/academicRoutes';
import deviceRoutes from './routes/deviceRoutes';
import authRoutes from './routes/authRoutes';
import roleRoutes from './routes/roleRoutes';
import biometricRoutes, { esp32Router } from './routes/biometricRoutes';
import horarioRoutes from './routes/horarioRoutes';
import logRoutes from './routes/logRoutes';
import reportRoutes from './routes/reportRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import testRoutes from './routes/testRoutes';
import { authenticate } from './middlewares/authMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { sequelize } from './models';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api', testRoutes); // Test routes without auth

// Rutas especiales para ESP32 (sin autenticación JWT)
app.use('/api/esp32', esp32Router);

// Rutas protegidas
app.use('/api/users', authenticate, userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/academic', authenticate, academicRoutes);
app.use('/api/devices', authenticate, deviceRoutes);
app.use('/api/biometric', authenticate, biometricRoutes);
app.use('/api/horarios', authenticate, horarioRoutes);
app.use('/api/logs', authenticate, logRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Puerto
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos sin sincronizar modelos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;