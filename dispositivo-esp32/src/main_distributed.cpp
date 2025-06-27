#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <Adafruit_Fingerprint.h>
#include <SPIFFS.h>
#include <HTTPClient.h>

// Configuración opcional de pantalla táctil (comentar si no se usa)
// #define USE_TOUCHSCREEN
#ifdef USE_TOUCHSCREEN
  #include <TFT_eSPI.h>
  #include <lvgl.h>
#endif

// --- Configuración WiFi y MQTT ---
const char* ssid = "Kosmo";
const char* password = "12345678";
const char* mqtt_server = "192.168.68.124";
const int mqtt_port = 1883;
const char* backend_url = "http://192.168.68.124:3000"; // Backend para sync

// --- ID único del dispositivo ---
const String DEVICE_ID = "ESP32_Huella_01";
const String DEVICE_NAME = "Sensor Principal";
const String DEVICE_LOCATION = "Entrada Principal";

// --- Instancias de objetos ---
WiFiClient espClient;
PubSubClient client(espClient);
Preferences preferences;
HTTPClient http;

#ifdef USE_TOUCHSCREEN
TFT_eSPI tft = TFT_eSPI();
#endif

// --- Tópicos MQTT ---
const char* topic_cmd = "escuela/biometrico/comandos";
const char* topic_event = "escuela/biometrico/eventos";
const char* topic_status = "escuela/biometrico/estado";
const char* topic_sync = "escuela/biometrico/sincronizacion";

// --- Configuración del sensor de huellas ---
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17
HardwareSerial fingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

// --- LEDs indicadores ---
#define LED_OK 25      // Verde - OK
#define LED_ERROR 26   // Rojo - Error  
#define LED_BUSY 27    // Amarillo - Procesando
#define LED_OFFLINE 14 // Azul - Modo offline

// --- Estados del sistema ---
enum SystemState {
    INITIALIZING,
    OFFLINE_MODE,
    ONLINE_MODE,
    SYNCING,
    ENROLLING_STEP1,
    ENROLLING_STEP2,
    ERROR_STATE
};
SystemState currentState = INITIALIZING;

// --- Estructuras de datos ---
struct UserFingerprint {
    int userId;
    String dni;
    String nombre;
    String rol;
    int localSlot;
    int confidence;
    unsigned long lastUsed;
    bool synced;
};

struct OfflineEvent {
    String type;
    JsonDocument data;
    unsigned long timestamp;
    int attempts;
};

// --- Variables globales ---
std::vector<UserFingerprint> localFingerprintCache;
std::vector<OfflineEvent> offlineEventQueue;
unsigned long lastHeartbeat = 0;
unsigned long lastSyncAttempt = 0;
unsigned long lastConnectionAttempt = 0;
bool wifiConnected = false;
bool mqttConnected = false;
bool isOnline = false;
int enrollingUserId = -1;
String enrollingUserInfo = "";

// Configuración de timings
const unsigned long HEARTBEAT_INTERVAL = 30000;    // 30 segundos
const unsigned long SYNC_INTERVAL = 60000;         // 1 minuto
const unsigned long WIFI_RETRY_INTERVAL = 30000;   // 30 segundos
const unsigned long MAX_OFFLINE_EVENTS = 1000;     // Máximo eventos en cola

// --- Funciones de pantalla (con fallback a LEDs) ---
void displayMessage(const String& title, const String& message, const String& type = "info") {
    #ifdef USE_TOUCHSCREEN
        // TODO: Implementar UI en pantalla táctil
        tft.fillScreen(TFT_BLACK);
        tft.setTextColor(TFT_WHITE);
        tft.setTextSize(2);
        tft.drawString(title, 10, 10);
        tft.setTextSize(1);
        tft.drawString(message, 10, 50);
    #endif
    
    // Fallback a LEDs y Serial
    Serial.println("[" + type + "] " + title + ": " + message);
    
    if (type == "success") {
        blinkLED(LED_OK, 2);
    } else if (type == "error") {
        blinkLED(LED_ERROR, 3);
    } else if (type == "info") {
        blinkLED(LED_BUSY, 1);
    }
}

void updateStatusDisplay() {
    String status = "Estado: ";
    switch (currentState) {
        case OFFLINE_MODE:
            status += "OFFLINE";
            setLED(LED_OFFLINE, true);
            setLED(LED_OK, false);
            break;
        case ONLINE_MODE:
            status += "ONLINE";
            setLED(LED_OK, true);
            setLED(LED_OFFLINE, false);
            break;
        case SYNCING:
            status += "SINCRONIZANDO";
            blinkLED(LED_BUSY, 1);
            break;
        case ERROR_STATE:
            status += "ERROR";
            setLED(LED_ERROR, true);
            break;
        default:
            status += "INICIANDO";
            blinkLED(LED_BUSY, 1);
    }
    
    #ifdef USE_TOUCHSCREEN
        // Actualizar pantalla con estado
        // TODO: Implementar UI de estado
    #endif
    
    Serial.println(status);
}

// --- Funciones de LED ---
void setLED(int led, bool state) {
    digitalWrite(led, state ? HIGH : LOW);
}

void blinkLED(int led, int times = 1, int delayMs = 200) {
    for (int i = 0; i < times; i++) {
        setLED(led, true);
        delay(delayMs);
        setLED(led, false);
        if (i < times - 1) delay(delayMs);
    }
}

void clearAllLEDs() {
    setLED(LED_OK, false);
    setLED(LED_ERROR, false);
    setLED(LED_BUSY, false);
    setLED(LED_OFFLINE, false);
}

// --- Funciones de cache local ---
void loadFingerprintCache() {
    preferences.begin("fingerprints", true);
    size_t count = preferences.getUInt("count", 0);
    
    localFingerprintCache.clear();
    
    for (size_t i = 0; i < count; i++) {
        String key = "fp_" + String(i);
        String data = preferences.getString(key.c_str(), "");
        
        if (data.length() > 0) {
            JsonDocument doc;
            deserializeJson(doc, data);
            
            UserFingerprint fp;
            fp.userId = doc["userId"];
            fp.dni = doc["dni"].as<String>();
            fp.nombre = doc["nombre"].as<String>();
            fp.rol = doc["rol"].as<String>();
            fp.localSlot = doc["localSlot"];
            fp.confidence = doc["confidence"];
            fp.lastUsed = doc["lastUsed"];
            fp.synced = doc["synced"];
            
            localFingerprintCache.push_back(fp);
        }
    }
    
    preferences.end();
    Serial.println("Cache de huellas cargado: " + String(localFingerprintCache.size()) + " entradas");
}

void saveFingerprintCache() {
    preferences.begin("fingerprints", false);
    
    // Limpiar cache anterior
    preferences.clear();
    
    // Guardar nuevas entradas
    preferences.putUInt("count", localFingerprintCache.size());
    
    for (size_t i = 0; i < localFingerprintCache.size(); i++) {
        JsonDocument doc;
        doc["userId"] = localFingerprintCache[i].userId;
        doc["dni"] = localFingerprintCache[i].dni;
        doc["nombre"] = localFingerprintCache[i].nombre;
        doc["rol"] = localFingerprintCache[i].rol;
        doc["localSlot"] = localFingerprintCache[i].localSlot;
        doc["confidence"] = localFingerprintCache[i].confidence;
        doc["lastUsed"] = localFingerprintCache[i].lastUsed;
        doc["synced"] = localFingerprintCache[i].synced;
        
        String data;
        serializeJson(doc, data);
        
        String key = "fp_" + String(i);
        preferences.putString(key.c_str(), data);
    }
    
    preferences.end();
    Serial.println("Cache de huellas guardado: " + String(localFingerprintCache.size()) + " entradas");
}

UserFingerprint* findFingerprintBySlot(int slot) {
    for (auto& fp : localFingerprintCache) {
        if (fp.localSlot == slot) {
            return &fp;
        }
    }
    return nullptr;
}

UserFingerprint* findFingerprintByUserId(int userId) {
    for (auto& fp : localFingerprintCache) {
        if (fp.userId == userId) {
            return &fp;
        }
    }
    return nullptr;
}

// --- Funciones de cola offline ---
void loadOfflineQueue() {
    if (!SPIFFS.begin(true)) {
        Serial.println("Error inicializando SPIFFS");
        return;
    }
    
    File file = SPIFFS.open("/offline_queue.json", "r");
    if (!file) {
        Serial.println("No existe cola offline, creando nueva");
        return;
    }
    
    String content = file.readString();
    file.close();
    
    JsonDocument doc;
    deserializeJson(doc, content);
    
    offlineEventQueue.clear();
    JsonArray events = doc["events"];
    
    for (JsonVariant event : events) {
        OfflineEvent offlineEvent;
        offlineEvent.type = event["type"].as<String>();
        offlineEvent.data = event["data"];
        offlineEvent.timestamp = event["timestamp"];
        offlineEvent.attempts = event["attempts"];
        
        offlineEventQueue.push_back(offlineEvent);
    }
    
    Serial.println("Cola offline cargada: " + String(offlineEventQueue.size()) + " eventos");
}

void saveOfflineQueue() {
    if (!SPIFFS.begin(true)) {
        Serial.println("Error accediendo a SPIFFS");
        return;
    }
    
    JsonDocument doc;
    JsonArray events = doc.createNestedArray("events");
    
    for (const auto& event : offlineEventQueue) {
        JsonObject eventObj = events.createNestedObject();
        eventObj["type"] = event.type;
        eventObj["data"] = event.data;
        eventObj["timestamp"] = event.timestamp;
        eventObj["attempts"] = event.attempts;
    }
    
    File file = SPIFFS.open("/offline_queue.json", "w");
    if (file) {
        serializeJson(doc, file);
        file.close();
        Serial.println("Cola offline guardada: " + String(offlineEventQueue.size()) + " eventos");
    } else {
        Serial.println("Error guardando cola offline");
    }
}

void addOfflineEvent(const String& type, const JsonDocument& data) {
    if (offlineEventQueue.size() >= MAX_OFFLINE_EVENTS) {
        // Remover el evento más antiguo
        offlineEventQueue.erase(offlineEventQueue.begin());
        Serial.println("Cola offline llena, removiendo evento más antiguo");
    }
    
    OfflineEvent event;
    event.type = type;
    event.data = data;
    event.timestamp = millis();
    event.attempts = 0;
    
    offlineEventQueue.push_back(event);
    saveOfflineQueue();
    
    Serial.println("Evento agregado a cola offline: " + type);
}

// --- Funciones de conectividad ---
bool connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return true;
    }
    
    Serial.println("Conectando a WiFi...");
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    wifiConnected = (WiFi.status() == WL_CONNECTED);
    
    if (wifiConnected) {
        Serial.println("\nWiFi conectado: " + WiFi.localIP().toString());
        displayMessage("WiFi", "Conectado: " + WiFi.localIP().toString(), "success");
        return true;
    } else {
        Serial.println("\nError conectando WiFi");
        displayMessage("WiFi", "Error de conexión", "error");
        return false;
    }
}

bool connectMQTT() {
    if (!wifiConnected) return false;
    
    if (client.connected()) {
        return true;
    }
    
    Serial.println("Conectando a MQTT...");
    
    if (client.connect(DEVICE_ID.c_str())) {
        Serial.println("MQTT conectado");
        client.subscribe(topic_cmd);
        client.subscribe(topic_sync);
        
        // Publicar estado online
        publishStatus("online", "Dispositivo conectado");
        
        mqttConnected = true;
        return true;
    } else {
        Serial.println("Error conectando MQTT: " + String(client.state()));
        mqttConnected = false;
        return false;
    }
}

void checkConnectivity() {
    bool wasOnline = isOnline;
    wifiConnected = (WiFi.status() == WL_CONNECTED);
    
    if (wifiConnected) {
        mqttConnected = connectMQTT();
        isOnline = mqttConnected;
    } else {
        mqttConnected = false;
        isOnline = false;
    }
    
    // Cambio de estado de conectividad
    if (wasOnline != isOnline) {
        if (isOnline) {
            Serial.println("=== DISPOSITIVO ONLINE ===");
            currentState = ONLINE_MODE;
            displayMessage("Conexión", "Dispositivo en línea", "success");
            // Iniciar sincronización
            requestFullSync();
        } else {
            Serial.println("=== DISPOSITIVO OFFLINE ===");
            currentState = OFFLINE_MODE;
            displayMessage("Conexión", "Modo sin conexión", "info");
        }
        updateStatusDisplay();
    }
}

// --- Funciones de sincronización ---
void requestFullSync() {
    if (!isOnline) return;
    
    currentState = SYNCING;
    updateStatusDisplay();
    
    Serial.println("Iniciando sincronización completa...");
    
    // Solicitar todas las huellas del backend
    http.begin(String(backend_url) + "/api/biometric/devices/" + DEVICE_ID + "/sync");
    http.addHeader("Content-Type", "application/json");
    
    JsonDocument syncRequest;
    syncRequest["device_id"] = DEVICE_ID;
    syncRequest["current_fingerprints"] = localFingerprintCache.size();
    syncRequest["firmware_version"] = "2.0.0";
    syncRequest["last_sync"] = preferences.getULong("last_sync", 0);
    
    String payload;
    serializeJson(syncRequest, payload);
    
    int httpCode = http.POST(payload);
    
    if (httpCode == 200) {
        String response = http.getString();
        processSyncResponse(response);
        preferences.putULong("last_sync", millis());
    } else {
        Serial.println("Error en sincronización: " + String(httpCode));
        displayMessage("Sync", "Error de sincronización", "error");
    }
    
    http.end();
    
    // Procesar cola offline
    processOfflineQueue();
    
    currentState = ONLINE_MODE;
    updateStatusDisplay();
}

void processSyncResponse(const String& response) {
    JsonDocument doc;
    deserializeJson(doc, response);
    
    if (doc["success"]) {
        JsonArray fingerprints = doc["fingerprints"];
        
        Serial.println("Sincronizando " + String(fingerprints.size()) + " huellas");
        
        for (JsonVariant fp : fingerprints) {
            int userId = fp["user_id"];
            String dni = fp["dni"];
            String nombre = fp["nombre"];
            String rol = fp["rol"];
            String template_data = fp["template"];
            int quality = fp["quality"];
            
            // Verificar si ya existe localmente
            UserFingerprint* existing = findFingerprintByUserId(userId);
            
            if (!existing) {
                // Nueva huella, agregar
                addFingerprintToDevice(userId, dni, nombre, rol, template_data, quality);
            } else {
                // Actualizar información si es necesario
                existing->dni = dni;
                existing->nombre = nombre;
                existing->rol = rol;
                existing->synced = true;
            }
        }
        
        saveFingerprintCache();
        displayMessage("Sync", "Sincronización completada", "success");
    }
}

void processOfflineQueue() {
    if (!isOnline || offlineEventQueue.empty()) return;
    
    Serial.println("Procesando " + String(offlineEventQueue.size()) + " eventos offline");
    
    auto it = offlineEventQueue.begin();
    while (it != offlineEventQueue.end()) {
        bool success = sendEventToBackend(*it);
        
        if (success) {
            Serial.println("Evento offline enviado: " + it->type);
            it = offlineEventQueue.erase(it);
        } else {
            it->attempts++;
            if (it->attempts >= 3) {
                Serial.println("Evento fallido permanentemente: " + it->type);
                it = offlineEventQueue.erase(it);
            } else {
                ++it;
            }
        }
    }
    
    saveOfflineQueue();
}

bool sendEventToBackend(const OfflineEvent& event) {
    http.begin(String(backend_url) + "/api/esp32/" + event.type);
    http.addHeader("Content-Type", "application/json");
    
    String payload;
    serializeJson(event.data, payload);
    
    int httpCode = http.POST(payload);
    http.end();
    
    return (httpCode >= 200 && httpCode < 300);
}

// --- Funciones de huellas ---
bool initFingerprint() {
    fingerSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX, FINGERPRINT_TX);
    delay(100);
    
    if (finger.verifyPassword()) {
        Serial.println("Sensor de huellas inicializado");
        finger.getParameters();
        finger.getTemplateCount();
        
        displayMessage("Sensor", "AS608 OK - " + String(finger.templateCount) + " huellas", "success");
        return true;
    } else {
        Serial.println("Error: Sensor de huellas no encontrado");
        displayMessage("Sensor", "Error: AS608 no detectado", "error");
        return false;
    }
}

int addFingerprintToDevice(int userId, const String& dni, const String& nombre, 
                          const String& rol, const String& templateData, int quality) {
    // Encontrar slot libre
    int freeSlot = -1;
    for (int i = 1; i <= 127; i++) {
        bool slotUsed = false;
        for (const auto& fp : localFingerprintCache) {
            if (fp.localSlot == i) {
                slotUsed = true;
                break;
            }
        }
        if (!slotUsed) {
            freeSlot = i;
            break;
        }
    }
    
    if (freeSlot == -1) {
        Serial.println("Error: No hay slots libres");
        return -1;
    }
    
    // TODO: Aquí iría la lógica para cargar el template al sensor
    // Por ahora solo agregamos al cache
    
    UserFingerprint newFp;
    newFp.userId = userId;
    newFp.dni = dni;
    newFp.nombre = nombre;
    newFp.rol = rol;
    newFp.localSlot = freeSlot;
    newFp.confidence = quality;
    newFp.lastUsed = 0;
    newFp.synced = true;
    
    localFingerprintCache.push_back(newFp);
    saveFingerprintCache();
    
    Serial.println("Huella agregada: " + nombre + " (Slot " + String(freeSlot) + ")");
    return freeSlot;
}

void checkForFingerprint() {
    uint8_t p = finger.getImage();
    if (p != FINGERPRINT_OK) return;
    
    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) return;
    
    p = finger.fingerFastSearch();
    if (p != FINGERPRINT_OK) return;
    
    // Huella detectada
    int slotId = finger.fingerID;
    int confidence = finger.confidence;
    
    UserFingerprint* user = findFingerprintBySlot(slotId);
    
    if (user) {
        user->lastUsed = millis();
        
        Serial.println("Huella reconocida: " + user->nombre + " (" + user->rol + ") - Confianza: " + String(confidence));
        displayMessage("Acceso", user->nombre + " - " + user->rol, "success");
        
        // Crear evento
        JsonDocument eventData;
        eventData["usuario_id"] = user->userId;
        eventData["dni"] = user->dni;
        eventData["nombre"] = user->nombre;
        eventData["rol"] = user->rol;
        eventData["confianza"] = confidence;
        eventData["dispositivo_id"] = DEVICE_ID;
        eventData["timestamp"] = millis();
        
        // Si es alumno, registrar asistencia
        if (user->rol == "alumno") {
            if (isOnline) {
                publishAttendance(user->userId, user->dni, confidence);
            } else {
                addOfflineEvent("attendance/biometric", eventData);
            }
        }
        
        // Registrar autenticación
        if (isOnline) {
            publishAuthentication(user->userId, user->dni, true, confidence);
        } else {
            addOfflineEvent("auth/biometric", eventData);
        }
        
        saveFingerprintCache(); // Actualizar lastUsed
        
    } else {
        Serial.println("Huella no reconocida - Slot: " + String(slotId));
        displayMessage("Acceso", "Huella no autorizada", "error");
    }
    
    delay(2000); // Evitar lecturas múltiples
}

// --- Funciones MQTT ---
void publishStatus(const String& status, const String& message = "") {
    if (!mqttConnected) return;
    
    JsonDocument doc;
    doc["dispositivo_id"] = DEVICE_ID;
    doc["estado"] = status;
    doc["mensaje"] = message;
    doc["ip"] = WiFi.localIP().toString();
    doc["timestamp"] = millis();
    doc["huellas_locales"] = localFingerprintCache.size();
    doc["eventos_pendientes"] = offlineEventQueue.size();
    
    char buffer[512];
    serializeJson(doc, buffer);
    client.publish(topic_status, buffer);
}

void publishAttendance(int userId, const String& dni, int confidence) {
    if (!mqttConnected) return;
    
    JsonDocument doc;
    doc["dispositivo_id"] = DEVICE_ID;
    doc["usuario_id"] = userId;
    doc["dni"] = dni;
    doc["confianza"] = confidence;
    doc["timestamp"] = millis();
    doc["tipo"] = "entrada";
    
    char buffer[512];
    serializeJson(doc, buffer);
    client.publish("escuela/biometrico/asistencia", buffer);
}

void publishAuthentication(int userId, const String& dni, bool success, int confidence) {
    if (!mqttConnected) return;
    
    JsonDocument doc;
    doc["dispositivo_id"] = DEVICE_ID;
    doc["usuario_id"] = userId;
    doc["dni"] = dni;
    doc["autenticado"] = success;
    doc["confianza"] = confidence;
    doc["timestamp"] = millis();
    
    char buffer[512];
    serializeJson(doc, buffer);
    client.publish("escuela/biometrico/autenticacion", buffer);
}

void handleMqttCommand(char* topic, byte* payload, unsigned int length) {
    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';
    
    JsonDocument doc;
    deserializeJson(doc, message);
    
    // Verificar si es para este dispositivo
    const char* targetDevice = doc["dispositivo_id"];
    if (targetDevice && strcmp(targetDevice, DEVICE_ID.c_str()) != 0) {
        return;
    }
    
    const char* action = doc["accion"];
    
    if (strcmp(action, "sync") == 0) {
        requestFullSync();
    } else if (strcmp(action, "registrar") == 0) {
        handleEnrollCommand(doc);
    } else if (strcmp(action, "borrar") == 0) {
        handleDeleteCommand(doc);
    }
}

void handleEnrollCommand(const JsonDocument& cmd) {
    enrollingUserId = cmd["usuario_id"];
    enrollingUserInfo = cmd["nombre"].as<String>() + " (" + cmd["dni"].as<String>() + ")";
    
    currentState = ENROLLING_STEP1;
    displayMessage("Registro", "Coloque el dedo: " + enrollingUserInfo, "info");
    Serial.println("Iniciando registro para: " + enrollingUserInfo);
}

void handleDeleteCommand(const JsonDocument& cmd) {
    int userId = cmd["usuario_id"];
    UserFingerprint* user = findFingerprintByUserId(userId);
    
    if (user) {
        // Eliminar del sensor
        finger.deleteModel(user->localSlot);
        
        // Eliminar del cache
        auto it = std::find_if(localFingerprintCache.begin(), localFingerprintCache.end(),
                              [userId](const UserFingerprint& fp) { return fp.userId == userId; });
        
        if (it != localFingerprintCache.end()) {
            localFingerprintCache.erase(it);
            saveFingerprintCache();
        }
        
        displayMessage("Eliminado", user->nombre, "success");
        Serial.println("Huella eliminada: " + user->nombre);
    }
}

// --- Setup y Loop principales ---
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n=== Sistema Biométrico Distribuido v2.0 ===");
    Serial.println("Dispositivo: " + DEVICE_ID);
    Serial.println("Ubicación: " + DEVICE_LOCATION);
    
    // Configurar pines
    pinMode(LED_OK, OUTPUT);
    pinMode(LED_ERROR, OUTPUT);
    pinMode(LED_BUSY, OUTPUT);
    pinMode(LED_OFFLINE, OUTPUT);
    
    // Test de LEDs
    clearAllLEDs();
    for (int i = 0; i < 4; i++) {
        setLED(LED_OK + i, true);
        delay(200);
        setLED(LED_OK + i, false);
    }
    
    // Inicializar pantalla si está disponible
    #ifdef USE_TOUCHSCREEN
        tft.init();
        tft.setRotation(1);
        tft.fillScreen(TFT_BLACK);
        tft.setTextColor(TFT_WHITE);
        tft.drawString("Sistema Biometrico v2.0", 10, 10);
        tft.drawString("Inicializando...", 10, 30);
    #endif
    
    // Inicializar SPIFFS
    if (!SPIFFS.begin(true)) {
        Serial.println("Error inicializando SPIFFS");
        displayMessage("Error", "Sistema de archivos falló", "error");
    }
    
    // Cargar configuración
    preferences.begin("device_config", true);
    String lastKnownIP = preferences.getString("last_ip", "");
    preferences.end();
    
    // Cargar cache de huellas
    loadFingerprintCache();
    loadOfflineQueue();
    
    // Inicializar sensor
    if (!initFingerprint()) {
        currentState = ERROR_STATE;
        updateStatusDisplay();
        return;
    }
    
    // Configurar MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(handleMqttCommand);
    client.setBufferSize(1024);
    
    // Intentar conectar
    if (connectWiFi()) {
        connectMQTT();
    } else {
        currentState = OFFLINE_MODE;
    }
    
    updateStatusDisplay();
    
    Serial.println("=== Sistema iniciado ===");
    Serial.println("Huellas en cache: " + String(localFingerprintCache.size()));
    Serial.println("Eventos pendientes: " + String(offlineEventQueue.size()));
    
    displayMessage("Iniciado", "Dispositivo listo", "success");
}

void loop() {
    unsigned long now = millis();
    
    // Verificar conectividad periódicamente
    if (now - lastConnectionAttempt > WIFI_RETRY_INTERVAL) {
        lastConnectionAttempt = now;
        checkConnectivity();
    }
    
    // Mantener conexión MQTT
    if (mqttConnected) {
        client.loop();
        
        // Heartbeat
        if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
            lastHeartbeat = now;
            publishStatus("online", "Heartbeat");
        }
        
        // Sincronización periódica
        if (now - lastSyncAttempt > SYNC_INTERVAL) {
            lastSyncAttempt = now;
            processOfflineQueue(); // Solo procesar cola, no sync completo
        }
    }
    
    // Máquina de estados principal
    switch (currentState) {
        case OFFLINE_MODE:
        case ONLINE_MODE:
            // Verificar huellas continuamente
            checkForFingerprint();
            break;
            
        case ENROLLING_STEP1:
            // TODO: Implementar proceso de registro
            // Por ahora volver a modo normal
            currentState = isOnline ? ONLINE_MODE : OFFLINE_MODE;
            break;
            
        case SYNCING:
            // La sincronización se maneja en requestFullSync()
            break;
            
        case ERROR_STATE:
            // Reintentar inicialización cada 30 segundos
            static unsigned long lastRetry = 0;
            if (now - lastRetry > 30000) {
                lastRetry = now;
                if (initFingerprint()) {
                    currentState = isOnline ? ONLINE_MODE : OFFLINE_MODE;
                    updateStatusDisplay();
                }
            }
            break;
    }
    
    delay(50); // Pequeña pausa
}