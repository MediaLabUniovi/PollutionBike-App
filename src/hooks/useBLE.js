/* eslint-disable no-bitwise */
import { useMemo, useState, useRef } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleManager,
} from "react-native-ble-plx";

import base64 from "react-native-base64";
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import * as FileSystem from 'expo-file-system';

const SERVICE_UUID = "";
const STEP_DATA_CHAR_UUID = "";
const SETTINGS_CHAR_UUID = "";

function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [sensorData, setSensorData] = useState(null);

  // File Transfer State (Logic - Refs for stable values in closure)
  const transferBufferRef = useRef("");
  const currentTransferFileRef = useRef("");
  const expectedSizeRef = useRef(0);

  // File Transfer State (UI)
  const [transferProgress, setTransferProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState("Idle"); // Idle, Transferring, Uploading, Success, Error
  const [transferBuffer, setTransferBuffer] = useState("");
  const [currentTransferFile, setCurrentTransferFile] = useState("");
  const [expectedSize, setExpectedSize] = useState(0);

  const requestAndroid31Permissions = async () => {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
      PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
      PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((Platform.Version ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices, nextDevice) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = async () => {
    try {
      const bluetoothState = await BluetoothStateManager.getState();

      if (bluetoothState !== 'PoweredOn') {
        const requestResult = await BluetoothStateManager.requestToEnable();

        if (requestResult !== 'PoweredOn') {
          console.log('Bluetooth is not enabled by user.');
          return;
        }

      }
    } catch (e) { console.log(e); }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && device.name?.includes("AirQ")) { // Updated filter name
        setAllDevices((prevState) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  }
  const connectToDevice = async (device) => {
    console.log("Connecting to Device", device.id);
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      console.log("Connected to Device", deviceConnection.name);
      setConnectedDevice(deviceConnection);

      // Negotiate MTU for Android (iOS handles this automatically)
      // JSON payloads > 20 bytes require larger MTU or chunking. We request 512.
      if (Platform.OS === 'android') {
        try {
          await deviceConnection.requestMTU(512);
          console.log("MTU requested: 512");
        } catch (mtuError) {
          console.log("MTU negotiation failed:", mtuError);
        }
      }

      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setSensorData(null);
    }
  };

  const onStepUpdate = (
    error,
    characteristic
  ) => {
    if (error) {
      console.log(error);
      return -1;
    } else if (!characteristic?.value) {
      console.log("No Data was recieved");
      return -1;
    }

    const rawData = base64.decode(characteristic.value);
    // console.log("Raw Data: ", rawData);

    try {
      const parsed = JSON.parse(rawData);

      // 0. Explicit Types handling (File Transfer)
      if (parsed.type === "fileStart") {
        transferBufferRef.current = "";
        currentTransferFileRef.current = parsed.file;
        expectedSizeRef.current = parsed.size;

        setIsTransferring(true);
        setTransferStatus("Transferring");
        setTransferProgress(0);
        console.log("File Transfer Started:", parsed.file, "Size:", parsed.size);
        return;
      }

      if (parsed.type === "fileData") {
        transferBufferRef.current += parsed.line + "\n";

        // Update progress UI (without relying on state for buffer)
        if (expectedSizeRef.current > 0) {
          const currentSize = transferBufferRef.current.length;
          setTransferProgress(Math.min(0.99, currentSize / expectedSizeRef.current));
        }
        return;
      }

      if (parsed.type === "fileEnd") {
        setIsTransferring(false);
        setTransferStatus("Uploading");
        setTransferProgress(1);
        console.log("File Transfer Completed. Buffer Size:", transferBufferRef.current.length);
        uploadFileToMedialab(transferBufferRef.current, currentTransferFileRef.current);
        return;
      }

      // 1. General Data / Status Updates
      if (parsed.temp !== undefined || parsed.hum !== undefined || parsed.files !== undefined || parsed.status !== undefined || parsed.type === "settings") {
        setSensorData(prev => Object.assign(prev || {}, parsed));
      }

    } catch (e) {
      console.log("Error parsing JSON data: ", e, rawData);
    }
  };

  const startStreamingData = async (device) => {
    console.log("Starting to Stream Data");
    if (device) {
      const subscription = device.monitorCharacteristicForService(
        SERVICE_UUID,
        STEP_DATA_CHAR_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) {
            subscription?.remove();
            if (device?.id) bleManager.cancelDeviceConnection(device.id);
            setConnectedDevice(null);
            setSensorData(null);
            return;
          }
          onStepUpdate(error, characteristic);
        }
      );
    } else {
      console.log("No Device Connected");
    }
  };

  const writeToDevice = async (device, value) => {
    if (!device) {
      console.log("No Device Connected");
      return;
    }

    try {
      // Encode value to base64
      const base64Value = base64.encode(JSON.stringify(value));

      await bleManager.writeCharacteristicWithResponseForDevice(
        device.id,
        SERVICE_UUID,
        SETTINGS_CHAR_UUID,
        base64Value
      );
      console.log("Written data: ", value);
    } catch (e) {
      console.log("FAILED TO WRITE", e);
    }
  };

  const uploadFileToMedialab = async (content, fileName) => {
    // Clean filename (remove start slash if present)
    const cleanFileName = fileName.startsWith('/') ? fileName.substring(1) : fileName;

    console.log("Uploading to cloud...");

    try {
      // 1. Write content to a temporary file
      const fileUri = FileSystem.documentDirectory + (cleanFileName || 'temp.csv');
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log("File written to:", fileUri);

      // 2. Upload file
      const body = new FormData();
      body.append('csv', {
        name: cleanFileName || 'datos.csv',
        type: 'text/csv',
        uri: fileUri,
      });

      const response = await fetch('https://medialab-uniovi.es/bike_pollution/upload.php', {
        method: 'POST',
        body: body,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const text = await response.text();
      console.log("Server Response:", text);

      // 3. Clean up temp file (optional but good practice)
      try {
        await FileSystem.deleteAsync(fileUri);
      } catch (e) { /* ignore */ }

      if (text.includes("El archivo es valido") || text.includes("Ride inserted")) {
        setTransferStatus("Success");
      } else {
        setTransferStatus("Error");
      }
    } catch (error) {
      console.error("Upload failed", error);
      setTransferStatus("Error");
    }
  };

  const resetTransferStatus = () => {
    setTransferStatus("Idle");
    setTransferProgress(0);
    setIsTransferring(false);
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    sensorData, // Changed from steps
    writeToDevice,
    transferProgress,
    isTransferring,
    transferStatus,
    resetTransferStatus
  };
}

export default useBLE;
