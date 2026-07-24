#include <BLE2902.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <Wire.h>

/*
 * ======================================================================================
 * CONFIGURACIÓN DE PINES Y SENSORES
 * ======================================================================================
 * Aquí se deben incluir las librerías específicas de los sensores (BME280,
 * SPS30, etc.)
 */
// #include <Adafruit_BME280.h>
// #include <sps30.h>

/*
 * ======================================================================================
 * UUIDs DE BLUETOOTH
 * ======================================================================================
 * Estos identificadores DEBEN coincidir con los definidos en la App móvil
 * (useBLE.js).
 * - SERVICE_UUID: Identificador del servicio principal "AirQ-Sensor".
 * - SENSOR_DATA_UUID: Canal para ENVIAR datos a la App (Notificaciones).
 * - SETTINGS_UUID: Canal para RECIBIR configuración desde la App (Escritura).
 */
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SENSOR_DATA_UUID "beefcafe-36e1-4688-b7f5-00000000000b"
#define SETTINGS_UUID "beefcafe-36e1-4688-b7f5-00000000000c"

// Punteros a las características BLE para interactuar con ellas
BLECharacteristic *pSensorDataCharacteristic;
BLECharacteristic *pSettingsCharacteristic;
bool deviceConnected = false;

// Variables simuladas (reemplazar por lecturas reales de sensores)
float temperature = 25.0;
float humidity = 60.0;
float pm25 = 12.0;     // ug/m3
float pm10 = 20.0;     // ug/m3
int batteryLevel = 85; // %

// Variables de configuración recibidas desde la App
int measureInterval = 30;    // Intervalo de envío en segundos (Default: 30s)
String gpsMode = "interval"; // Modo GPS: "continuous", "interval", "off"

/*
 * ======================================================================================
 * CALLBACKS DEL SERVIDOR BLE
 * ======================================================================================
 * Manejan los eventos de conexión y desconexión de dispositivos móviles.
 */
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    Serial.println("Cliente conectado");
  };

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    Serial.println("Cliente desconectado");
    // Importante: Reiniciar publicidad para que otros (o el mismo) se puedan
    // reconectar
    BLEDevice::startAdvertising();
  }
};

/*
 * ======================================================================================
 * CALLBACKS DE CARACTERÍSTICAS
 * ======================================================================================
 * Manejan la escritura de datos desde la App hacia el ESP32.
 *
 * NOTA IMPORTANTE:
 * La recepción de datos NO ocurre dentro del void loop(). Funciona por
 * INTERRUPCIONES. Cuando la App envía algo, el código principal se pausa y se
 * ejecuta automáticamente esta función onWrite(). Aquí actualizamos las
 * variables globales (como measureInterval) y el loop() usará los nuevos
 * valores automáticamente en su siguiente ciclo.
 */
class SettingsCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0) {
      Serial.print("Configuración recibida: ");
      // Imprimir valor recibido (el JSON crudo)
      for (int i = 0; i < value.length(); i++)
        Serial.print(value[i]);
      Serial.println();

      // TODO: Implementar parser JSON (ej: ArduinoJson)
      // Lógica recomendada:
      // 1. Convertir std::string a String o char*
      // 2. Parsear objeto JSON {"measureInterval": 10} o {"gpsMode":
      // "continuous"}
      // 3. Actualizar variables globales `measureInterval` o `gpsMode`
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Iniciando...");

  // Inicializar BLE con nombre del dispositivo
  BLEDevice::init("AirQ-Sensor");

  // Crear servidor BLE
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Crear servicio principal
  BLEService *pService = pServer->createService(SERVICE_UUID);

  /*
   * Configuración de Característica de DATOS (Salida)
   * - READ: La app puede leer el valor actual puntualmente.
   * - NOTIFY: El ESP32 avisa a la app proactivamente cada vez que hay datos
   * nuevos.
   * - BLE2902: Descriptor necesario para activar notificaciones.
   */
  pSensorDataCharacteristic = pService->createCharacteristic(
      SENSOR_DATA_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pSensorDataCharacteristic->addDescriptor(new BLE2902());

  /*
   * Configuración de Característica de AJUSTES (Entrada)
   * - WRITE: La app puede escribir datos aquí (con respuesta implicita).
   */
  pSettingsCharacteristic = pService->createCharacteristic(
      SETTINGS_UUID, BLECharacteristic::PROPERTY_WRITE);
  pSettingsCharacteristic->setCallbacks(new SettingsCallbacks());

  // Iniciar el servicio
  pService->start();

  // Configurar Publicidad (Advertising) para ser visible
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(
      0x06); // Ayuda con problemas de conexión en iPhone
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE Listo. Esperando conexiones...");
}

void loop() {
  if (deviceConnected) {
    /*
     * 1. LECTURA DE SENSORES
     * Aquí se deben llamar a las funciones reales de lectura.
     */
    // temperature = bme.readTemperature();
    // humidity = bme.readHumidity();

    // Simulación simple para pruebas:
    temperature += 0.1;
    if (temperature > 35)
      temperature = 20;

    /*
     * 2. FORMATEO DE DATOS
     * Construimos un JSON simple manualmente.
     * Estructura: {"temp":25.1, "hum":60.0, "pm25":12.0, "pm10":20.0, "bat":85}
     */
    String jsonPayload = "{";
    jsonPayload += "\"temp\":" + String(temperature, 1) + ",";
    jsonPayload += "\"hum\":" + String(humidity, 1) + ",";
    jsonPayload += "\"pm25\":" + String(pm25, 1) + ",";
    jsonPayload += "\"pm10\":" + String(pm10, 1) + ",";
    jsonPayload += "\"bat\":" + String(batteryLevel);
    jsonPayload += "}";

    /*
     * 3. ENVÍO (NOTIFICACIÓN)
     * Enviamos la cadena JSON a la app conectada.
     */
    pSensorDataCharacteristic->setValue(jsonPayload.c_str());
    pSensorDataCharacteristic->notify();
    Serial.println("Enviado: " + jsonPayload);

    // Esperar según el intervalo configurado
    delay(measureInterval * 1000);
  } else {
    // Si no hay nadie conectado, esperar poco tiempo antes de volver a
    // comprobar
    delay(1000);
  }
}
