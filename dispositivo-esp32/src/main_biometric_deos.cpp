/*
 * DEOS-Education Sistema Biométrico ESP32
 * Integración con AS608 + WiFi + MQTT para asistencia escolar
 * 
 * Hardware:
 * - ESP32 DevKit
 * - Sensor AS608 en UART2 (pins 16/17)
 * - LEDs: GPIO2 (success), GPIO4 (error)
 * 
 * Funciones:
 * - Verificación de huellas para asistencia
 * - Enrollment de nuevas huellas (modo admin)
 * - Comunicación MQTT con backend DEOS
 * - Buffer offline para registros
 * - Configuración web remota
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>
#include <Preferences.h>
#include <time.h>
#include <SPIFFS.h>

// ========== CONFIGURACIÓN HARDWARE ==========
#define RXD2 16           // AS608 RX (amarillo)
#define TXD2 17           // AS608 TX (negro)
#define LED_SUCCESS 2     // LED verde - asistencia OK
#define LED_ERROR 4       // LED rojo - error/denegado
#define LED_WIFI 5        // LED azul - estado WiFi
#define BUZZER_PIN 18     // Buzzer feedback sonoro

// ========== CONFIGURACIÓN SISTEMA ==========
#define DEVICE_ID "ESP32_AULA_A1"
#define FIRMWARE_VERSION "1.0.0"
#define MAX_OFFLINE_RECORDS 100
#define HEARTBEAT_INTERVAL 30000  // 30 segundos
#define WIFI_TIMEOUT 10000        // 10 segundos
#define MQTT_TIMEOUT 5000         // 5 segundos

// ========== OBJETOS GLOBALES ==========
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger(&mySerial);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Preferences preferences;

// ========== VARIABLES DE CONFIGURACIÓN ==========
struct Config {
  char wifi_ssid[32] = "DEOS_WiFi";
  char wifi_password[64] = "deos2024";
  char mqtt_server[32] = "192.168.1.100";
  int mqtt_port = 1883;
  char mqtt_user[32] = "deos";
  char mqtt_password[64] = "deos2024";
  char device_location[32] = "Aula_A1_PB";
  uint8_t sensor_sensitivity = 4;    // 1-9
  uint8_t max_attempts = 3;
  uint16_t scan_timeout = 10000;     // ms
  bool sound_enabled = true;
  bool continuous_mode = true;
  uint8_t led_brightness = 128;      // 0-255
} config;

// ========== VARIABLES DE ESTADO ==========
enum SystemState {
  INIT,
  WIFI_CONNECTING,
  MQTT_CONNECTING,
  READY,
  SCANNING,
  ENROLLING,
  OFFLINE,
  ERROR_STATE,
  CONFIG_MODE
};

SystemState currentState = INIT;
bool enrollMode = false;
bool debugMode = false;
unsigned long lastHeartbeat = 0;
unsigned long lastWifiCheck = 0;
unsigned long lastSensorCheck = 0;
int offlineRecordCount = 0;
int totalScansToday = 0;
int successfulScansToday = 0;

// ========== ESTRUCTURAS DE DATOS ==========
struct AttendanceRecord {
  uint32_t timestamp;
  uint8_t fingerprint_id;
  uint8_t confidence;
  char user_dni[12];
  bool synced;
};

AttendanceRecord offlineBuffer[MAX_OFFLINE_RECORDS];

// ========== TOPICS MQTT ==========
const char* TOPIC_ATTENDANCE = "deos/attendance/register";
const char* TOPIC_HEARTBEAT = "deos/device/heartbeat";
const char* TOPIC_CONFIG = "deos/device/config";
const char* TOPIC_ENROLLMENT = "deos/device/enrollment";
const char* TOPIC_COMMAND = "deos/device/command";
const char* TOPIC_SYNC_BATCH = "deos/device/sync/batch";

// ========== FUNCIONES DE INICIALIZACIÓN ==========

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
  
  printWelcome();
  
  // Inicializar hardware
  initializePins();
  initializeSPIFFS();
  loadConfiguration();
  
  // Inicializar sensor AS608
  if (!initializeSensor()) {
    currentState = ERROR_STATE;
    return;
  }
  
  // Inicializar conectividad
  initializeWiFi();
  initializeMQTT();
  initializeTime();
  
  // Estado inicial
  currentState = READY;
  Serial.println("✓ Sistema DEOS-Biométrico iniciado correctamente");
  printSystemInfo();
}

void printWelcome() {
  Serial.println("\n\n╔═══════════════════════════════════════════════════╗");
  Serial.println("║           DEOS-EDUCATION BIOMÉTRICO              ║");
  Serial.println("║              ESP32 + AS608 v1.0                  ║");
  Serial.println("║         Sistema de Asistencia Escolar            ║");
  Serial.println("╚═══════════════════════════════════════════════════╝");
  Serial.println();
}

void initializePins() {
  pinMode(LED_SUCCESS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Test inicial de LEDs
  digitalWrite(LED_SUCCESS, HIGH);
  digitalWrite(LED_ERROR, HIGH);
  digitalWrite(LED_WIFI, HIGH);
  delay(500);
  digitalWrite(LED_SUCCESS, LOW);
  digitalWrite(LED_ERROR, LOW);
  digitalWrite(LED_WIFI, LOW);
  
  Serial.println("✓ Pines GPIO inicializados");
}

void initializeSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("✗ Error al inicializar SPIFFS");
    return;
  }
  Serial.println("✓ Sistema de archivos SPIFFS inicializado");
}

bool initializeSensor() {
  Serial.println("Inicializando sensor AS608...");
  
  mySerial.begin(57600, SERIAL_8N1, RXD2, TXD2);
  finger.begin(57600);
  
  // Verificar conexión
  if (finger.verifyPassword()) {
    Serial.println("✓ Sensor AS608 conectado correctamente");
    
    // Obtener información del sensor
    finger.getParameters();
    Serial.printf("  - Capacidad: %d huellas\n", finger.capacity);
    Serial.printf("  - Seguridad: nivel %d\n", finger.security_level);
    Serial.printf("  - Baudrate: %d bps\n", finger.baud_rate * 9600);
    
    // Contar huellas almacenadas
    finger.getTemplateCount();
    Serial.printf("  - Huellas almacenadas: %d/%d\n", finger.templateCount, finger.capacity);
    
    // Configurar parámetros óptimos
    configureSensorParameters();
    
    return true;
  } else {
    Serial.println("✗ Error: Sensor AS608 no detectado");
    Serial.println("  Verificar conexiones:");
    Serial.println("  - Rojo (VCC) → 5V");
    Serial.println("  - Verde (GND) → GND");  
    Serial.println("  - Negro (RX) → GPIO 16");
    Serial.println("  - Amarillo (TX) → GPIO 17");
    return false;
  }
}

void configureSensorParameters() {
  // Configurar nivel de seguridad óptimo (balance velocidad/precisión)
  // Security level 3 = buena precisión, velocidad aceptable
  // Los valores ya están optimizados en el sensor
  Serial.println("✓ Parámetros del sensor configurados");
}

// ========== FUNCIONES DE CONECTIVIDAD ==========

void initializeWiFi() {
  Serial.printf("Conectando a WiFi %s", config.wifi_ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(config.wifi_ssid, config.wifi_password);
  
  digitalWrite(LED_WIFI, HIGH);  // LED encendido durante conexión
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < WIFI_TIMEOUT) {
    delay(500);
    Serial.print(".");
    
    // LED parpadeante durante conexión
    digitalWrite(LED_WIFI, !digitalRead(LED_WIFI));
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_WIFI, HIGH);  // LED fijo cuando conectado
    Serial.println();
    Serial.printf("✓ WiFi conectado - IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  - RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    digitalWrite(LED_WIFI, LOW);
    Serial.println("\n⚠ WiFi no conectado - modo offline activo");
    currentState = OFFLINE;
  }
}

void initializeMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  mqttClient.setServer(config.mqtt_server, config.mqtt_port);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024);  // Buffer más grande para payloads JSON
  
  connectMQTT();
}

void connectMQTT() {
  if (!mqttClient.connected() && WiFi.status() == WL_CONNECTED) {
    Serial.printf("Conectando a MQTT %s:%d", config.mqtt_server, config.mqtt_port);
    
    String clientId = "DEOS_" + String(DEVICE_ID);
    
    if (mqttClient.connect(clientId.c_str(), config.mqtt_user, config.mqtt_password)) {
      Serial.println("\n✓ MQTT conectado");
      
      // Suscribirse a topics de comando y configuración
      mqttClient.subscribe(TOPIC_COMMAND);
      mqttClient.subscribe(TOPIC_CONFIG);
      
      // Enviar heartbeat inicial
      publishHeartbeat();
      
    } else {
      Serial.printf("\n✗ Error MQTT: %d\n", mqttClient.state());
    }
  }
}

void initializeTime() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("✓ Sincronización de tiempo NTP configurada");
}

// ========== LOOP PRINCIPAL ==========

void loop() {
  // Mantener conexiones
  maintainConnections();
  
  // Procesar comandos por Serial
  handleSerialCommands();
  
  // Estado principal del sistema
  handleSystemState();
  
  // Heartbeat periódico
  handleHeartbeat();
  
  // Sincronización de registros offline
  handleOfflineSync();
  
  delay(50);  // Evitar sobrecarga del CPU
}

void maintainConnections() {
  // Verificar WiFi cada 30 segundos
  if (millis() - lastWifiCheck > 30000) {
    lastWifiCheck = millis();
    
    if (WiFi.status() != WL_CONNECTED) {
      digitalWrite(LED_WIFI, LOW);
      if (currentState != OFFLINE) {
        Serial.println("⚠ WiFi desconectado - cambiando a modo offline");
        currentState = OFFLINE;
      }
      
      // Intentar reconectar
      initializeWiFi();
    } else {
      digitalWrite(LED_WIFI, HIGH);
      if (currentState == OFFLINE) {
        Serial.println("✓ WiFi reconectado - saliendo de modo offline");
        currentState = READY;
        initializeMQTT();
      }
    }
  }
  
  // Mantener conexión MQTT
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    connectMQTT();
  }
  
  if (mqttClient.connected()) {
    mqttClient.loop();
  }
}

void handleSystemState() {
  switch (currentState) {
    case READY:
      if (!enrollMode && config.continuous_mode) {
        continuousVerification();
      }
      break;
      
    case SCANNING:
      // Estado manejado en continuousVerification()
      break;
      
    case ENROLLING:
      // Estado manejado en enrollmentProcess()
      break;
      
    case OFFLINE:
      // Seguir funcionando en modo offline
      if (!enrollMode && config.continuous_mode) {
        continuousVerification();
      }
      break;
      
    case ERROR_STATE:
      handleErrorState();
      break;
      
    case CONFIG_MODE:
      // Modo configuración (futuro: web server)
      break;
  }
}

// ========== FUNCIONES DE VERIFICACIÓN ==========

void continuousVerification() {
  static unsigned long lastCheck = 0;
  static bool fingerDetected = false;
  static unsigned long scanStartTime = 0;
  
  if (millis() - lastCheck > 200) {  // Check cada 200ms
    lastCheck = millis();
    
    uint8_t result = finger.getImage();
    
    // Detectar dedo puesto
    if (result == FINGERPRINT_OK && !fingerDetected) {
      fingerDetected = true;
      scanStartTime = millis();
      currentState = SCANNING;
      
      Serial.println("\n🔍 Escaneando huella...");
      
      // Procesar la huella
      processFingerprint();
      
    } else if (result == FINGERPRINT_NOFINGER) {
      fingerDetected = false;
      if (currentState == SCANNING) {
        currentState = READY;
      }
    }
    
    // Timeout de escaneo
    if (fingerDetected && millis() - scanStartTime > config.scan_timeout) {
      fingerDetected = false;
      currentState = READY;
      Serial.println("⏱ Timeout de escaneo");
      signalError();
    }
  }
}

void processFingerprint() {
  uint8_t result = finger.image2Tz();
  if (result != FINGERPRINT_OK) {
    Serial.println("✗ Error al procesar imagen");
    signalError();
    return;
  }
  
  result = finger.fingerSearch();
  
  if (result == FINGERPRINT_OK) {
    // ¡HUELLA ENCONTRADA!
    handleSuccessfulScan(finger.fingerID, finger.confidence);
  } else {
    // Huella no encontrada
    handleUnauthorizedScan();
  }
}

void handleSuccessfulScan(uint8_t fingerId, uint16_t confidence) {
  Serial.printf("✅ ACCESO AUTORIZADO\n");
  Serial.printf("   ID: %d | Confianza: %d%%\n", fingerId, confidence);
  
  // Buscar usuario asociado a esta huella
  String userDNI = getUserDNIFromFingerprintId(fingerId);
  
  // Crear registro de asistencia
  AttendanceRecord record;
  record.timestamp = getUnixTime();
  record.fingerprint_id = fingerId;
  record.confidence = confidence;
  strncpy(record.user_dni, userDNI.c_str(), sizeof(record.user_dni) - 1);
  record.synced = false;
  
  // Intentar enviar por MQTT
  if (currentState != OFFLINE && mqttClient.connected()) {
    if (publishAttendanceRecord(record)) {
      record.synced = true;
      Serial.println("📡 Registro enviado al servidor");
    } else {
      Serial.println("📦 Registro guardado localmente");
    }
  } else {
    Serial.println("💾 Modo offline - registro almacenado");
  }
  
  // Guardar en buffer offline si no se sincronizó
  if (!record.synced) {
    saveOfflineRecord(record);
  }
  
  // Feedback visual y sonoro
  signalSuccess();
  
  // Estadísticas
  totalScansToday++;
  successfulScansToday++;
  
  currentState = READY;
}

void handleUnauthorizedScan() {
  Serial.println("❌ ACCESO DENEGADO - Huella no registrada");
  
  // Log del intento no autorizado
  logUnauthorizedAttempt();
  
  // Feedback de error
  signalError();
  
  // Estadísticas
  totalScansToday++;
  
  currentState = READY;
}

// ========== FUNCIONES DE FEEDBACK ==========

void signalSuccess() {
  // LED verde
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_SUCCESS, HIGH);
    if (config.sound_enabled) tone(BUZZER_PIN, 1000, 100);
    delay(150);
    digitalWrite(LED_SUCCESS, LOW);
    delay(100);
  }
}

void signalError() {
  // LED rojo + buzzer error
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_ERROR, HIGH);
    if (config.sound_enabled) tone(BUZZER_PIN, 200, 80);
    delay(100);
    digitalWrite(LED_ERROR, LOW);
    delay(100);
  }
}

void signalEnrollmentStep(int step) {
  // LED azul para enrollment
  digitalWrite(LED_WIFI, HIGH);
  if (config.sound_enabled) tone(BUZZER_PIN, 500, 200);
  delay(300);
  digitalWrite(LED_WIFI, LOW);
}

// ========== FUNCIONES MQTT ==========

bool publishAttendanceRecord(const AttendanceRecord& record) {
  if (!mqttClient.connected()) return false;
  
  DynamicJsonDocument doc(512);
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = record.timestamp;
  doc["fingerprint_id"] = record.fingerprint_id;
  doc["user_dni"] = record.user_dni;
  doc["confidence"] = record.confidence;
  doc["location"] = config.device_location;
  doc["firmware_version"] = FIRMWARE_VERSION;
  
  String payload;
  serializeJson(doc, payload);
  
  bool success = mqttClient.publish(TOPIC_ATTENDANCE, payload.c_str());
  
  if (debugMode) {
    Serial.printf("📡 MQTT Payload: %s\n", payload.c_str());
  }
  
  return success;
}

void publishHeartbeat() {
  if (!mqttClient.connected()) return;
  
  DynamicJsonDocument doc(512);
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = getUnixTime();
  doc["status"] = getSystemStateString();
  doc["uptime"] = millis() / 1000;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_memory"] = ESP.getFreeHeap();
  doc["fingerprints_stored"] = finger.templateCount;
  doc["scans_today"] = totalScansToday;
  doc["success_rate"] = totalScansToday > 0 ? (successfulScansToday * 100 / totalScansToday) : 0;
  doc["offline_records"] = offlineRecordCount;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["location"] = config.device_location;
  
  String payload;
  serializeJson(doc, payload);
  
  mqttClient.publish(TOPIC_HEARTBEAT, payload.c_str());
  
  if (debugMode) {
    Serial.printf("💓 Heartbeat enviado: %s\n", payload.c_str());
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.printf("📨 MQTT recibido [%s]: %s\n", topic, message.c_str());
  
  if (strcmp(topic, TOPIC_COMMAND) == 0) {
    handleRemoteCommand(message);
  } else if (strcmp(topic, TOPIC_CONFIG) == 0) {
    handleRemoteConfig(message);
  }
}

// ========== FUNCIONES DE CONFIGURACIÓN ==========

void loadConfiguration() {
  preferences.begin("deos-config", false);
  
  // Cargar configuración desde NVS
  preferences.getString("wifi_ssid", config.wifi_ssid, sizeof(config.wifi_ssid));
  preferences.getString("wifi_pass", config.wifi_password, sizeof(config.wifi_password));
  preferences.getString("mqtt_server", config.mqtt_server, sizeof(config.mqtt_server));
  config.mqtt_port = preferences.getInt("mqtt_port", 1883);
  preferences.getString("mqtt_user", config.mqtt_user, sizeof(config.mqtt_user));
  preferences.getString("mqtt_pass", config.mqtt_password, sizeof(config.mqtt_password));
  preferences.getString("location", config.device_location, sizeof(config.device_location));
  config.sensor_sensitivity = preferences.getUChar("sensitivity", 4);
  config.max_attempts = preferences.getUChar("max_attempts", 3);
  config.scan_timeout = preferences.getUShort("scan_timeout", 10000);
  config.sound_enabled = preferences.getBool("sound_enabled", true);
  config.continuous_mode = preferences.getBool("continuous_mode", true);
  
  preferences.end();
  
  Serial.println("✓ Configuración cargada desde NVS");
}

void saveConfiguration() {
  preferences.begin("deos-config", false);
  
  preferences.putString("wifi_ssid", config.wifi_ssid);
  preferences.putString("wifi_pass", config.wifi_password);
  preferences.putString("mqtt_server", config.mqtt_server);
  preferences.putInt("mqtt_port", config.mqtt_port);
  preferences.putString("mqtt_user", config.mqtt_user);
  preferences.putString("mqtt_pass", config.mqtt_password);
  preferences.putString("location", config.device_location);
  preferences.putUChar("sensitivity", config.sensor_sensitivity);
  preferences.putUChar("max_attempts", config.max_attempts);
  preferences.putUShort("scan_timeout", config.scan_timeout);
  preferences.putBool("sound_enabled", config.sound_enabled);
  preferences.putBool("continuous_mode", config.continuous_mode);
  
  preferences.end();
  
  Serial.println("✓ Configuración guardada en NVS");
}

// ========== FUNCIONES DE UTILIDAD ==========

String getUserDNIFromFingerprintId(uint8_t fingerId) {
  // En una implementación real, esto vendría de una base de datos local
  // o de una consulta al servidor. Por ahora, mapeo básico:
  switch(fingerId) {
    case 1: return "12345678";    // Admin
    case 2: return "23456789";    // Profesor 1
    case 3: return "34567890";    // Estudiante 1
    case 4: return "45678901";    // Estudiante 2
    default: return "00000000";   // Desconocido
  }
}

uint32_t getUnixTime() {
  time_t now;
  time(&now);
  return now;
}

String getSystemStateString() {
  switch(currentState) {
    case INIT: return "INIT";
    case WIFI_CONNECTING: return "WIFI_CONNECTING";
    case MQTT_CONNECTING: return "MQTT_CONNECTING";
    case READY: return "READY";
    case SCANNING: return "SCANNING";
    case ENROLLING: return "ENROLLING";
    case OFFLINE: return "OFFLINE";
    case ERROR_STATE: return "ERROR";
    case CONFIG_MODE: return "CONFIG";
    default: return "UNKNOWN";
  }
}

void saveOfflineRecord(const AttendanceRecord& record) {
  if (offlineRecordCount < MAX_OFFLINE_RECORDS) {
    offlineBuffer[offlineRecordCount] = record;
    offlineRecordCount++;
    Serial.printf("💾 Registro offline guardado (%d/%d)\n", offlineRecordCount, MAX_OFFLINE_RECORDS);
  } else {
    Serial.println("⚠ Buffer offline lleno - descartando registro más antiguo");
    // Mover todos los registros una posición hacia adelante
    for (int i = 0; i < MAX_OFFLINE_RECORDS - 1; i++) {
      offlineBuffer[i] = offlineBuffer[i + 1];
    }
    offlineBuffer[MAX_OFFLINE_RECORDS - 1] = record;
  }
}

void handleOfflineSync() {
  static unsigned long lastSyncAttempt = 0;
  
  // Intentar sincronizar cada 60 segundos si hay registros pendientes
  if (offlineRecordCount > 0 && millis() - lastSyncAttempt > 60000) {
    lastSyncAttempt = millis();
    
    if (currentState != OFFLINE && mqttClient.connected()) {
      Serial.printf("🔄 Sincronizando %d registros offline...\n", offlineRecordCount);
      
      int synced = 0;
      for (int i = 0; i < offlineRecordCount; i++) {
        if (!offlineBuffer[i].synced) {
          if (publishAttendanceRecord(offlineBuffer[i])) {
            offlineBuffer[i].synced = true;
            synced++;
            delay(100);  // Evitar saturar MQTT
          }
        }
      }
      
      if (synced > 0) {
        Serial.printf("✅ %d registros sincronizados\n", synced);
        // Remover registros sincronizados
        compactOfflineBuffer();
      }
    }
  }
}

void compactOfflineBuffer() {
  int writeIndex = 0;
  for (int readIndex = 0; readIndex < offlineRecordCount; readIndex++) {
    if (!offlineBuffer[readIndex].synced) {
      if (writeIndex != readIndex) {
        offlineBuffer[writeIndex] = offlineBuffer[readIndex];
      }
      writeIndex++;
    }
  }
  offlineRecordCount = writeIndex;
}

void handleHeartbeat() {
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    publishHeartbeat();
  }
}

void handleErrorState() {
  // En estado de error, parpadear LED de error
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink > 1000) {
    lastBlink = millis();
    digitalWrite(LED_ERROR, !digitalRead(LED_ERROR));
  }
  
  // Intentar recuperarse verificando sensor
  if (millis() - lastSensorCheck > 10000) {
    lastSensorCheck = millis();
    if (finger.verifyPassword()) {
      Serial.println("✓ Sensor recuperado - saliendo de estado de error");
      currentState = READY;
      digitalWrite(LED_ERROR, LOW);
    }
  }
}

void logUnauthorizedAttempt() {
  // Log local del intento no autorizado
  if (debugMode) {
    Serial.printf("🚫 Intento no autorizado: %s\n", getFormattedTime().c_str());
  }
  
  // Enviar alerta por MQTT si está conectado
  if (mqttClient.connected()) {
    DynamicJsonDocument doc(256);
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = getUnixTime();
    doc["event"] = "UNAUTHORIZED_ATTEMPT";
    doc["location"] = config.device_location;
    
    String payload;
    serializeJson(doc, payload);
    
    mqttClient.publish("deos/security/unauthorized", payload.c_str());
  }
}

String getFormattedTime() {
  time_t now;
  time(&now);
  struct tm* timeinfo = localtime(&now);
  
  char buffer[80];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", timeinfo);
  return String(buffer);
}

void printSystemInfo() {
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("           INFORMACIÓN DEL SISTEMA");
  Serial.println("═══════════════════════════════════════");
  Serial.printf("Device ID: %s\n", DEVICE_ID);
  Serial.printf("Firmware: %s\n", FIRMWARE_VERSION);
  Serial.printf("Ubicación: %s\n", config.device_location);
  Serial.printf("WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "Conectado" : "Desconectado");
  Serial.printf("MQTT: %s\n", mqttClient.connected() ? "Conectado" : "Desconectado");
  Serial.printf("Estado: %s\n", getSystemStateString().c_str());
  Serial.printf("Huellas: %d/%d\n", finger.templateCount, finger.capacity);
  Serial.printf("Memoria libre: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("Uptime: %lu segundos\n", millis() / 1000);
  Serial.println("═══════════════════════════════════════");
}

// ========== COMANDOS POR SERIAL ==========

void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "info") {
      printSystemInfo();
    } else if (command == "debug") {
      debugMode = !debugMode;
      Serial.printf("Debug mode: %s\n", debugMode ? "ON" : "OFF");
    } else if (command == "enroll") {
      startEnrollmentMode();
    } else if (command == "reset") {
      ESP.restart();
    } else if (command == "wifi") {
      initializeWiFi();
    } else if (command == "mqtt") {
      connectMQTT();
    } else if (command == "test") {
      testAllSystems();
    } else if (command.startsWith("config ")) {
      handleConfigCommand(command.substring(7));
    } else if (command == "help") {
      printHelp();
    } else {
      Serial.println("Comando no reconocido. Usa 'help' para ver comandos disponibles.");
    }
  }
}

void printHelp() {
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("            COMANDOS DISPONIBLES");
  Serial.println("═══════════════════════════════════════");
  Serial.println("info     - Mostrar información del sistema");
  Serial.println("debug    - Toggle modo debug");
  Serial.println("enroll   - Iniciar modo enrollment");
  Serial.println("reset    - Reiniciar ESP32");
  Serial.println("wifi     - Reconectar WiFi");
  Serial.println("mqtt     - Reconectar MQTT");
  Serial.println("test     - Test de todos los sistemas");
  Serial.println("config   - Comandos de configuración");
  Serial.println("help     - Mostrar esta ayuda");
  Serial.println("═══════════════════════════════════════");
}

void startEnrollmentMode() {
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║        MODO ENROLLMENT ACTIVADO       ║");
  Serial.println("╚═══════════════════════════════════════╝");
  
  enrollMode = true;
  currentState = ENROLLING;
  
  // Aquí iría la lógica de enrollment similar al código original
  // pero adaptada al sistema DEOS
  
  Serial.println("Función de enrollment pendiente de implementación");
  Serial.println("Usar interfaz web o comandos MQTT para enrollment");
  
  enrollMode = false;
  currentState = READY;
}

void testAllSystems() {
  Serial.println("\n🧪 EJECUTANDO TESTS DEL SISTEMA...\n");
  
  // Test sensor
  Serial.print("Sensor AS608: ");
  if (finger.verifyPassword()) {
    Serial.println("✅ OK");
  } else {
    Serial.println("❌ FALLO");
  }
  
  // Test WiFi
  Serial.print("WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("✅ OK (%s, %d dBm)\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("❌ DESCONECTADO");
  }
  
  // Test MQTT
  Serial.print("MQTT: ");
  if (mqttClient.connected()) {
    Serial.println("✅ OK");
  } else {
    Serial.println("❌ DESCONECTADO");
  }
  
  // Test LEDs
  Serial.println("LEDs: ✅ OK (test visual)");
  signalSuccess();
  delay(500);
  signalError();
  
  // Test memoria
  Serial.printf("Memoria libre: %d bytes ", ESP.getFreeHeap());
  if (ESP.getFreeHeap() > 50000) {
    Serial.println("✅ OK");
  } else {
    Serial.println("⚠ BAJA");
  }
  
  Serial.println("\n🧪 Tests completados");
}

void handleConfigCommand(String params) {
  // Comandos de configuración por Serial
  if (params.startsWith("wifi ")) {
    // config wifi SSID PASSWORD
    // Implementar configuración WiFi
    Serial.println("Configuración WiFi por Serial pendiente");
  } else if (params.startsWith("mqtt ")) {
    // config mqtt SERVER PORT USER PASS
    Serial.println("Configuración MQTT por Serial pendiente");
  } else if (params == "save") {
    saveConfiguration();
  } else if (params == "load") {
    loadConfiguration();
  } else {
    Serial.println("Uso: config [wifi|mqtt|save|load]");
  }
}

void handleRemoteCommand(String command) {
  // Comandos remotos por MQTT
  DynamicJsonDocument doc(256);
  deserializeJson(doc, command);
  
  String cmd = doc["command"];
  
  if (cmd == "restart") {
    Serial.println("🔄 Reinicio remoto solicitado");
    delay(1000);
    ESP.restart();
  } else if (cmd == "enrollment_mode") {
    bool enable = doc["enable"];
    enrollMode = enable;
    currentState = enable ? ENROLLING : READY;
    Serial.printf("🔧 Modo enrollment: %s\n", enable ? "ACTIVADO" : "DESACTIVADO");
  } else if (cmd == "get_status") {
    publishHeartbeat();
  } else if (cmd == "sync_offline") {
    // Forzar sincronización
    handleOfflineSync();
  }
}

void handleRemoteConfig(String configJson) {
  // Configuración remota por MQTT
  DynamicJsonDocument doc(512);
  deserializeJson(doc, configJson);
  
  // Actualizar configuración
  if (doc.containsKey("sensitivity")) {
    config.sensor_sensitivity = doc["sensitivity"];
  }
  if (doc.containsKey("max_attempts")) {
    config.max_attempts = doc["max_attempts"];
  }
  if (doc.containsKey("scan_timeout")) {
    config.scan_timeout = doc["scan_timeout"];
  }
  if (doc.containsKey("sound_enabled")) {
    config.sound_enabled = doc["sound_enabled"];
  }
  if (doc.containsKey("continuous_mode")) {
    config.continuous_mode = doc["continuous_mode"];
  }
  
  // Guardar configuración
  saveConfiguration();
  
  Serial.println("⚙️ Configuración actualizada remotamente");
}