/*
 * PRUEBA DE SENSOR AS608 CON ARDUINO UNO
 * =====================================
 * 
 * Este código es SOLO para probar si el sensor AS608 funciona
 * Usar con Arduino UNO para descartar problemas del ESP32
 * 
 * CONEXIONES:
 * AS608    Arduino UNO
 * -----    -----------
 * VCC  →   5V
 * GND  →   GND
 * TX   →   Pin 2 (SoftwareSerial RX)
 * RX   →   Pin 3 (SoftwareSerial TX)
 * 
 * LIBRERÍAS NECESARIAS:
 * - Adafruit Fingerprint Sensor Library
 * 
 */

#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// Crear SoftwareSerial para el sensor
SoftwareSerial mySerial(2, 3);  // RX=Pin2, TX=Pin3
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(9600);
  delay(1000);
  
  Serial.println("=== PRUEBA SENSOR AS608 CON ARDUINO ===");
  Serial.println("Verificando conexiones...");
  Serial.println();
  
  // Inicializar comunicación con sensor
  mySerial.begin(57600);
  finger.begin(57600);
  
  // Probar comunicación
  Serial.println("Buscando sensor AS608...");
  
  if (finger.verifyPassword()) {
    Serial.println("✅ SENSOR AS608 ENCONTRADO!");
    Serial.println();
    
    // Obtener información del sensor
    finger.getParameters();
    Serial.print("Estado: OK");
    Serial.print(" | Capacidad: ");
    Serial.print(finger.capacity);
    Serial.print(" | Seguridad: ");
    Serial.print(finger.security_level);
    Serial.print(" | Tamaño paquete: ");
    Serial.println(finger.packetLen);
    
    // Contar huellas almacenadas
    finger.getTemplateCount();
    Serial.print("Huellas almacenadas: ");
    Serial.print(finger.templateCount);
    Serial.println(" / 127");
    
    Serial.println();
    Serial.println("=== SENSOR FUNCIONANDO CORRECTAMENTE ===");
    Serial.println("Pon tu dedo en el sensor para probar...");
    Serial.println();
    
  } else {
    Serial.println("❌ SENSOR AS608 NO ENCONTRADO");
    Serial.println();
    Serial.println("REVISAR:");
    Serial.println("1. Conexiones:");
    Serial.println("   VCC → 5V");
    Serial.println("   GND → GND");
    Serial.println("   TX  → Pin 2");
    Serial.println("   RX  → Pin 3");
    Serial.println();
    Serial.println("2. Alimentación: ¿LED del sensor encendido?");
    Serial.println("3. Cables: ¿bien conectados?");
    Serial.println("4. Sensor: ¿no está dañado?");
    Serial.println();
    Serial.println("Si no funciona aquí, el sensor puede estar roto.");
    
    while(1) {
      delay(1000);
      Serial.println("Sensor no detectado - revisar conexiones");
    }
  }
}

void loop() {
  // Buscar huella continuamente
  uint8_t p = finger.getImage();
  
  if (p == FINGERPRINT_OK) {
    Serial.println("👆 Huella detectada - procesando...");
    
    // Convertir imagen a template
    p = finger.image2Tz();
    if (p == FINGERPRINT_OK) {
      Serial.println("   ✅ Imagen procesada");
      
      // Buscar coincidencia
      p = finger.fingerFastSearch();
      if (p == FINGERPRINT_OK) {
        Serial.println("   🎯 HUELLA RECONOCIDA!");
        Serial.print("   ID: ");
        Serial.print(finger.fingerID);
        Serial.print(" | Confianza: ");
        Serial.println(finger.confidence);
      } else {
        Serial.println("   ❓ Huella NO reconocida");
        Serial.println("   (normal si no hay huellas registradas)");
      }
    } else {
      Serial.println("   ❌ Error procesando imagen");
    }
    
    Serial.println();
    delay(2000);  // Esperar antes de la próxima lectura
    
  } else if (p == FINGERPRINT_NOFINGER) {
    // Sin dedo - no hacer nada
  } else {
    // Error en lectura
    Serial.print("Error en sensor: ");
    Serial.println(p);
    delay(1000);
  }
}