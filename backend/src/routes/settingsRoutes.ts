import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorizeRoles('admin'));

// Rutas de configuración del sistema
router.get('/system', settingsController.getAllSettings);
router.get('/system/object', settingsController.getSettingsAsObject);
router.get('/system/category/:category', settingsController.getSettingsByCategory);
router.get('/system/:key', settingsController.getSettingByKey);
router.put('/system', settingsController.updateMultipleSettings);
router.put('/system/:key', settingsController.updateSetting);
router.post('/system/initialize', settingsController.initializeDefaultSettings);

// Rutas de información del sistema
router.get('/info', settingsController.getSystemInfo);

// Rutas de gestión de backups
router.get('/backups', settingsController.getBackups);
router.post('/backups', settingsController.createBackup);
router.get('/backups/download/:filename', settingsController.downloadBackup);
router.delete('/backups/:filename', settingsController.deleteBackup);

// Rutas de logs del sistema
router.get('/logs', settingsController.getSystemLogs);

// Rutas de mantenimiento
router.post('/maintenance/clear-cache', settingsController.clearCache);
router.post('/maintenance/restart', settingsController.restartSystem);
router.post('/maintenance/check-updates', settingsController.checkUpdates);
router.post('/maintenance/optimize-db', settingsController.optimizeDatabase);

export default router;