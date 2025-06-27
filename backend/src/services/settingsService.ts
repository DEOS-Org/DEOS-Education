import { ConfiguracionSistema } from '../models';
import { AppError } from '../utils/AppError';

interface ConfiguracionData {
  clave: string;
  valor: any;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  descripcion?: string;
  categoria?: string;
}

// Configuraciones por defecto del sistema
const DEFAULT_SETTINGS = [
  { clave: 'institucion_nombre', valor: 'DEOS Education', tipo: 'string' as const, descripcion: 'Nombre de la institución', categoria: 'general' },
  { clave: 'institucion_logo', valor: '', tipo: 'string' as const, descripcion: 'URL del logo de la institución', categoria: 'general' },
  { clave: 'institucion_email', valor: 'contacto@deoseducation.com', tipo: 'string' as const, descripcion: 'Email de contacto', categoria: 'general' },
  { clave: 'institucion_telefono', valor: '', tipo: 'string' as const, descripcion: 'Teléfono de contacto', categoria: 'general' },
  { clave: 'zona_horaria', valor: 'America/Argentina/Buenos_Aires', tipo: 'string' as const, descripcion: 'Zona horaria del sistema', categoria: 'general' },
  
  { clave: 'horario_entrada', valor: '08:00', tipo: 'string' as const, descripcion: 'Horario de entrada', categoria: 'asistencia' },
  { clave: 'tolerancia_tardanza', valor: '15', tipo: 'number' as const, descripcion: 'Tolerancia en minutos para tardanza', categoria: 'asistencia' },
  { clave: 'dias_habiles', valor: '["lunes", "martes", "miercoles", "jueves", "viernes"]', tipo: 'json' as const, descripcion: 'Días hábiles de la semana', categoria: 'asistencia' },
  
  { clave: 'email_notificaciones', valor: 'true', tipo: 'boolean' as const, descripcion: 'Enviar notificaciones por email', categoria: 'notificaciones' },
  { clave: 'umbral_ausentismo', valor: '10', tipo: 'number' as const, descripcion: 'Porcentaje de ausentismo para alertas', categoria: 'notificaciones' },
  { clave: 'email_admin', valor: 'admin@deoseducation.com', tipo: 'string' as const, descripcion: 'Email del administrador', categoria: 'notificaciones' },
  
  { clave: 'session_timeout', valor: '480', tipo: 'number' as const, descripcion: 'Tiempo de sesión en minutos', categoria: 'seguridad' },
  { clave: '2fa_obligatorio', valor: 'false', tipo: 'boolean' as const, descripcion: '2FA obligatorio para todos los usuarios', categoria: 'seguridad' },
  { clave: 'intentos_login_max', valor: '5', tipo: 'number' as const, descripcion: 'Máximo de intentos de login', categoria: 'seguridad' }
];

export const getAllSettings = async () => {
  try {
    const settings = await ConfiguracionSistema.findAll();
    
    // Si no hay configuraciones, inicializar con valores por defecto
    if (settings.length === 0) {
      await initializeDefaultSettings();
      return await ConfiguracionSistema.findAll();
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting all settings:', error);
    throw new AppError('Error al obtener configuraciones');
  }
};

export const getSettingByKey = async (clave: string) => {
  try {
    const setting = await ConfiguracionSistema.findByPk(clave);
    
    if (!setting) {
      // Buscar en configuraciones por defecto
      const defaultSetting = DEFAULT_SETTINGS.find(s => s.clave === clave);
      if (defaultSetting) {
        return await ConfiguracionSistema.create(defaultSetting);
      }
      throw new AppError('Configuración no encontrada', 404);
    }
    
    return setting;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error getting setting by key:', error);
    throw new AppError('Error al obtener configuración');
  }
};

export const updateSetting = async (clave: string, valor: any, tipo?: 'string' | 'number' | 'boolean' | 'json') => {
  try {
    let setting = await ConfiguracionSistema.findByPk(clave);
    
    if (!setting) {
      // Crear nueva configuración
      const defaultSetting = DEFAULT_SETTINGS.find(s => s.clave === clave);
      const tipoFinal = tipo || defaultSetting?.tipo || 'string';
      
      setting = await ConfiguracionSistema.create({
        clave,
        valor: String(valor),
        tipo: tipoFinal,
        descripcion: defaultSetting?.descripcion,
        categoria: defaultSetting?.categoria
      });
    } else {
      // Actualizar configuración existente
      setting.valor = String(valor);
      if (tipo) setting.tipo = tipo;
      setting.updated_at = new Date();
      await setting.save();
    }
    
    return setting;
  } catch (error) {
    console.error('Error updating setting:', error);
    throw new AppError('Error al actualizar configuración');
  }
};

export const updateMultipleSettings = async (settings: Array<{ clave: string; valor: any; tipo?: 'string' | 'number' | 'boolean' | 'json' }>) => {
  try {
    const results = [];
    
    for (const { clave, valor, tipo } of settings) {
      const result = await updateSetting(clave, valor, tipo);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Error updating multiple settings:', error);
    throw new AppError('Error al actualizar configuraciones');
  }
};

export const getSettingsByCategory = async (categoria: string) => {
  try {
    const settings = await ConfiguracionSistema.findAll({
      where: { categoria }
    });
    
    return settings;
  } catch (error) {
    console.error('Error getting settings by category:', error);
    throw new AppError('Error al obtener configuraciones por categoría');
  }
};

export const initializeDefaultSettings = async () => {
  try {
    const existingSettings = await ConfiguracionSistema.findAll();
    const existingKeys = existingSettings.map(s => s.clave);
    
    const newSettings = DEFAULT_SETTINGS.filter(setting => !existingKeys.includes(setting.clave));
    
    if (newSettings.length > 0) {
      await ConfiguracionSistema.bulkCreate(newSettings);
      console.log(`Initialized ${newSettings.length} default settings`);
    }
    
    return { initialized: newSettings.length };
  } catch (error) {
    console.error('Error initializing default settings:', error);
    throw new AppError('Error al inicializar configuraciones por defecto');
  }
};

// Función auxiliar para convertir valor según tipo
export const parseSettingValue = (valor: string, tipo: 'string' | 'number' | 'boolean' | 'json') => {
  switch (tipo) {
    case 'number':
      return Number(valor);
    case 'boolean':
      return valor === 'true';
    case 'json':
      try {
        return JSON.parse(valor);
      } catch {
        return valor;
      }
    default:
      return valor;
  }
};

// Función para obtener configuraciones como objeto plano
export const getSettingsAsObject = async () => {
  try {
    const settings = await getAllSettings();
    const settingsObject: { [key: string]: any } = {};
    
    settings.forEach(setting => {
      settingsObject[setting.clave] = parseSettingValue(setting.valor, setting.tipo);
    });
    
    return settingsObject;
  } catch (error) {
    console.error('Error getting settings as object:', error);
    throw new AppError('Error al obtener configuraciones');
  }
};