import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Bluetooth, ChevronLeft, RefreshCw, Signal, CheckCircle, Smartphone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useBLEContext } from '../context/BLEContext';

// Helper to determine signal strength icon/text
const getSignalInfo = (rssi) => {
    // RSSI is typically negative, e.g. -50 is strong, -90 is weak.
    // If undefined (some android scans), assume medium?
    if (!rssi) return { text: 'Desconocida', color: colors.mutedForeground };
    if (rssi > -60) return { text: 'Excelente', color: colors.success };
    if (rssi > -75) return { text: 'Buena', color: colors.warning };
    return { text: 'Débil', color: colors.destructive };
};

export default function BluetoothScreen() {
    const navigation = useNavigation();
    const {
        requestPermissions,
        scanForPeripherals,
        allDevices,
        connectToDevice,
        connectedDevice,
        disconnectFromDevice
    } = useBLEContext();

    const [isScanning, setIsScanning] = useState(false);
    const [connectingId, setConnectingId] = useState(null);

    const startScan = async () => {
        const granted = await requestPermissions();
        if (granted) {
            setIsScanning(true);
            scanForPeripherals();
            // Stop scanning visualization after some time or let logic handle it?
            // The useBLE scan doesn't expose "isScanning" state directly, but we can simulate the UI state.
            setTimeout(() => setIsScanning(false), 10000);
        }
    };

    useEffect(() => {
        startScan();
    }, []);

    const handleConnect = async (device) => {
        setConnectingId(device.id);
        await connectToDevice(device);
        setConnectingId(null);
        // Navigate to Dashboard after connection?
        // User flow suggests usually staying or auto-redirecting.
        // Source project had: setTimeout(() => setCurrentScreen("dashboard"), 1500)
        setTimeout(() => {
            navigation.navigate('Dashboard');
        }, 1500);
    };

    const renderItem = ({ item }) => {
        const isConnected = connectedDevice?.id === item.id;
        const isConnecting = connectingId === item.id;
        const { text: signalText, color: signalColor } = getSignalInfo(item.rssi);

        return (
            <TouchableOpacity
                style={[
                    styles.deviceCard,
                    isConnected && styles.deviceCardConnected,
                    isConnecting && styles.deviceCardConnecting
                ]}
                onPress={() => !isConnected && !isConnecting && handleConnect(item)}
                disabled={isConnecting || isConnected}
            >
                <View style={[
                    styles.iconContainer,
                    isConnected ? { backgroundColor: 'rgba(34, 197, 94, 0.1)' } : { backgroundColor: 'rgba(45, 212, 191, 0.1)' }
                ]}>
                    <Bluetooth
                        size={24}
                        color={isConnected ? colors.success : colors.primary}
                    />
                </View>

                <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, isConnected && { color: colors.success }]}>
                        {item.name || "Dispositivo Desconocido"}
                    </Text>
                    <View style={styles.signalContainer}>
                        <Signal size={14} color={signalColor} />
                        <Text style={styles.signalText}>Señal {signalText}</Text>
                        {/* ID for debugging if needed */}
                        <Text style={styles.deviceId} numberOfLines={1}>{item.id}</Text>
                    </View>
                </View>

                <View style={styles.statusIcons}>
                    {isConnecting ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : isConnected ? (
                        <CheckCircle size={24} color={colors.success} />
                    ) : (
                        <View style={styles.connectPlaceholder}>
                            <Bluetooth size={16} color={colors.mutedForeground} />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Bluetooth size={24} color={colors.primary} />
                    <Text style={styles.headerTitle}>Conectar Sensor</Text>
                </View>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={startScan}
                    disabled={isScanning}
                >
                    {isScanning ? (
                        <ActivityIndicator size="small" color={colors.mutedForeground} />
                    ) : (
                        <RefreshCw size={20} color={colors.mutedForeground} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Scanning Status */}
            <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <View style={[styles.statusIconBox, isScanning && styles.statusIconBoxActive]}>
                        <Bluetooth size={24} color={isScanning ? colors.primary : colors.mutedForeground} opacity={isScanning ? 1 : 0.5} />
                    </View>
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusTitle}>
                            {isScanning ? "Escaneando dispositivos..." : "Escaneo completado"}
                        </Text>
                        <Text style={styles.statusSubtitle}>
                            {isScanning
                                ? "Asegúrate de que el sensor esté encendido"
                                : `${allDevices.length} dispositivo${allDevices.length !== 1 ? 's' : ''} encontrado${allDevices.length !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Device List */}
            <FlatList
                data={allDevices}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !isScanning && (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconData}>
                                <Bluetooth size={32} color={colors.mutedForeground} />
                            </View>
                            <Text style={styles.emptyText}>No se encontraron dispositivos</Text>
                            <TouchableOpacity onPress={startScan}>
                                <Text style={styles.retryText}>Reintentar Escaneo</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />

            {/* Connected Footer */}
            {connectedDevice && (
                <View style={styles.connectedFooter}>
                    <View style={styles.connectedRow}>
                        <CheckCircle size={20} color={colors.success} />
                        <View style={styles.connectedInfo}>
                            <Text style={styles.connectedLabel}>Sensor Conectado</Text>
                            <Text style={styles.connectedName}>{connectedDevice.name}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => navigation.navigate('Dashboard')}
                        >
                            <Text style={styles.continueText}>Continuar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.foreground,
    },
    scanButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.secondary,
    },
    statusCard: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIconBoxActive: {
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.foreground,
    },
    statusSubtitle: {
        fontSize: 14,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    deviceCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    deviceCardConnected: {
        borderColor: colors.success,
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
    },
    deviceCardConnecting: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(45, 212, 191, 0.05)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.foreground,
        marginBottom: 4,
    },
    signalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    signalText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    deviceId: {
        fontSize: 10,
        color: colors.mutedForeground,
        opacity: 0.7,
    },
    statusIcons: {
        minWidth: 24,
        alignItems: 'flex-end',
    },
    connectPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconData: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: colors.mutedForeground,
        marginBottom: 8,
    },
    retryText: {
        color: colors.primary,
        fontWeight: '500',
    },
    connectedFooter: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
        padding: 16,
    },
    connectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    connectedInfo: {
        flex: 1,
    },
    connectedLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.success,
    },
    connectedName: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    continueButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.success,
        borderRadius: 12,
    },
    continueText: {
        color: colors.background,
        fontWeight: '600',
        fontSize: 14,
    },
});
