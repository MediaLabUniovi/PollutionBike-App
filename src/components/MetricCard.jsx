import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Thermometer, Droplets, Wind } from 'lucide-react-native';
import { colors } from '../theme/colors';

const icons = {
    temperature: Thermometer,
    humidity: Droplets,
    particles: Wind,
};

export function MetricCard({ title, value, unit, icon, status }) {
    const Icon = icons[icon] || Wind;

    const getStatusColor = () => {
        switch (status) {
            case 'good': return colors.success;
            case 'moderate': return colors.warning;
            case 'bad': return colors.destructive;
            default: return colors.mutedForeground;
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Icon size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.unit}>{unit}</Text>
            </View>
            <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        color: colors.mutedForeground,
        fontSize: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    value: {
        color: colors.foreground,
        fontSize: 24,
        fontWeight: 'bold',
    },
    unit: {
        color: colors.mutedForeground,
        fontSize: 12,
    },
    indicator: {
        height: 4,
        borderRadius: 2,
        marginTop: 8,
        width: '100%',
    },
});
