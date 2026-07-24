import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { RefreshCw, Settings, Bluetooth, MapPin, Info, Radio } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useBLEContext } from '../context/BLEContext';
import { MetricCard } from '../components/MetricCard';
import { AirQualityGauge } from '../components/AirQualityGauge';
import { BatteryIndicator } from '../components/BatteryIndicator';

const initialData = {
    battery: null,
    temperature: null,
    humidity: null,
    pm25: null,
    pm10: null,
    lastUpdated: null,
    location: "Sin señal GPS",
    status: "disconnected" // disconnected, connected, searching_gps, measuring
};

export default function DashboardScreen() {
    const navigation = useNavigation();
    const { connectedDevice, disconnectFromDevice, steps, sensorData } = useBLEContext();

    // Force connection: if disconnected, redirect to Bluetooth screen immediately
    useEffect(() => {
        if (!connectedDevice) {
            navigation.replace('Bluetooth');
        }
    }, [connectedDevice, navigation]);

    // State for dashboard data
    const [data, setData] = useState(initialData);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Effect to update UI when BLE data arrives
    useEffect(() => {
        if (!connectedDevice) {
            setData(initialData);
            return;
        }

        if (sensorData) {
            // Real or Mock sensor data from ESP32 / Mock hook
            if (sensorData.status) {
                setData(prev => ({ ...prev, status: sensorData.status }));
            } else {
                // Regular sensor data
                setData(prev => ({
                    ...prev,
                    temperature: sensorData.temp !== undefined ? sensorData.temp : prev.temperature,
                    humidity: sensorData.hum !== undefined ? sensorData.hum : prev.humidity,
                    pm25: sensorData.pm25 !== undefined ? sensorData.pm25 : prev.pm25,
                    pm10: sensorData.pm10 !== undefined ? sensorData.pm10 : prev.pm10,
                    battery: sensorData.bat !== undefined ? sensorData.bat : prev.battery,
                    lastUpdated: new Date(),
                    location: (sensorData.lat && sensorData.lon && (sensorData.lat !== 0 || sensorData.lon !== 0))
                        ? `${sensorData.lat.toFixed(5)}, ${sensorData.lon.toFixed(5)}`
                        : "Sin señal GPS",
                    status: "measuring"
                }));
            }
        } else {
            // Connected but no sensor data received yet
            setData(prev => ({
                ...initialData,
                status: "connected",
                battery: prev.battery
            }));
        }
    }, [sensorData, connectedDevice]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    useEffect(() => {
        const interval = setInterval(handleRefresh, 30000);
        return () => clearInterval(interval);
    }, []);

    const getAQIStatus = (pm25) => {
        if (pm25 === null || pm25 === undefined) return { label: "--", color: colors.mutedForeground };
        if (pm25 <= 12) return { label: "Buena", color: colors.success };
        if (pm25 <= 35) return { label: "Moderada", color: colors.warning };
        if (pm25 <= 55) return { label: "Dañina (Sensibles)", color: "#f97316" };
        return { label: "Mala", color: colors.destructive };
    };

    const aqiStatus = getAQIStatus(data.pm25);
    const hasReceivedData = data.pm25 !== null && data.pm25 !== undefined;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Upper Header with Info, Refresh, Bluetooth, Settings and Battery */}
                <View style={styles.header}>
                    {/* Left: Battery + Percentage */}
                    <View style={styles.connectionStatus}>
                        <BatteryIndicator level={data.battery ?? 0} />
                        <Text style={styles.connectionText}>
                            {data.battery !== null ? `${Math.round(data.battery)}%` : "--%"}
                        </Text>
                    </View>

                    {/* Right: Info, Refresh, Bluetooth, Settings */}
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Info')}>
                            <Info size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={handleRefresh}>
                            <RefreshCw size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Bluetooth')}
                        >
                            <Bluetooth
                                size={20}
                                color={connectedDevice ? colors.primary : colors.mutedForeground}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
                            <Settings size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Banner */}
                {data.status === 'searching_gps' && (
                    <View style={styles.statusBanner}>
                        <RefreshCw size={16} color="#fff" style={styles.spinIcon} />
                        <Text style={styles.statusBannerText}>Buscando GPS...</Text>
                    </View>
                )}

                {/* Location */}
                <View style={styles.locationContainer}>
                    <MapPin size={16} color={colors.primary} />
                    <Text style={styles.locationText}>{data.location}</Text>
                </View>

                {/* Conditional Rendering: Gauges vs Legend */}
                {hasReceivedData ? (
                    <>
                        {/* Main AQI */}
                        <View style={styles.mainCard}>
                            <View style={styles.mainCardHeader}>
                                <Text style={styles.mainCardLabel}>Índice Calidad Aire</Text>
                                <Text style={[styles.mainCardValue, { color: aqiStatus.color }]}>
                                    {aqiStatus.label}
                                </Text>
                            </View>
                            <AirQualityGauge pm25={data.pm25 ?? 0} pm10={data.pm10 ?? 0} />
                        </View>

                        {/* Metrics Grid */}
                        <View style={styles.grid}>
                            <View style={styles.row}>
                                <MetricCard
                                    title="PM2.5"
                                    value={data.pm25.toFixed(1)}
                                    unit="µg/m³"
                                    icon="particles"
                                    status={data.pm25 <= 35 ? "good" : data.pm25 <= 55 ? "moderate" : "bad"}
                                />
                                <View style={{ width: 16 }} />
                                <MetricCard
                                    title="PM10"
                                    value={data.pm10 !== null ? data.pm10.toFixed(1) : "--"}
                                    unit="µg/m³"
                                    icon="particles"
                                    status={data.pm10 === null ? "neutral" : (data.pm10 <= 50 ? "good" : data.pm10 <= 100 ? "moderate" : "bad")}
                                />
                            </View>
                            <View style={{ height: 16 }} />
                            <View style={styles.row}>
                                <MetricCard
                                    title="Temperatura"
                                    value={data.temperature !== null ? data.temperature.toFixed(1) : "--"}
                                    unit="°C"
                                    icon="temperature"
                                    status="neutral"
                                />
                                <View style={{ width: 16 }} />
                                <MetricCard
                                    title="Humedad"
                                    value={data.humidity !== null ? data.humidity.toFixed(0) : "--"}
                                    unit="%"
                                    icon="humidity"
                                    status="neutral"
                                />
                            </View>
                        </View>
                    </>
                ) : (
                    /* Instruction Legend Card displayed when no data is received yet */
                    <View style={styles.legendCard}>
                        <View style={styles.legendHeader}>
                            <Radio size={22} color={colors.primary} />
                            <Text style={styles.legendTitle}>Sensor Conectado</Text>
                        </View>
                        <Text style={styles.legendSubtitle}>
                            Esperando recepción de datos del sensor. Sigue estas instrucciones para operarlo:
                        </Text>

                        <View style={styles.legendItem}>
                            <View style={styles.badgeShort}>
                                <Text style={styles.badgeText}>Pulsación corta</Text>
                            </View>
                            <Text style={styles.legendText}>
                                Cambia entre <Text style={styles.boldText}>Modo Normal</Text> y <Text style={styles.boldText}>Modo Bluetooth</Text> (LED en azul).
                            </Text>
                        </View>

                        <View style={styles.legendItem}>
                            <View style={styles.badgeLong}>
                                <Text style={styles.badgeText}>Pulsación larga (2 s)</Text>
                            </View>
                            <Text style={styles.legendText}>
                                Inicia o finaliza la <Text style={styles.boldText}>recolección de datos</Text> en tiempo real.
                            </Text>
                        </View>

                        <View style={styles.legendFooter}>
                            <Settings size={16} color={colors.primary} />
                            <Text style={styles.legendFooterText}>
                                Recuerda configurar el <Text style={styles.boldText}>intervalo de toma de datos</Text> y el <Text style={styles.boldText}>modo GPS</Text> desde Ajustes.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.lastUpdated}>
                    Última act.: {data.lastUpdated ? data.lastUpdated.toLocaleTimeString() : "--:--"}
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    connectionText: {
        color: colors.mutedForeground,
        fontSize: 14,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 8,
        backgroundColor: colors.secondary,
        borderRadius: 20,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    locationText: {
        color: colors.foreground,
        fontWeight: '500',
    },
    mainCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    mainCardHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    mainCardLabel: {
        color: colors.mutedForeground,
        fontSize: 14,
        marginBottom: 4,
    },
    mainCardValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    grid: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    lastUpdated: {
        textAlign: 'center',
        color: colors.mutedForeground,
        fontSize: 12,
        marginTop: 32,
    },
    statusBanner: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    statusBannerText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    /* Legend Card Styles */
    legendCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
    },
    legendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    legendTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    legendSubtitle: {
        color: colors.mutedForeground,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    legendItem: {
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    badgeShort: {
        backgroundColor: 'rgba(45, 212, 191, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    badgeLong: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    badgeText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 12,
    },
    legendText: {
        color: colors.mutedForeground,
        fontSize: 13,
        lineHeight: 18,
    },
    boldText: {
        fontWeight: '600',
        color: colors.foreground,
    },
    legendFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    legendFooterText: {
        color: colors.mutedForeground,
        fontSize: 12,
        flex: 1,
        lineHeight: 16,
    },
});
