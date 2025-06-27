import { Router } from 'express';
import * as mensajeriaController from '../controllers/mensajeriaController';

const router = Router();

// Authentication is handled at app level

// ========== RUTAS DE MENSAJES ==========

// Enviar mensaje
router.post('/mensajes', mensajeriaController.enviarMensaje);

// Obtener mensajes de una conversación
router.get('/mensajes/conversacion', mensajeriaController.getMensajesConversacion);

// Marcar mensajes como leídos
router.post('/mensajes/marcar-leidos', mensajeriaController.marcarMensajesComoLeidos);

// Editar mensaje
router.put('/mensajes/:id', mensajeriaController.editarMensaje);

// Eliminar mensaje
router.delete('/mensajes/:id', mensajeriaController.eliminarMensaje);

// Obtener conversaciones recientes del usuario
router.get('/conversaciones', mensajeriaController.getConversacionesRecientes);

// Obtener count de mensajes no leídos
router.get('/mensajes/no-leidos/count', mensajeriaController.getMensajesNoLeidos);

// ========== RUTAS DE GRUPOS ==========

// Crear grupo de chat
router.post('/grupos', mensajeriaController.crearGrupoChat);

// Obtener grupos del usuario
router.get('/grupos', mensajeriaController.getGruposUsuario);

// Obtener información de un grupo específico
router.get('/grupos/:id', mensajeriaController.getGrupoChat);

// Agregar miembro a grupo
router.post('/grupos/:id/miembros', mensajeriaController.agregarMiembroGrupo);

// Quitar miembro de grupo
router.delete('/grupos/:id/miembros/:usuarioId', mensajeriaController.quitarMiembroGrupo);

export default router;