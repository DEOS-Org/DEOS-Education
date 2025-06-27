import { db } from '../models';
import { QueryTypes } from 'sequelize';
import * as crypto from 'crypto';

export interface FingerprintTemplate {
  usuario_id: number;
  template_huella: string;
  calidad: number;
  dispositivo_origen: string;
  slot_original?: number;
  metadatos?: any;
}

export interface BiometricDevice {
  id: string;
  nombre: string;
  ubicacion: string;
  ip_actual?: string;
  estado: 'online' | 'offline' | 'sincronizando' | 'error';
  modelo?: string;
  version_firmware?: string;
  capacidad_huellas?: number;
  configuracion?: any;
}

export interface OfflineEvent {
  dispositivo_id: string;
  tipo_operacion: 'crear_huella' | 'eliminar_huella' | 'evento' | 'estado';
  datos: any;
  intentos?: number;
}

export interface SyncRequest {
  device_id: string;
  current_fingerprints: number;
  firmware_version: string;
  last_sync: number;
}

export interface SyncResponse {
  success: boolean;
  fingerprints: Array<{
    user_id: number;
    dni: string;
    nombre: string;
    rol: string;
    template: string;
    quality: number;
    slot_recommendation?: number;
  }>;
  devices_to_remove?: number[];
  sync_timestamp: number;
}

/**
 * Servicio para manejo de sistema biométrico distribuido
 */
export class DistributedBiometricService {
  
  /**
   * Registra un dispositivo biométrico
   */
  async registerDevice(device: BiometricDevice): Promise<BiometricDevice> {
    try {
      const query = `
        INSERT INTO dispositivos_biometricos 
        (id, nombre, ubicacion, ip_actual, estado, modelo, version_firmware, capacidad_huellas, configuracion, ultimo_contacto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          ubicacion = VALUES(ubicacion),
          ip_actual = VALUES(ip_actual),
          estado = VALUES(estado),
          version_firmware = VALUES(version_firmware),
          ultimo_contacto = NOW()
      `;

      await db.query(query, {
        replacements: [
          device.id,
          device.nombre,
          device.ubicacion,
          device.ip_actual,
          device.estado,
          device.modelo || 'AS608',
          device.version_firmware,
          device.capacidad_huellas || 127,
          JSON.stringify(device.configuracion || {})
        ],
        type: QueryTypes.INSERT
      });

      return device;
    } catch (error) {
      console.error('Error registering device:', error);
      throw new Error('Error al registrar dispositivo biométrico');
    }
  }

  /**
   * Actualiza el estado de un dispositivo
   */
  async updateDeviceStatus(deviceId: string, estado: string, ip?: string): Promise<void> {
    try {
      const query = `
        UPDATE dispositivos_biometricos 
        SET estado = ?, ip_actual = COALESCE(?, ip_actual), ultimo_contacto = NOW()
        WHERE id = ?
      `;

      await db.query(query, {
        replacements: [estado, ip, deviceId],
        type: QueryTypes.UPDATE
      });
    } catch (error) {
      console.error('Error updating device status:', error);
      throw new Error('Error al actualizar estado del dispositivo');
    }
  }

  /**
   * Obtiene todos los dispositivos activos
   */
  async getActiveDevices(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT * FROM vista_estado_dispositivos
        WHERE activo = TRUE
        ORDER BY ultimo_contacto DESC
      `;

      const devices = await db.query(query, {
        type: QueryTypes.SELECT
      }) as any[];

      return devices.map(device => ({
        id: device.id,
        nombre: device.nombre,
        ubicacion: device.ubicacion,
        ip_actual: device.ip_actual,
        estado: device.estado,
        modelo: device.modelo,
        version_firmware: device.version_firmware,
        capacidad_huellas: device.capacidad_huellas,
        ultimo_contacto: device.ultimo_contacto,
        huellas_sincronizadas: device.huellas_sincronizadas,
        porcentaje_uso: device.porcentaje_uso,
        eventos_pendientes: device.eventos_pendientes
      }));
    } catch (error) {
      console.error('Error getting active devices:', error);
      throw new Error('Error al obtener dispositivos activos');
    }
  }

  /**
   * Registra una huella dactilar en el sistema distribuido
   */
  async enrollFingerprint(fingerprint: FingerprintTemplate): Promise<{ 
    huella_id: number; 
    distributed_slots: Array<{ device_id: string; slot: number }> 
  }> {
    try {
      // Generar hash único para la huella
      const hash_huella = crypto
        .createHash('sha256')
        .update(`${fingerprint.usuario_id}_${fingerprint.template_huella}`)
        .digest('hex');

      // Verificar si ya existe esta huella
      const existingQuery = `
        SELECT id FROM huellas_biometricas 
        WHERE usuario_id = ? AND hash_huella = ?
      `;
      
      const existing = await db.query(existingQuery, {
        replacements: [fingerprint.usuario_id, hash_huella],
        type: QueryTypes.SELECT
      }) as any[];

      if (existing.length > 0) {
        throw new Error('Ya existe una huella registrada para este usuario');
      }

      // Insertar huella en tabla central
      const insertQuery = `
        INSERT INTO huellas_biometricas 
        (usuario_id, template_huella, calidad, hash_huella, dispositivo_origen, slot_original, metadatos)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [insertResult] = await db.query(insertQuery, {
        replacements: [
          fingerprint.usuario_id,
          fingerprint.template_huella,
          fingerprint.calidad,
          hash_huella,
          fingerprint.dispositivo_origen,
          fingerprint.slot_original,
          JSON.stringify(fingerprint.metadatos || {})
        ],
        type: QueryTypes.INSERT
      }) as any[];

      const huella_id = insertResult;

      // Obtener dispositivos activos para distribución
      const activeDevices = await this.getActiveDevices();
      const distributed_slots: Array<{ device_id: string; slot: number }> = [];

      // Distribuir a todos los dispositivos activos
      for (const device of activeDevices) {
        const slot = await this.findAvailableSlot(device.id);
        if (slot > 0) {
          await this.addFingerprintToDevice(huella_id, device.id, slot);
          distributed_slots.push({ device_id: device.id, slot });
        }
      }

      return { huella_id, distributed_slots };
    } catch (error) {
      console.error('Error enrolling fingerprint:', error);
      throw error;
    }
  }

  /**
   * Encuentra un slot disponible en un dispositivo
   */
  private async findAvailableSlot(deviceId: string): Promise<number> {
    try {
      const query = `
        SELECT slot_local FROM huellas_dispositivos 
        WHERE dispositivo_id = ? AND estado != 'eliminado'
        ORDER BY slot_local
      `;

      const usedSlots = await db.query(query, {
        replacements: [deviceId],
        type: QueryTypes.SELECT
      }) as any[];

      const usedSlotNumbers = usedSlots.map(row => row.slot_local);
      
      // Encontrar primer slot libre (1-127)
      for (let i = 1; i <= 127; i++) {
        if (!usedSlotNumbers.includes(i)) {
          return i;
        }
      }

      return -1; // No hay slots disponibles
    } catch (error) {
      console.error('Error finding available slot:', error);
      return -1;
    }
  }

  /**
   * Agrega una huella a un dispositivo específico
   */
  private async addFingerprintToDevice(huellaId: number, deviceId: string, slot: number): Promise<void> {
    try {
      const query = `
        INSERT INTO huellas_dispositivos 
        (huella_id, dispositivo_id, slot_local, estado, fecha_sincronizacion)
        VALUES (?, ?, ?, 'pendiente', NOW())
        ON DUPLICATE KEY UPDATE
          slot_local = VALUES(slot_local),
          estado = 'pendiente',
          fecha_sincronizacion = NOW()
      `;

      await db.query(query, {
        replacements: [huellaId, deviceId, slot],
        type: QueryTypes.INSERT
      });
    } catch (error) {
      console.error('Error adding fingerprint to device:', error);
      throw new Error('Error al agregar huella al dispositivo');
    }
  }

  /**
   * Procesa solicitud de sincronización de dispositivo
   */
  async processDeviceSync(syncRequest: SyncRequest): Promise<SyncResponse> {
    try {
      // Marcar dispositivo como sincronizando
      await this.updateDeviceStatus(syncRequest.device_id, 'sincronizando');

      // Obtener huellas que deben estar en este dispositivo
      const query = `
        SELECT 
          hb.usuario_id as user_id,
          u.dni,
          CONCAT(u.nombre, ' ', u.apellido) as nombre,
          COALESCE(r.nombre, 'alumno') as rol,
          hb.template_huella as template,
          hb.calidad as quality,
          hd.slot_local as slot_recommendation
        FROM huellas_biometricas hb
        JOIN usuario u ON hb.usuario_id = u.id
        LEFT JOIN usuario_roles ur ON u.id = ur.usuarioId
        LEFT JOIN rol r ON ur.rolId = r.id
        LEFT JOIN huellas_dispositivos hd ON hb.id = hd.huella_id AND hd.dispositivo_id = ?
        WHERE hb.activo = TRUE
        AND (hd.estado IS NULL OR hd.estado IN ('pendiente', 'sincronizado'))
        ORDER BY hb.fecha_registro ASC
      `;

      const fingerprints = await db.query(query, {
        replacements: [syncRequest.device_id],
        type: QueryTypes.SELECT
      }) as any[];

      // Marcar huellas como sincronizadas
      if (fingerprints.length > 0) {
        const updateQuery = `
          UPDATE huellas_dispositivos 
          SET estado = 'sincronizado', fecha_sincronizacion = NOW(), intentos_sync = 0
          WHERE dispositivo_id = ? AND estado = 'pendiente'
        `;

        await db.query(updateQuery, {
          replacements: [syncRequest.device_id],
          type: QueryTypes.UPDATE
        });
      }

      // Actualizar estado del dispositivo
      await this.updateDeviceStatus(syncRequest.device_id, 'online');

      return {
        success: true,
        fingerprints,
        sync_timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error processing device sync:', error);
      await this.updateDeviceStatus(syncRequest.device_id, 'error');
      throw new Error('Error al procesar sincronización');
    }
  }

  /**
   * Registra un evento biométrico
   */
  async recordBiometricEvent(
    deviceId: string,
    userId: number | null,
    tipoEvento: 'autenticacion' | 'asistencia' | 'registro' | 'error' | 'heartbeat',
    resultado: 'exitoso' | 'fallido' | 'desconocido',
    confianza?: number,
    datosAdicionales?: any,
    timestampDispositivo?: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO eventos_biometricos 
        (dispositivo_id, usuario_id, tipo_evento, resultado, confianza, timestamp_dispositivo, datos_adicionales, sincronizado)
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
      `;

      await db.query(query, {
        replacements: [
          deviceId,
          userId,
          tipoEvento,
          resultado,
          confianza,
          timestampDispositivo || Date.now(),
          JSON.stringify(datosAdicionales || {})
        ],
        type: QueryTypes.INSERT
      });
    } catch (error) {
      console.error('Error recording biometric event:', error);
      throw new Error('Error al registrar evento biométrico');
    }
  }

  /**
   * Procesa cola de eventos offline
   */
  async processOfflineEvents(deviceId: string, events: OfflineEvent[]): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        switch (event.tipo_operacion) {
          case 'evento':
            await this.recordBiometricEvent(
              event.dispositivo_id,
              event.datos.usuario_id || null,
              event.datos.tipo_evento,
              event.datos.resultado,
              event.datos.confianza,
              event.datos.datos_adicionales,
              event.datos.timestamp_dispositivo
            );
            break;

          case 'estado':
            await this.updateDeviceStatus(
              event.dispositivo_id,
              event.datos.estado,
              event.datos.ip
            );
            break;

          default:
            console.warn('Tipo de evento offline no reconocido:', event.tipo_operacion);
            failed++;
            continue;
        }

        processed++;
      } catch (error) {
        console.error('Error processing offline event:', error);
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Elimina una huella del sistema distribuido
   */
  async deleteFingerprint(userId: number): Promise<void> {
    try {
      // Marcar huella como inactiva
      const updateQuery = `
        UPDATE huellas_biometricas 
        SET activo = FALSE 
        WHERE usuario_id = ?
      `;

      await db.query(updateQuery, {
        replacements: [userId],
        type: QueryTypes.UPDATE
      });

      // Marcar para eliminación en todos los dispositivos
      const deleteDevicesQuery = `
        UPDATE huellas_dispositivos hd
        JOIN huellas_biometricas hb ON hd.huella_id = hb.id
        SET hd.estado = 'eliminado'
        WHERE hb.usuario_id = ?
      `;

      await db.query(deleteDevicesQuery, {
        replacements: [userId],
        type: QueryTypes.UPDATE
      });
    } catch (error) {
      console.error('Error deleting fingerprint:', error);
      throw new Error('Error al eliminar huella');
    }
  }

  /**
   * Obtiene estadísticas de un dispositivo
   */
  async getDeviceStatistics(deviceId: string, days: number = 7): Promise<any> {
    try {
      const query = `
        SELECT 
          DATE(timestamp_servidor) as fecha,
          tipo_evento,
          resultado,
          COUNT(*) as cantidad,
          AVG(confianza) as promedio_confianza
        FROM eventos_biometricos 
        WHERE dispositivo_id = ? 
        AND timestamp_servidor >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(timestamp_servidor), tipo_evento, resultado
        ORDER BY fecha DESC
      `;

      const stats = await db.query(query, {
        replacements: [deviceId, days],
        type: QueryTypes.SELECT
      });

      return {
        deviceId,
        periodo_dias: days,
        estadisticas: stats
      };
    } catch (error) {
      console.error('Error getting device statistics:', error);
      throw new Error('Error al obtener estadísticas del dispositivo');
    }
  }

  /**
   * Obtiene todas las huellas con información de usuario
   */
  async getAllFingerprints(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          hb.id,
          hb.usuario_id,
          hb.calidad,
          hb.fecha_registro,
          hb.activo,
          u.nombre,
          u.apellido,
          u.dni,
          u.email,
          COUNT(hd.dispositivo_id) as dispositivos_sincronizados
        FROM huellas_biometricas hb
        JOIN usuario u ON hb.usuario_id = u.id
        LEFT JOIN huellas_dispositivos hd ON hb.id = hd.huella_id AND hd.estado = 'sincronizado'
        WHERE hb.activo = TRUE
        GROUP BY hb.id
        ORDER BY hb.fecha_registro DESC
      `;

      const huellas = await db.query(query, {
        type: QueryTypes.SELECT
      }) as any[];

      return huellas.map(huella => ({
        id: huella.id,
        usuario_id: huella.usuario_id,
        calidad: huella.calidad,
        fecha_registro: huella.fecha_registro,
        activo: huella.activo,
        dispositivos_sincronizados: huella.dispositivos_sincronizados,
        Usuario: {
          nombre: huella.nombre,
          apellido: huella.apellido,
          dni: huella.dni,
          email: huella.email
        }
      }));
    } catch (error) {
      console.error('Error getting all fingerprints:', error);
      throw new Error('Error al obtener huellas');
    }
  }

  /**
   * Obtiene huella por usuario
   */
  async getFingerprintByUser(userId: number): Promise<any | null> {
    try {
      const query = `
        SELECT 
          hb.id,
          hb.usuario_id,
          hb.calidad,
          hb.fecha_registro,
          hb.activo,
          u.nombre,
          u.apellido,
          u.dni,
          u.email
        FROM huellas_biometricas hb
        JOIN usuario u ON hb.usuario_id = u.id
        WHERE hb.usuario_id = ? AND hb.activo = TRUE
        LIMIT 1
      `;

      const result = await db.query(query, {
        replacements: [userId],
        type: QueryTypes.SELECT
      }) as any[];

      if (result.length === 0) {
        return null;
      }

      const huella = result[0];
      return {
        id: huella.id,
        usuario_id: huella.usuario_id,
        calidad: huella.calidad,
        fecha_registro: huella.fecha_registro,
        activo: huella.activo,
        Usuario: {
          nombre: huella.nombre,
          apellido: huella.apellido,
          dni: huella.dni,
          email: huella.email
        }
      };
    } catch (error) {
      console.error('Error getting fingerprint by user:', error);
      throw new Error('Error al obtener huella del usuario');
    }
  }
}

export const distributedBiometricService = new DistributedBiometricService();