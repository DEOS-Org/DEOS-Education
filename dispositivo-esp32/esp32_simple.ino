#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Fingerprint.h>

// ========== CONFIGURACION ==========
String wifi_ssid = "Notebooks ETEC";
String wifi_password = "cianocril@To";
const char* mqtt_server = "10.54.8.81";
const int mqtt_port = 1883;

// === ID del dispositivo ===
String DEVICE_ID = "ESP32_Huella_01";
String DEVICE_NAME = "Sensor Principal";

// === Objetos ===
WiFiClient espClient;
PubSubClient client(espClient);
HardwareSerial fingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

// === Configuración pines sensor ===
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17

// === LEDs (opcional) ===
#define LED_OK 25      // Verde
#define LED_ERROR 26   // Rojo  
#define LED_BUSY 27    // Amarillo

// === Tópicos MQTT ===
const char* topic_status = "escuela/biometrico/estado";
const char* topic_event = "escuela/biometrico/eventos";
const char* topic_cmd = "escuela/biometrico/comandos";

// === Variables ===
unsigned long lastHeartbeat = 0;
bool sensorConnected = false;

void setup() {
    Serial.begin(115200);
    delay(2000);
    
    Serial.println("=== Sistema Biométrico ESP32 v1.0 ===");
    Serial.println("Dispositivo: " + DEVICE_ID);
    
    // Preguntar si quiere configurar WiFi
    Serial.println("\n¿Quieres configurar WiFi? (y/n)");
    Serial.println("Tienes 10 segundos para responder...");
    
    unsigned long startTime = millis();
    bool configWifi = false;
    
    while (millis() - startTime < 10000) {
        if (Serial.available()) {
            String response = Serial.readStringUntil('\n');
            response.trim();
            response.toLowerCase();
            if (response == "y" || response == "yes" || response == "si") {
                configWifi = true;
                break;
            }
            if (response == "n" || response == "no") {
                break;
            }
        }
        delay(100);
    }
    
    if (configWifi) {
        wifiConfigMenu();
    }
    
    // Configurar LEDs
    pinMode(LED_OK, OUTPUT);
    pinMode(LED_ERROR, OUTPUT);
    pinMode(LED_BUSY, OUTPUT);
    
    // LED inicial
    digitalWrite(LED_BUSY, HIGH);
    
    // Conectar WiFi
    setupWiFi();
    
    // Configurar MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(onMqttMessage);
    
    // Inicializar sensor
    initializeSensor();
    
    Serial.println("=== Sistema iniciado ===");
    digitalWrite(LED_BUSY, LOW);
    digitalWrite(LED_OK, HIGH);
    delay(1000);
    digitalWrite(LED_OK, LOW);
}

void loop() {
    // Mantener conexión MQTT
    if (!client.connected()) {
        reconnectMQTT();
    }
    client.loop();
    
    // Enviar heartbeat cada 30 segundos
    if (millis() - lastHeartbeat > 30000) {
        sendHeartbeat();
        lastHeartbeat = millis();
    }
    
    // Verificar huellas
    if (sensorConnected) {
        checkForFingerprint();
    }
    
    delay(100);
}

void wifiConfigMenu() {
    Serial.println("\n=== CONFIGURADOR WIFI ===");
    Serial.println("Escaneando redes disponibles...");
    
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);
    
    int n = WiFi.scanNetworks();
    
    if (n == 0) {
        Serial.println("No se encontraron redes WiFi");
        return;
    }
    
    Serial.println("\nRedes WiFi disponibles:");
    for (int i = 0; i < n; i++) {
        Serial.print(i + 1);
        Serial.print(": ");
        Serial.print(WiFi.SSID(i));
        Serial.print(" (Señal: ");
        Serial.print(WiFi.RSSI(i));
        Serial.println(" dBm)");
    }
    
    Serial.println("\nSelecciona una red:");
    Serial.println("- Escribe el NUMERO de la red (1-" + String(n) + ")");
    Serial.println("- O escribe 'manual' para ingresar manualmente");
    Serial.println("- O escribe 'skip' para usar configuracion actual");
    
    while (!Serial.available()) {
        delay(100);
    }
    
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input == "skip") {
        Serial.println("Usando configuracion actual");
        return;
    }
    
    if (input == "manual") {
        Serial.println("\nIngresa el nombre de la red WiFi:");
        while (!Serial.available()) delay(100);
        wifi_ssid = Serial.readStringUntil('\n');
        wifi_ssid.trim();
    } else {
        int selection = input.toInt();
        if (selection >= 1 && selection <= n) {
            wifi_ssid = WiFi.SSID(selection - 1);
            Serial.println("Red seleccionada: " + wifi_ssid);
        } else {
            Serial.println("Seleccion invalida, usando configuracion actual");
            return;
        }
    }
    
    Serial.println("\nIngresa la contraseña para '" + wifi_ssid + "':");
    Serial.println("(deja vacio para redes abiertas)");
    while (!Serial.available()) delay(100);
    wifi_password = Serial.readStringUntil('\n');
    wifi_password.trim();
    
    Serial.println("\n=== NUEVA CONFIGURACION ===");
    Serial.println("SSID: " + wifi_ssid);
    Serial.print("Password: ");
    Serial.println(wifi_password.length() > 0 ? "***" : "(sin password)");
    Serial.println("===========================");
}

void setupWiFi() {
    Serial.println("=== CONFIGURACION WIFI ===");
    Serial.print("SSID: ");
    Serial.println(wifi_ssid);
    Serial.print("Password: ");
    Serial.println(wifi_password.length() > 0 ? "***" : "(sin password)");
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());
    Serial.println("==========================");
    
    // Inicializar y configurar WiFi
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);
    
    Serial.print("Conectando a WiFi: ");
    Serial.println(wifi_ssid);
    WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(1000);
        Serial.print(".");
        attempts++;
        
        // Mostrar estado cada 5 intentos
        if (attempts % 5 == 0) {
            Serial.println();
            Serial.print("Estado WiFi: ");
            Serial.println(WiFi.status());
        }
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("WiFi conectado!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("MAC: ");
        Serial.println(WiFi.macAddress());
    } else {
        Serial.println();
        Serial.println("ERROR: No se pudo conectar a WiFi");
        while(true) {
            digitalWrite(LED_ERROR, HIGH);
            delay(500);
            digitalWrite(LED_ERROR, LOW);
            delay(500);
        }
    }
}

void reconnectMQTT() {
    while (!client.connected()) {
        Serial.print("Conectando a MQTT...");
        
        String clientId = "ESP32Client-" + DEVICE_ID;
        
        if (client.connect(clientId.c_str())) {
            Serial.println(" conectado!");
            
            // Suscribirse a comandos
            client.subscribe(topic_cmd);
            
            // Enviar estado inicial
            sendDeviceStatus("online");
            
        } else {
            Serial.print(" falló, rc=");
            Serial.print(client.state());
            Serial.println(" reintentando en 5 segundos");
            delay(5000);
        }
    }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    Serial.print("Mensaje recibido [");
    Serial.print(topic);
    Serial.print("]: ");
    
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.println(message);
    
    // Procesar comandos
    if (strcmp(topic, topic_cmd) == 0) {
        processCommand(message);
    }
}

void processCommand(String command) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, command);
    
    String action = doc["accion"];
    
    if (action == "ping") {
        sendDeviceStatus("pong");
    }
    else if (action == "test_sensor") {
        testSensor();
    }
    else if (action == "registrar") {
        // TODO: Implementar registro
        Serial.println("Comando registrar recibido");
    }
}

void tryAlternatePins() {
    Serial.println("\n=== PROBANDO PINES ALTERNATIVOS ===");
    
    // Lista de combinaciones de pines comunes para ESP32
    int pinCombos[][2] = {
        {4, 2},   // RX=4, TX=2
        {18, 19}, // RX=18, TX=19  
        {25, 26}, // RX=25, TX=26
        {32, 33}, // RX=32, TX=33
        {14, 12}  // RX=14, TX=12
    };
    
    int numCombos = sizeof(pinCombos) / sizeof(pinCombos[0]);
    
    for (int i = 0; i < numCombos; i++) {
        int rxPin = pinCombos[i][0];
        int txPin = pinCombos[i][1];
        
        Serial.print("Probando RX=");
        Serial.print(rxPin);
        Serial.print(", TX=");
        Serial.print(txPin);
        Serial.print(": ");
        
        // Reinicializar con nuevos pines
        fingerSerial.end();
        delay(100);
        fingerSerial.begin(57600, SERIAL_8N1, rxPin, txPin);
        delay(200);
        
        if (finger.verifyPassword()) {
            Serial.println("✅ FUNCIONA!");
            Serial.println("*** CAMBIA LAS CONEXIONES A ESTOS PINES ***");
            Serial.print("AS608 TX -> ESP32 Pin ");
            Serial.println(rxPin);
            Serial.print("AS608 RX -> ESP32 Pin ");
            Serial.println(txPin);
            sensorConnected = true;
            
            finger.getTemplateCount();
            Serial.print("Huellas almacenadas: ");
            Serial.println(finger.templateCount);
            return;
        } else {
            Serial.println("❌");
        }
        delay(500);
    }
    
    Serial.println("Ninguna combinacion funciono");
    Serial.println("POSIBLES PROBLEMAS:");
    Serial.println("1. Alimentacion insuficiente (probar 5V en lugar de 3.3V)");
    Serial.println("2. Sensor defectuoso");
    Serial.println("3. Cables sueltos o dañados");
    sensorConnected = false;
}

void initializeSensor() {
    Serial.println("Inicializando sensor AS608...");
    
    // SOLUCION 1: Agregar delay y reinicializar
    delay(500);
    fingerSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX, FINGERPRINT_TX);
    delay(100);
    
    finger.begin(57600);
    delay(100);
    
    Serial.println("Probando conexion con sensor...");
    
    // SOLUCION 2: Intentar varias veces
    bool found = false;
    for (int attempt = 1; attempt <= 5; attempt++) {
        Serial.print("Intento ");
        Serial.print(attempt);
        Serial.print("/5: ");
        
        if (finger.verifyPassword()) {
            Serial.println("✅ SENSOR ENCONTRADO!");
            found = true;
            break;
        } else {
            Serial.println("❌ No detectado");
            delay(1000);
        }
    }
    
    if (found) {
        sensorConnected = true;
        
        // Obtener info del sensor
        finger.getParameters();
        Serial.print("Capacidad: ");
        Serial.println(finger.capacity);
        
        finger.getTemplateCount();
        Serial.print("Huellas almacenadas: ");
        Serial.println(finger.templateCount);
        
        Serial.println("=== SENSOR AS608 LISTO ===");
    } else {
        Serial.println("ERROR: Sensor AS608 no encontrado");
        Serial.println("VERIFICAR:");
        Serial.println("- Conexiones: VCC, GND, TX->Pin16, RX->Pin17");
        Serial.println("- Alimentacion: ¿3.3V o 5V?");
        Serial.println("- Cables: ¿estan bien conectados?");
        Serial.println("");
        Serial.println("¿Probar otros pines? (y/n)");
        
        unsigned long startTime = millis();
        while (millis() - startTime < 10000) {
            if (Serial.available()) {
                String response = Serial.readStringUntil('\n');
                response.trim();
                response.toLowerCase();
                if (response == "y" || response == "yes" || response == "si") {
                    tryAlternatePins();
                    return;
                }
                if (response == "n" || response == "no") {
                    break;
                }
            }
            delay(100);
        }
        
        sensorConnected = false;
    }
}

void testSensor() {
    Serial.println("Probando sensor...");
    digitalWrite(LED_BUSY, HIGH);
    
    if (sensorConnected) {
        finger.getTemplateCount();
        Serial.print("Sensor OK - Huellas: ");
        Serial.println(finger.templateCount);
        
        StaticJsonDocument<200> doc;
        doc["dispositivo_id"] = DEVICE_ID;
        doc["sensor_ok"] = true;
        doc["huellas_count"] = finger.templateCount;
        
        String response;
        serializeJson(doc, response);
        client.publish(topic_event, response.c_str());
        
        // LED success
        digitalWrite(LED_BUSY, LOW);
        digitalWrite(LED_OK, HIGH);
        delay(1000);
        digitalWrite(LED_OK, LOW);
    } else {
        Serial.println("Sensor no conectado");
        digitalWrite(LED_BUSY, LOW);
        digitalWrite(LED_ERROR, HIGH);
        delay(1000);
        digitalWrite(LED_ERROR, LOW);
    }
}

void checkForFingerprint() {
    uint8_t p = finger.getImage();
    
    if (p == FINGERPRINT_OK) {
        Serial.println("Huella detectada!");
        digitalWrite(LED_BUSY, HIGH);
        
        p = finger.image2Tz();
        if (p == FINGERPRINT_OK) {
            p = finger.fingerFastSearch();
            
            if (p == FINGERPRINT_OK) {
                // Huella encontrada
                Serial.print("Huella ID: ");
                Serial.println(finger.fingerID);
                Serial.print("Confianza: ");
                Serial.println(finger.confidence);
                
                // Enviar evento de detección
                sendFingerprintDetected(finger.fingerID, finger.confidence);
                
                // LED success
                digitalWrite(LED_BUSY, LOW);
                digitalWrite(LED_OK, HIGH);
                delay(1000);
                digitalWrite(LED_OK, LOW);
                
            } else {
                // Huella no encontrada
                Serial.println("Huella no reconocida");
                
                // LED error
                digitalWrite(LED_BUSY, LOW);
                digitalWrite(LED_ERROR, HIGH);
                delay(500);
                digitalWrite(LED_ERROR, LOW);
            }
        }
    }
}

void sendFingerprintDetected(int fingerId, int confidence) {
    StaticJsonDocument<300> doc;
    doc["dispositivo_id"] = DEVICE_ID;
    doc["tipo"] = "deteccion";
    doc["finger_id"] = fingerId;
    doc["confianza"] = confidence;
    doc["timestamp"] = millis();
    
    String message;
    serializeJson(doc, message);
    
    client.publish(topic_event, message.c_str());
    
    Serial.println("Evento enviado: " + message);
}

void sendHeartbeat() {
    StaticJsonDocument<200> doc;
    doc["dispositivo_id"] = DEVICE_ID;
    doc["estado"] = "online";
    doc["ip"] = WiFi.localIP().toString();
    doc["uptime"] = millis();
    doc["free_heap"] = ESP.getFreeHeap();
    
    String message;
    serializeJson(doc, message);
    
    client.publish(topic_status, message.c_str());
    
    Serial.println("Heartbeat enviado");
}

void sendDeviceStatus(String status) {
    StaticJsonDocument<200> doc;
    doc["dispositivo_id"] = DEVICE_ID;
    doc["estado"] = status;
    doc["ip"] = WiFi.localIP().toString();
    
    String message;
    serializeJson(doc, message);
    
    client.publish(topic_status, message.c_str());
}