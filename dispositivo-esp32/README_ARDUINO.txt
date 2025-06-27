SETUP PARA ARDUINO IDE
=====================

ARCHIVO PRINCIPAL: esp32_simple.ino

LIBRERÍAS NECESARIAS (instalar desde Library Manager):
- Adafruit Fingerprint Sensor Library
- PubSubClient 
- ArduinoJson

CONFIGURACIÓN YA HECHA:
- WiFi: "Notebooks ETEC" / "cianocril@To"
- MAC ya registrada: 08:40:60:41:FC:3F
- IP del servidor: 10.54.8.81

CONEXIONES HARDWARE:
AS608 -> ESP32
- VCC  -> 3.3V
- GND  -> GND
- TX   -> Pin 16 (RX)
- RX   -> Pin 17 (TX)

LEDs (opcional):
- Pin 25 -> LED Verde (OK)
- Pin 26 -> LED Rojo (Error)
- Pin 27 -> LED Amarillo (Busy)

COMO SUBIR:
1. Abrir esp32_simple.ino en Arduino IDE
2. Seleccionar placa: ESP32 Dev Module
3. Seleccionar puerto USB
4. Compilar y subir

El código funciona sin errores de compilación.