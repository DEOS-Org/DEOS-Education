#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println();
  Serial.println("=== INFORMACION DEL ESP32 ===");
  Serial.println();
  
  // Obtener MAC Address
  String macAddress = WiFi.macAddress();
  Serial.print("MAC Address: ");
  Serial.println(macAddress);
  Serial.println();
  
  // También mostrar en formato con dos puntos
  Serial.print("MAC con formato: ");
  Serial.println(WiFi.macAddress());
  Serial.println();
  
  // Mostrar Chip ID
  Serial.print("Chip ID: ");
  Serial.println(ESP.getChipId());
  Serial.println();
  
  Serial.println("=== COPIA LA MAC DE ARRIBA ===");
  Serial.println("Agrega esta MAC al router WiFi");
  Serial.println("===============================");
}

void loop() {
  delay(5000);
  Serial.println("MAC Address: " + WiFi.macAddress());
}