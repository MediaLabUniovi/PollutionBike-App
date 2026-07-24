// Necesario librería Nordic https://github.com/nordicsemi/Android-BLE-Library
// El sdk se añade en compilación
// https://github.com/nrfconnect/react-native-ble-plx
import { useState, useEffect } from 'react';

// Mock data for simulation
const MOCK_DEVICES = [
    { id: 'mock-1', name: 'AirQ Sensor #001', rssi: -45, isConnectable: true },
    { id: 'mock-2', name: 'AirQ Sensor #002', rssi: -72, isConnectable: true },
    { id: 'mock-3', name: 'AirQ Sensor #003', rssi: -88, isConnectable: true },
];

export default function useBLEMock() {
    const [allDevices, setAllDevices] = useState([]);
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [sensorData, setSensorData] = useState(null);
    const [steps, setSteps] = useState(0);

    const requestPermissions = async () => true;

    const scanForPeripherals = () => {
        console.log('[MOCK] Scanning for peripherals...');
        setAllDevices([]);

        setTimeout(() => {
            setAllDevices(prev => [...prev, MOCK_DEVICES[0]]);
        }, 1000);

        setTimeout(() => {
            setAllDevices(prev => [...prev, MOCK_DEVICES[1]]);
        }, 2500);

        setTimeout(() => {
            setAllDevices(prev => [...prev, MOCK_DEVICES[2]]);
        }, 4000);
    };

    const connectToDevice = async (device) => {
        console.log('[MOCK] Connecting to device:', device.id);
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[MOCK] Connected!');
                setConnectedDevice(device);
                resolve(device);
            }, 1500);
        });
    };

    const disconnectFromDevice = () => {
        console.log('[MOCK] Disconnecting...');
        setConnectedDevice(null);
        setSteps(0);
        setSensorData(null);
    };

    // Simulate incoming data when connected
    useEffect(() => {
        let interval;
        let timer;
        if (connectedDevice) {
            // Start simulation of data stream after 20 seconds of connecting
            timer = setTimeout(() => {
                interval = setInterval(() => {
                    setSensorData({
                        temp: 21 + +(Math.random() * 3).toFixed(1),
                        hum: 48 + Math.floor(Math.random() * 8),
                        pm25: 14 + +(Math.random() * 15).toFixed(1),
                        pm10: 22 + +(Math.random() * 20).toFixed(1),
                        bat: 88,
                        lat: 43.3619,
                        lon: -5.8494,
                    });
                }, 2000);
            }, 20000);

            return () => {
                if (timer) clearTimeout(timer);
                if (interval) clearInterval(interval);
            };
        } else {
            setSensorData(null);
        }
    }, [connectedDevice]);

    const writeToDevice = async (device, value) => {
        if (!device) {
            console.log('[MOCK] No device connected, ignoring write.');
            return;
        }
        console.log('[MOCK] Writing data to device:', device.id);
        console.log('[MOCK] Payload:', JSON.stringify(value));
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[MOCK] Write success!');
                resolve();
            }, 500);
        });
    };

    return {
        scanForPeripherals,
        requestPermissions,
        connectToDevice,
        allDevices,
        connectedDevice,
        disconnectFromDevice,
        sensorData,
        steps,
        writeToDevice,
        transferProgress: 0,
        isTransferring: false,
        transferStatus: "Idle",
        resetTransferStatus: () => { },
    };
}
