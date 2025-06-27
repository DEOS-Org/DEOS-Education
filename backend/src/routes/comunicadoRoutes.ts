import { Router } from 'express';
import * as comunicadoController from '../controllers/comunicadoController';
import { checkRole } from '../middlewares/roleMiddleware';

const router = Router();

// Authentication is handled at app level

// Rutas para comunicados
router.get('/', comunicadoController.getComunicados);
router.get('/no-leidos', comunicadoController.getComunicadosNoLeidos);
router.get('/estadisticas', comunicadoController.getEstadisticasComunicados);
router.get('/:id', comunicadoController.getComunicadoById);
router.post('/:id/marcar-leido', comunicadoController.marcarComoLeido);

// Rutas para crear/editar/eliminar (solo admin, profesor, preceptor)
router.post(
  '/', 
  checkRole(['admin', 'profesor', 'preceptor']),
  comunicadoController.createComunicado
);

router.put(
  '/:id',
  checkRole(['admin', 'profesor', 'preceptor']),
  comunicadoController.updateComunicado
);

router.delete(
  '/:id',
  checkRole(['admin', 'profesor', 'preceptor']),
  comunicadoController.deleteComunicado
);

export default router;