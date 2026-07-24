/**
 * SettingsScreen.jsx - Pantalla de Configuración y Gestión de Archivos
 * -------------------------------------------------------------------
 * CAMBIOS ENERO 2026:
 * - Integración con Firmware PolutionBike v2.
 * - Funcionalidades añadidas:
 *    + Control de Intervalo de Medición (BLE Write).
 *    + Gestión de Archivos SD:
 *      * Listado automático al conectar (Comando 'listFiles').
 *      * Visualización de tarjetas con estilos "Dark Tech".
 *      * Acciones por archivo: Subir a Nube (Comando 'uploadFile') y Borrar (Comando 'deleteFile').
 * - UI/UX Refinada con iconos Lucide y tema oscuro.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, ActivityIndicator, Modal } from 'react-native';
import { ChevronLeft, Clock, MapPin, Download, ChevronRight, Wifi, WifiOff, Battery, Zap, Settings, Trash2, RefreshCw, Check, X, Smartphone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useBLEContext } from '../context/BLEContext';
import { colors } from '../theme/colors';

const intervalOptions = [
    { value: 5, label: "5 segundos" },
    { value: 10, label: "10 segundos" },
    { value: 30, label: "30 segundos" },
    { value: 60, label: "1 minuto" },
    { value: 300, label: "5 minutos" },
    { value: 600, label: "10 minutos" },
];

const gpsModes = [
    { value: "continuous", label: "Continuo", description: "GPS siempre activo", icon: Wifi },
    { value: "simulated", label: "Simulado", description: "Ubicación fija simulada", icon: MapPin },
];

export default function SettingsScreen() {
    const navigation = useNavigation();
    const {
        connectedDevice,
        writeToDevice,
        sensorData,
        transferProgress,
        isTransferring,
        transferStatus,
        resetTransferStatus
    } = useBLEContext();
    const [storedFiles, setStoredFiles] = useState([]);
    const [measureInterval, setMeasureInterval] = useState(30);
    const [gpsMode, setGpsMode] = useState("continuous");
    const [isDumping, setIsDumping] = useState(false);
    const [showIntervalPicker, setShowIntervalPicker] = useState(false);
    const [showGpsPicker, setShowGpsPicker] = useState(false);

    const [progress] = useState(new Animated.Value(0));

    const selectedInterval = intervalOptions.find((opt) => opt.value === measureInterval);
    const selectedGps = gpsModes.find((mode) => mode.value === gpsMode);

    useEffect(() => {
        if (connectedDevice) {
            // Request file list and settings on mount
            writeToDevice(connectedDevice, { cmd: "listFiles" });
            writeToDevice(connectedDevice, { cmd: "getSettings" });
        }
    }, [connectedDevice]);

    useEffect(() => {
        if (sensorData?.files) {
            setStoredFiles(sensorData.files);
        }
        if (sensorData?.status === "deleted") {
            // Auto refresh after delete
            writeToDevice(connectedDevice, { cmd: "listFiles" });
        }
        if (sensorData?.type === "settings") {
            setMeasureInterval(sensorData.interval / 1000);
            setGpsMode(sensorData.gpsMode);
        }
    }, [sensorData]);

    const handleDumpData = () => {
        setIsDumping(true);
        Animated.timing(progress, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start(() => {
            setIsDumping(false);
            progress.setValue(0);
        });
    };

    const width = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Settings size={20} color={colors.primary} />
                    <Text style={styles.title}>Configuración</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sections}>
                    {/* Measurement Interval Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Clock size={20} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Intervalo de Medidas</Text>
                                <Text style={styles.sectionDescription}>Frecuencia de lectura del sensor</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowIntervalPicker(!showIntervalPicker)}
                            style={styles.pickerButton}
                        >
                            <Text style={styles.pickerLabel}>Intervalo actual</Text>
                            <View style={styles.pickerValueContainer}>
                                <Text style={styles.pickerValue}>{selectedInterval?.label}</Text>
                                <ChevronRight
                                    size={16}
                                    color={colors.mutedForeground}
                                    style={{ transform: [{ rotate: showIntervalPicker ? '90deg' : '0deg' }] }}
                                />
                            </View>
                        </TouchableOpacity>

                        {showIntervalPicker && (
                            <View style={styles.pickerOptions}>
                                {intervalOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => {
                                            setMeasureInterval(option.value);
                                            writeToDevice(connectedDevice, { measureInterval: option.value });
                                            setShowIntervalPicker(false);
                                        }}
                                        style={[
                                            styles.optionItem,
                                            measureInterval === option.value && styles.selectedOptionItem
                                        ]}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            measureInterval === option.value && styles.selectedOptionText
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {measureInterval === option.value && <View style={styles.selectedDot} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* GPS Mode Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: colors.success + '1A' }]}>
                                <MapPin size={20} color={colors.success} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Modo GPS</Text>
                                <Text style={styles.sectionDescription}>Configuración de ubicación</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowGpsPicker(!showGpsPicker)}
                            style={styles.pickerButton}
                        >
                            <Text style={styles.pickerLabel}>Modo actual</Text>
                            <View style={styles.pickerValueContainer}>
                                <Text style={[styles.pickerValue, { color: colors.success }]}>{selectedGps?.label}</Text>
                                <ChevronRight
                                    size={16}
                                    color={colors.mutedForeground}
                                    style={{ transform: [{ rotate: showGpsPicker ? '90deg' : '0deg' }] }}
                                />
                            </View>
                        </TouchableOpacity>

                        {showGpsPicker && (
                            <View style={styles.pickerOptions}>
                                {gpsModes.map((mode) => {
                                    const IconComponent = mode.icon;
                                    return (
                                        <TouchableOpacity
                                            key={mode.value}
                                            onPress={() => {
                                                setGpsMode(mode.value);
                                                writeToDevice(connectedDevice, { gpsMode: mode.value });
                                                setShowGpsPicker(false);
                                            }}
                                            style={[
                                                styles.gpsOptionItem,
                                                gpsMode === mode.value && { backgroundColor: colors.success + '1A' }
                                            ]}
                                        >
                                            <IconComponent
                                                size={20}
                                                color={gpsMode === mode.value ? colors.success : colors.mutedForeground}
                                            />
                                            <View style={styles.gpsOptionTextContainer}>
                                                <Text style={[
                                                    styles.optionText,
                                                    gpsMode === mode.value && { color: colors.success }
                                                ]}>
                                                    {mode.label}
                                                </Text>
                                                <Text style={styles.gpsOptionDescription}>{mode.description}</Text>
                                            </View>
                                            {gpsMode === mode.value && <View style={[styles.selectedDot, { backgroundColor: colors.success }]} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        <View style={styles.batteryIndicator}>
                            <Battery size={16} color={colors.mutedForeground} />
                            <Text style={styles.batteryText}>
                                Consumo: {gpsMode === "continuous" ? "Alto" : "Bajo"}
                            </Text>
                            <View style={styles.batteryDots}>
                                <View style={[styles.batteryDot, { backgroundColor: colors.warning }]} />
                                <View style={[styles.batteryDot, { backgroundColor: gpsMode === "continuous" ? colors.warning : colors.muted }]} />
                                <View style={[styles.batteryDot, { backgroundColor: gpsMode === "continuous" ? colors.destructive : colors.muted }]} />
                            </View>
                        </View>
                    </View>

                    {/* SD Files Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: colors.chart5 + '1A' }]}>
                                <Download size={20} color={colors.chart5} />
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Datos almacenados</Text>
                                <Text style={styles.sectionDescription}>Gestionar registros almacenados</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => writeToDevice(connectedDevice, { cmd: "listFiles" })}
                                style={{ marginLeft: 'auto', padding: 8 }}
                            >
                                <RefreshCw size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dataDumpContent}>
                            {storedFiles.length === 0 ? (
                                <Text style={styles.noFilesText}>No hay archivos o lista no actualizada</Text>
                            ) : (
                                storedFiles.map((file, index) => (
                                    <View key={index} style={styles.fileItem}>
                                        <Text style={styles.fileName}>{file}</Text>
                                        <View style={styles.fileActions}>
                                            <TouchableOpacity
                                                onPress={() => writeToDevice(connectedDevice, { cmd: "uploadFile", file: file })}
                                                style={[styles.actionButton, { backgroundColor: colors.primary + '1A' }]}
                                            >
                                                <Zap size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => writeToDevice(connectedDevice, { cmd: "transferFile", file: file })}
                                                style={[styles.actionButton, { backgroundColor: colors.success + '1A', marginRight: 8 }]}
                                            >
                                                <Smartphone size={16} color={colors.success} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => writeToDevice(connectedDevice, { cmd: "deleteFile", file: file })}
                                                style={[styles.actionButton, { backgroundColor: colors.destructive + '1A' }]}
                                            >
                                                <Trash2 size={16} color={colors.destructive} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </View>

                {/* Version info */}
                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>Firmware v1.2.3 | App v2.0.0</Text>
                </View>
            </ScrollView>

            <Modal
                transparent={true}
                visible={isTransferring || transferStatus === "Uploading" || transferStatus === "Success" || transferStatus === "Error"}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {transferStatus === "Uploading" ? "Subiendo a Nube..." :
                                transferStatus === "Success" ? "¡Completado!" :
                                    transferStatus === "Error" ? "Error" :
                                        "Transfiriendo..."}
                        </Text>

                        {transferStatus === "Uploading" ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
                        ) : transferStatus === "Success" ? (
                            <Check size={48} color={colors.success} style={{ marginVertical: 20, alignSelf: 'center' }} />
                        ) : transferStatus === "Error" ? (
                            <X size={48} color={colors.destructive} style={{ marginVertical: 20, alignSelf: 'center' }} />
                        ) : (
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${transferProgress * 100}%` }]} />
                            </View>
                        )}

                        <Text style={styles.modalStatus}>
                            {transferStatus === "Uploading" ? "Enviando a medialab-uniovi.es" :
                                transferStatus === "Success" ? "Archivo subido correctamente." :
                                    transferStatus === "Error" ? "Fallo al subir archivo." :
                                        `${Math.round(transferProgress * 100)}%`}
                        </Text>

                        {(transferStatus === "Success" || transferStatus === "Error") && (
                            <TouchableOpacity
                                onPress={() => {
                                    resetTransferStatus();
                                }}
                                style={{
                                    marginTop: 20,
                                    backgroundColor: colors.secondary,
                                    padding: 10,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: colors.foreground }}>Cerrar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
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
        padding: 20,
        paddingTop: 20, // approximate SafeAreaView top padding
        gap: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        marginLeft: -8,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.foreground,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sections: {
        gap: 16,
    },
    section: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    sectionHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary + '1A', // 10% opacity
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.foreground,
    },
    sectionDescription: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    pickerButton: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerLabel: {
        color: colors.mutedForeground,
        fontSize: 14,
    },
    pickerValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pickerValue: {
        fontWeight: '500',
        color: colors.primary,
        fontSize: 14,
    },
    pickerOptions: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.secondary + '4D', // 30% opacity
    },
    optionItem: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedOptionItem: {
        backgroundColor: colors.primary + '1A',
    },
    optionText: {
        fontSize: 14,
        color: colors.foreground,
    },
    selectedOptionText: {
        color: colors.primary,
        fontWeight: '500',
    },
    selectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    gpsOptionItem: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    gpsOptionTextContainer: {
        flex: 1,
    },
    gpsOptionDescription: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    batteryIndicator: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    batteryText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    batteryDots: {
        flexDirection: 'row',
        gap: 4,
        marginLeft: 'auto',
    },
    batteryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dataDumpContent: {
        padding: 16,
    },
    dataStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dataStatLabel: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    dataStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.foreground,
        marginTop: 4,
    },
    dumpButton: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    dumpButtonText: {
        color: colors.background, // Contrast against chart5
        fontWeight: '500',
    },
    progressContainer: {
        marginTop: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: colors.secondary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    versionInfo: {
        marginTop: 32,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: colors.mutedForeground,
    },
    noFilesText: {
        color: colors.mutedForeground,
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 16,
    },
    fileItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: colors.secondary + "4D",
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    fileName: {
        fontSize: 14,
        color: colors.foreground,
        fontWeight: "500",
        flex: 1,
    },
    fileActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 24,
        width: '80%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.foreground,
        marginBottom: 10,
        textAlign: 'center',
    },
    modalStatus: {
        fontSize: 14,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: 10,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: colors.secondary,
        borderRadius: 4,
        overflow: 'hidden',
        marginVertical: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.chart5, // Using a vibrant color for progress
    },
});
