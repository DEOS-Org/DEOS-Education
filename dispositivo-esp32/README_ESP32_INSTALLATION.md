# 🔧 DEOS-Education ESP32 - Guía de Instalación

## 📋 **COMPONENTES REQUERIDOS**

### **Hardware Necesario:**
- ✅ **ESP32 DevKit V1** (recomendado)
- ✅ **Sensor AS608** (o compatible R307/R551)
- ✅ **LEDs**: Verde (GPIO2), Rojo (GPIO4), Azul (GPIO5)
- ✅ **Buzzer** (GPIO18) - opcional
- ✅ **Cables Dupont** hembra-macho
- ✅ **Breadboard** o PCB personalizada
- ✅ **Fuente 5V** para el sensor
- ✅ **Cable USB** para programación

### **Software Necesario:**
- ✅ **PlatformIO IDE** (VS Code + extensión)
- ✅ **Git** para clonar repositorio
- ✅ **Driver USB-Serial** del ESP32

---

## ⚡ **INSTALACIÓN RÁPIDA**

### **1. Clonar Repositorio**
```bash
git clone https://github.com/DEOS-Org/DEOS-Education.git
cd DEOS-Education/dispositivo-esp32
```

### **2. Abrir en PlatformIO**
```bash
# Desde VS Code con PlatformIO instalado
code .

# O desde línea de comandos
pio run
```

### **3. Compilar y Subir**
```bash
# Compilar para desarrollo
pio run -e esp32dev_debug

# Subir al ESP32
pio run -e esp32dev_debug -t upload

# Monitor serial
pio device monitor -b 115200
```

---

## 🔌 **CONEXIONES HARDWARE**

### **ESP32 ↔ Sensor AS608**
```
ESP32          AS608 (Sensor)
-----          --------------
5V       →     Rojo (VCC)
GND      →     Verde (GND)  
GPIO 16  →     Negro (TX del sensor)
GPIO 17  →     Amarillo (RX del sensor)
```

### **ESP32 ↔ Componentes Adicionales**
```
ESP32          Componente
-----          ----------
GPIO 2   →     LED Verde (Success) + Resistencia 220Ω
GPIO 4   →     LED Rojo (Error) + Resistencia 220Ω
GPIO 5   →     LED Azul (WiFi Status) + Resistencia 220Ω
GPIO 18  →     Buzzer + (Opcional)
GND      →     Cátodos de LEDs y Buzzer -
```

### **Diagrama de Conexión**
```
                    ESP32 DevKit V1
                   ┌─────────────────┐
                   │                 │
              5V ──┤ 5V         GPIO2├── LED Verde
             GND ──┤ GND        GPIO4├── LED Rojo  
                   │            GPIO5├── LED Azul
                   │           GPIO16├── AS608 Negro (TX)
                   │           GPIO17├── AS608 Amarillo (RX)
                   │           GPIO18├── Buzzer
                   │                 │
                   └─────────────────┘
                           │
                      ┌────┴────┐
                      │ AS608   │
                      │ Sensor  │
                      └─────────┘
```

---

## ⚙️ **CONFIGURACIÓN POR ENVIRONMENT**

### **Desarrollo (Debug)**
```bash
pio run -e esp32dev_debug -t upload
pio device monitor -f esp32_exception_decoder
```

### **Producción**
```bash
pio run -e esp32dev_release -t upload
```

### **Por Ubicación Específica**
```bash
# Aula A1
pio run -e aula_a1 -t upload

# Aula B2  
pio run -e aula_b2 -t upload

# Laboratorio
pio run -e laboratorio -t upload

# Biblioteca
pio run -e biblioteca -t upload
```

---

## 🛠️ **CONFIGURACIÓN INICIAL**

### **1. Primera Configuración**
Al encender por primera vez, conectar por Serial (115200 baudios):

```
╔═══════════════════════════════════════════════════╗
║           DEOS-EDUCATION BIOMÉTRICO              ║
║              ESP32 + AS608 v1.0                  ║
║         Sistema de Asistencia Escolar            ║
╚═══════════════════════════════════════════════════╝

✓ Pines GPIO inicializados
✓ Sistema de archivos SPIFFS inicializado
✓ Sensor AS608 conectado correctamente
  - Capacidad: 200 huellas
  - Seguridad: nivel 3
  - Baudrate: 57600 bps
  - Huellas almacenadas: 0/200
✓ Parámetros del sensor configurados
Conectando a WiFi DEOS_WiFi.................
✓ WiFi conectado - IP: 192.168.1.150
  - RSSI: -45 dBm
✓ MQTT conectado
✓ Sincronización de tiempo NTP configurada
✓ Sistema DEOS-Biométrico iniciado correctamente
```

### **2. Comandos de Configuración**
```bash
# Ver información del sistema
info

# Activar modo debug
debug

# Configurar WiFi manualmente
config wifi SSID PASSWORD

# Configurar MQTT
config mqtt SERVER PORT USER PASS

# Guardar configuración
config save

# Test de todos los sistemas
test

# Ver ayuda
help
```

---

## 📡 **CONFIGURACIÓN MQTT**

### **Topics Utilizados:**
```
deos/attendance/register     - Registro de asistencias
deos/device/heartbeat        - Estado del dispositivo
deos/device/config           - Configuración remota
deos/device/command          - Comandos remotos
deos/device/enrollment       - Enrollment de huellas
deos/security/unauthorized   - Intentos no autorizados
```

### **Payload de Asistencia:**
```json
{
  "device_id": "ESP32_AULA_A1",
  "timestamp": 1703683200,
  "fingerprint_id": 15,
  "user_dni": "12345678",
  "confidence": 95,
  "location": "Aula_A1_PB",
  "firmware_version": "1.0.0"
}
```

### **Configuración Broker MQTT:**
```
Servidor: 192.168.1.100
Puerto: 1883
Usuario: deos
Password: deos2024
QoS: 1 (garantizar entrega)
```

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **❌ Sensor AS608 no detectado**
```bash
# Verificar conexiones
- Rojo (VCC) → 5V del ESP32
- Verde (GND) → GND del ESP32  
- Negro (TX) → GPIO 16
- Amarillo (RX) → GPIO 17

# Verificar alimentación
- Sensor requiere 5V estables
- Verificar que el ESP32 tenga alimentación externa si es necesario

# Test de comunicación
test  # Comando por Serial
```

### **📡 WiFi no conecta**
```bash
# Verificar credenciales
config wifi NOMBRE_RED PASSWORD_CORRECTO

# Verificar red 2.4GHz
# El ESP32 no soporta 5GHz

# Reset de configuración WiFi
config load  # Cargar configuración por defecto
```

### **🔴 MQTT desconectado**
```bash
# Verificar servidor MQTT
ping 192.168.1.100

# Verificar credenciales
config mqtt 192.168.1.100 1883 usuario password

# Test de conexión
mqtt  # Comando por Serial
```

### **💾 Memoria insuficiente**
```bash
# Verificar memoria libre
info

# Si memoria < 50KB:
# - Reiniciar: reset
# - Verificar memory leaks en código
# - Usar environment con PSRAM: esp32_wrover
```

### **🔍 Huellas no reconocidas**
```bash
# Verificar calidad del sensor
test

# Limpiar superficie del sensor
# Usar alcohol isopropílico 70%

# Ajustar sensibilidad (por MQTT o Serial)
config sensitivity 4  # Valores 1-9

# Re-enrollment si es necesario
enroll
```

---

## 📊 **MONITOREO Y LOGS**

### **Logs por Serial (Debug)**
```
🔍 Escaneando huella...
✅ ACCESO AUTORIZADO
   ID: 15 | Confianza: 95%
📡 MQTT Payload: {"device_id":"ESP32_AULA_A1",...}
📡 Registro enviado al servidor
💓 Heartbeat enviado: {"status":"READY","uptime":3600,...}
```

### **Estados del Sistema:**
- 🟢 **READY**: Esperando huella
- 🔵 **SCANNING**: Procesando huella  
- 🟡 **ENROLLING**: Registrando nueva huella
- 🔴 **ERROR**: Estado de error
- ⚫ **OFFLINE**: Sin conectividad
- ⚙️ **CONFIG**: Modo configuración

### **Métricas Disponibles:**
- Uptime del dispositivo
- Huellas almacenadas
- Tasa de éxito de escaneos
- Calidad de señal WiFi
- Memoria libre
- Registros offline pendientes

---

## 🚀 **DEPLOYMENT EN PRODUCCIÓN**

### **1. Preparación del Dispositivo**
```bash
# Compilar versión release
pio run -e esp32dev_release -t upload

# Verificar configuración
config save
info
test
```

### **2. Instalación Física**
- 📦 **Carcasa protectora** (IP65 recomendado)
- ⚡ **Alimentación estable** 5V/2A mínimo
- 📶 **Ubicación con buena señal WiFi**
- 🔒 **Montaje seguro** anti-vandalismo
- 🧹 **Acceso para limpieza** del sensor

### **3. Configuración de Red**
```bash
# WiFi dedicada para dispositivos IoT
SSID: DEOS_IoT_Devices
Password: [contraseña_segura]
Frecuencia: 2.4GHz
Seguridad: WPA2/WPA3

# IP estática recomendada
IP: 192.168.100.10-50
Gateway: 192.168.100.1
DNS: 8.8.8.8, 8.8.4.4
```

### **4. Backup de Configuración**
```bash
# Exportar configuración
config save
info > device_config.txt

# Backup de huellas (manual)
# Las huellas se almacenan en el sensor AS608
# No son exportables por seguridad
```

---

## 📈 **MANTENIMIENTO**

### **Diario:**
- ✅ Verificar conectividad (LED azul encendido)
- ✅ Limpiar superficie del sensor si es necesario

### **Semanal:**
- ✅ Revisar logs de errores por Serial
- ✅ Verificar sincronización de registros offline
- ✅ Test completo del sistema

### **Mensual:**
- ✅ Actualización de firmware (OTA)
- ✅ Backup de configuración
- ✅ Verificar desgaste físico de componentes

### **Comandos de Mantenimiento:**
```bash
# Test completo
test

# Información del sistema
info

# Forzar sincronización offline
sync_offline

# Reinicio limpio
reset
```

---

## 🔐 **SEGURIDAD**

### **Medidas Implementadas:**
- 🔒 **Cifrado WPA2/WPA3** para WiFi
- 🔐 **Autenticación MQTT** con usuario/contraseña
- 🛡️ **Rate limiting** en intentos de escaneo
- 📝 **Logs de intentos no autorizados**
- ⏰ **Validación de timestamps** (anti-replay)
- 🔄 **Auto-restart** en caso de fallos críticos

### **Recomendaciones Adicionales:**
- 🚫 **Cambiar credenciales por defecto**
- 🔇 **Deshabilitar Serial en producción**
- 📶 **Red WiFi segregada** para IoT
- 🔥 **Firewall** en router/broker MQTT
- 📊 **Monitoreo de tráfico** anómalo

---

## 📞 **SOPORTE TÉCNICO**

### **Contacto:**
- 📧 **Email**: soporte@deos.education
- 📱 **WhatsApp**: +54 9 XXX XXX XXXX
- 🌐 **Web**: https://docs.deos.education/esp32

### **Información para Soporte:**
```bash
# Ejecutar y enviar output completo:
info
test
debug

# Incluir en el reporte:
- Versión de firmware
- Configuración de red
- Logs de error específicos
- Fotos del montaje físico
```

---

## 📝 **CHANGELOG**

### **v1.0.0** (2024-06-27)
- ✅ Primera versión funcional
- ✅ Integración AS608 + WiFi + MQTT
- ✅ Modo offline con buffer
- ✅ Configuración remota
- ✅ Múltiples environments PlatformIO
- ✅ Sistema de logs completo
- ✅ Heartbeat y monitoreo

### **Próximas Versiones:**
- 🔄 **v1.1.0**: OTA updates automáticas
- 🌐 **v1.2.0**: Interface web de configuración
- 📱 **v1.3.0**: App móvil para enrollment
- 🤖 **v2.0.0**: IA para detección de anomalías

---

**🎓 DEOS-Education Team - Sistema Biométrico ESP32 v1.0**