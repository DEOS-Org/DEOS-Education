import { Router } from 'express';
import * as sancionController from '../controllers/sancionController';
import { authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Authentication is handled at app level

// Rutas de consulta (accesibles por admin, profesor, preceptor)
router.get(
  '/',
  authorizeRoles('admin', 'profesor', 'preceptor'),
  sancionController.getSanciones
);

router.get(
  '/estadisticas',
  authorizeRoles('admin', 'profesor', 'preceptor'),
  sancionController.getEstadisticasSanciones
);

router.get(
  '/activas',
  authorizeRoles('admin', 'profesor', 'preceptor'),
  sancionController.getSancionesActivas
);

router.get(
  '/estudiante/:estudianteId',
  authorizeRoles('admin', 'profesor', 'preceptor'),
  sancionController.getSancionesByEstudiante
);

router.get(
  '/:id',
  authorizeRoles('admin', 'profesor', 'preceptor'),
  sancionController.getSancionById
);

// Rutas de acción (solo admin y preceptor pueden crear/modificar sanciones)
router.post(
  '/',
  authorizeRoles('admin', 'preceptor'),
  sancionController.createSancion
);

router.put(
  '/:id',
  authorizeRoles('admin', 'preceptor'),
  sancionController.updateSancion
);

router.delete(
  '/:id',
  authorizeRoles('admin', 'preceptor'),
  sancionController.deleteSancion
);

router.post(
  '/:id/cumplida',
  authorizeRoles('admin', 'preceptor'),
  sancionController.marcarSancionComoCumplida
);

router.post(
  '/:id/notificar-padres',
  authorizeRoles('admin', 'preceptor'),
  sancionController.notificarPadres
);

export default router;