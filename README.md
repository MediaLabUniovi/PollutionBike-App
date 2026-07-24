# Aplicación Móvil - Ciclismo y Calidad del Aire MdN

Esta aplicación desarrollada en React Native (Expo) permite interactuar por Bluetooth Low Energy (BLE) con el sensor de contaminación móvil del reto TICLab 2025. 

## Funcionamiento General

La aplicación está diseñada para monitorizar y descargar los datos recolectados por el sensor embebido. El sistema consta de varias pantallas:
1. **Bluetooth**: Permite buscar y emparejarse con dispositivos cercanos (filtrando por nombre de dispositivo "AirQ" o el configurado).
2. **Dashboard**: Presenta los datos obtenidos en tiempo real durante la ruta (Temperatura, Humedad, PM2.5, PM10, Batería y estado del GPS).
3. **Ajustes y Transferencias**: Permite modificar configuraciones del dispositivo y descargar los archivos generados en rutas anteriores para enviarlos a la base de datos central en la nube.

### Instrucciones de Uso durante la Recolección (Modo Bluetooth)

Para visualizar datos en tiempo real en la aplicación, debes operar el dispositivo físico de la siguiente manera:

1. **Encendido y Selección de Modo**: Enciende el sensor de contaminación. Estando en estado de reposo (IDLE), realiza **un click corto** en el botón físico hasta que el **LED 0 se ponga en color Azul**. Esto indica que el dispositivo trabajará en **Modo Bluetooth**.
2. **Conexión en la App**: Abre la aplicación, ve a la pestaña Bluetooth y conéctate al dispositivo.
3. **Inicio de Ruta**: Mantén pulsado el botón del sensor durante **2 segundos**. El dispositivo comenzará a leer el GPS y los sensores, enviando paquetes JSON continuos por Bluetooth que el *"Dashboard"* de la aplicación interpretará y mostrará al momento (niveles de polución, batería, cordenadas GPS, etc).
4. **Fin de Ruta**: Para finalizar la recolección, vuelve a mantener pulsado el botón del sensor por **2 segundos**. El sensor dejará de medir pero mantendrá el Bluetooth encendido.

### Ajustes de Dispositivo

Desde la pantalla de Configuración (Settings) en la app puedes ajustar parámetros internos del sensor por Bluetooth:
- **Intervalo:** Frecuencia de toma de datos (5s - 10min).
- **Modo GPS:** Continuo (siempre encendido leyendo el satélite) o por Intervalo (ahorra batería apagándose entre lecturas).

### Descarga y Subida de Archivos

Al finalizar una ruta, los ficheros con los datos recogidos habrán sido guardados en la SD del dispositivo. Existen dos métodos para subirlos a la nube:

1. **Vía WiFi (Sensor):** El propio sensor, tras la ruta (si terminaste en *Modo Normal*), se conectará automáticamente a un punto de acceso WiFi y enviará el último archivo generado de forma autónoma.
2. **Vía App (Bluetooth):** Desde la pantalla de ajustes de la aplicación, puedes solicitar al sensor el envío de los archivos generados guardados. La App descargará cada archivo por trozos, lo reconstruirá localmente y **lo enviará automáticamente mediante una petición HTTP POST** al servidor de Medialab (`https://medialab-uniovi.es/bike_pollution/upload.php`).

---

## Índice de Calidad del Aire (AQI)

El Dashboard de la aplicación traduce la lectura en crudo de miligramos de partículas por metro cúbico a un Índice de Calidad del Aire basado en el estándar de la **EPA (Agencia de Protección Ambiental de EE. UU.)**.
El valor del AQI no es igual a la concentración en µg/m³. Es un índice no lineal diseñado para reflejar el impacto en la salud. 

Los colores representados funcionan bajo esta escala:
- 🟢 **Buena**: 0-12 µg/m³ PM2.5 (El aire es aceptable)
- 🟡 **Moderada**: 13-35 µg/m³ PM2.5
- 🟠 **Dañina para grupos sensibles**: 36-55 µg/m³ PM2.5 
- 🔴 **Mala**: >55 µg/m³ PM2.5 (Condición de emergencia)

### Sobre las mediciones de partículas (PM)
Es importante tener en cuenta la relación física entre las métricas de partículas medidas por el sensor:
- **PM10** se refiere a las partículas en suspensión con un diámetro de menos de 10 micrómetros.
- **PM2.5** se refiere a las partículas con un diámetro de menos de 2.5 micrómetros.

Por definición, **las mediciones de PM10 incluyen siempre a las partículas PM2.5**. Es decir, todas las partículas que son PM2.5 también son consideradas PM10, pero no a la inversa.

---

## Desarrollo Local / Instalación

### Requisitos Previos

Si deseas modificar esta aplicación localmente, primero crea un fork del repositorio base (si aplica) y configura el entorno:

Instala Java versión 11:
```bash
curl -s "https://get.sdkman.io" | bash
sdk install java 11.0.12-zulu
```

Instala watchman (en macOS):
```bash
brew install watchman
```

### Configuración del Proyecto

Clona tu rama local y entra al directorio:
```bash
cd PollutionBikeApp
```

Borra las dependencias anteriores (si existieran) y vuele a instalar:
```bash
rm -rf android node_modules
npm install
npx expo install expo-dev-client
npx expo install --fix
npx expo-doctor@latest
```

Pre-complicación y generación de entorno Android:
```bash
npx npm install eas-cli
npx expo prebuild --clean --platform android
```

Configura tu ruta al SDK de Android:
*(Sustituye `/Users/XXX/` por tu nombre de usuario)*
```bash
echo "sdk.dir=/Users/XXX/Library/Android/sdk" > android/local.properties
```

Lanzar en dispositivo Android físico o emulador:
```bash
npx expo run:android
```
