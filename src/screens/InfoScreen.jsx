import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, Info, Wind, Bluetooth, Settings, Upload, Zap, Smartphone, Wifi, Calendar, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

export default function InfoScreen() {
    const navigation = useNavigation();

    const Section = ({ icon: Icon, title, children, color = colors.primary }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: color + '1A' }]}>
                    <Icon size={20} color={color} />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Info size={20} color={colors.primary} />
                    <Text style={styles.title}>Guía de Usuario</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* 1. AQI Explanation */}
                <Section icon={Wind} title="Índice de Calidad del Aire (AQI)" color={colors.chart4}>
                    <Text style={styles.text}>
                        El AQI se calcula basándose en la concentración de partículas PM2.5 utilizando el estándar de la <Text style={styles.bold}>EPA (Agencia de Protección Ambiental de EE. UU.)</Text>.
                    </Text>
                    <Text style={styles.text}>
                        Nota: El valor del AQI no es igual a la concentración en µg/m³. Es un índice no lineal diseñado para reflejar el impacto en la salud. Por ejemplo, 36 µg/m³ corresponde a un AQI de ~100 (límite de dañino).
                    </Text>
                    <View style={styles.aqiTable}>
                        <View style={styles.aqiRow}>
                            <View style={[styles.aqiDot, { backgroundColor: colors.success }]} />
                            <Text style={styles.aqiLabel}>Buena (0-12 PM2.5)</Text>
                        </View>
                        <View style={styles.aqiRow}>
                            <View style={[styles.aqiDot, { backgroundColor: colors.warning }]} />
                            <Text style={styles.aqiLabel}>Moderada (13-35 PM2.5)</Text>
                        </View>
                        <View style={styles.aqiRow}>
                            <View style={[styles.aqiDot, { backgroundColor: "#f97316" }]} />
                            <Text style={styles.aqiLabel}>Dañina (36-55 PM2.5)</Text>
                        </View>
                        <View style={styles.aqiRow}>
                            <View style={[styles.aqiDot, { backgroundColor: colors.destructive }]} />
                            <Text style={styles.aqiLabel}>Mala ({'>'}55 PM2.5)</Text>
                        </View>
                    </View>
                </Section>

                {/* 2. Bluetooth Connection */}
                <Section icon={Bluetooth} title="Conexión Bluetooth" color={colors.primary}>
                    <Text style={styles.text}>
                        Para conectar el sensor:
                    </Text>
                    <View style={styles.stepList}>
                        <Text style={styles.step}>1. Pulsa el botón <Bluetooth size={14} color={colors.primary} /> en el Dashboard.</Text>
                        <Text style={styles.step}>2. Escanea dispositivos cercanos.</Text>
                        <Text style={styles.step}>3. Selecciona "PollutionBike" o tu sensor.</Text>
                        <Text style={styles.step}>4. El icono cambiará a azul al conectar.</Text>
                    </View>
                </Section>

                {/* 3. Settings */}
                <Section icon={Settings} title="Configuración" color={colors.mutedForeground}>
                    <Text style={styles.text}>
                        En la pantalla de configuración puedes ajustar:
                    </Text>
                    <View style={styles.featureItem}>
                        <Calendar size={16} color={colors.mutedForeground} />
                        <Text style={styles.featureText}><Text style={styles.bold}>Intervalo:</Text> Frecuencia de toma de datos (5s - 10min).</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Wifi size={16} color={colors.success} />
                        <Text style={styles.featureText}><Text style={styles.bold}>Modo GPS:</Text> Continuo (siempre encendido) o por Intervalo (ahorra batería).</Text>
                    </View>
                </Section>

                {/* 4. Data Upload */}
                <Section icon={Upload} title="Subida de Datos" color={colors.chart5}>
                    <Text style={styles.text}>
                        Existen dos métodos para subir los datos almacenados en la tarjeta SD:
                    </Text>

                    <View style={styles.uploadMethod}>
                        <View style={[styles.methodIcon, { backgroundColor: colors.primary + '1A' }]}>
                            <Zap size={20} color={colors.primary} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodTitle}>Vía WiFi (Sensor)</Text>
                            <Text style={styles.methodDesc}>
                                El sensor se conecta directamente a la WiFi configurada y sube el archivo. Es el primer botón en la lista.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.uploadMethod}>
                        <View style={[styles.methodIcon, { backgroundColor: colors.success + '1A' }]}>
                            <Smartphone size={20} color={colors.success} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodTitle}>Vía App (Bluetooth)</Text>
                            <Text style={styles.methodDesc}>
                                El sensor envía el archivo a la App por Bluetooth, y la App lo sube a la nube. Es el segundo botón.
                            </Text>
                        </View>
                    </View>
                </Section>

            </ScrollView>
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
        paddingTop: 20,
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
        gap: 20,
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
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    sectionContent: {
        padding: 16,
    },
    text: {
        color: colors.mutedForeground,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    aqiTable: {
        gap: 8,
    },
    aqiRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aqiDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    aqiLabel: {
        color: colors.foreground,
        fontSize: 14,
    },
    stepList: {
        gap: 8,
    },
    step: {
        color: colors.foreground,
        fontSize: 14,
    },
    featureItem: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    featureText: {
        color: colors.mutedForeground,
        fontSize: 14,
        flex: 1,
    },
    bold: {
        fontWeight: '600',
        color: colors.foreground,
    },
    uploadMethod: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        backgroundColor: colors.secondary + '4D',
        padding: 12,
        borderRadius: 8,
    },
    methodIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodInfo: {
        flex: 1,
        gap: 4,
    },
    methodTitle: {
        color: colors.foreground,
        fontWeight: '600',
        fontSize: 14,
    },
    methodDesc: {
        color: colors.mutedForeground,
        fontSize: 12,
        lineHeight: 16,
    },
});
