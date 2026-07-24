import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { colors, chartColors } from '../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function AirQualityGauge({ pm25, pm10 }) {
    const calculateAQI = (pm) => {
        if (pm <= 12) return Math.round((50 / 12) * pm);
        if (pm <= 35.4) return Math.round(50 + ((100 - 50) / (35.4 - 12.1)) * (pm - 12.1));
        if (pm <= 55.4) return Math.round(100 + ((150 - 100) / (55.4 - 35.5)) * (pm - 35.5));
        return Math.round(150 + ((200 - 150) / (150.4 - 55.5)) * (pm - 55.5));
    };

    const aqi = calculateAQI(pm25);
    const maxAQI = 200;
    const percentage = Math.min((aqi / maxAQI) * 100, 100);

    const getColor = (value) => {
        if (value <= 50) return chartColors.good;
        if (value <= 100) return chartColors.moderate;
        if (value <= 150) return chartColors.unhealthy;
        return chartColors.bad;
    };

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    // Arc logic: we want to show only part of the circle.
    // Original specific: d="M 30 130 A 70 70 0 0 1 170 130"
    // This is roughly a 220 degree arc at the top.
    // Simplified for React Native: Use strokeDashoffset.

    // Actually, porting the path d exactly is easier since react-native-svg supports it.
    const pathD = "M 30 130 A 70 70 0 0 1 170 130";
    // The length of this arc segment needs to be estimated or measured if we want to animate it perfectly along the path.
    // Or we can just calculate strokeDashoffset based on the circle percentage if it was a full circle?
    // Let's stick to the visual look. The original uses strokeDasharray/offset to fill it.

    // Improved Approach for Gauge:
    // Draw Background Arc
    // Draw Foreground Arc on top with strokeDashoffset

    // Since it's an arc, full length is not 2*PI*R.
    // R=70. Start (30,130), End (170,130). Center approx (100, X).
    // Distance 30 to 170 is 140 = 2*R. So it is a semi-circle?
    // If diameter is 140, radius is 70.
    // Center is (100, 130).
    // Start (30, 130) is left. End (170, 130) is right.
    // "0 0 1" -> Large arc flag 0, Sweep flag 1 (clockwise).
    // It goes Up and Over. It is a semi-circle.
    // Length of semi-circle = PI * R = 3.14159 * 70 ≈ 220.

    const arcLength = Math.PI * 70;
    const strokeDashoffset = useSharedValue(arcLength);

    useEffect(() => {
        const targetOffset = arcLength - (percentage / 100) * arcLength;
        strokeDashoffset.value = withTiming(targetOffset, { duration: 1000 });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: strokeDashoffset.value,
    }));

    const currentColor = getColor(aqi);

    return (
        <View style={styles.container}>
            <View style={styles.gaugeContainer}>
                <Svg width="200" height="150" viewBox="0 0 200 150">
                    <Path
                        d={pathD}
                        fill="none"
                        stroke={colors.secondary}
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    <AnimatedPath
                        d={pathD}
                        fill="none"
                        stroke={currentColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={arcLength}
                        animatedProps={animatedProps}
                    />
                </Svg>
                <View style={styles.centerContent}>
                    <Text style={[styles.aqiValue, { color: currentColor }]}>{aqi}</Text>
                    <Text style={styles.aqiLabel}>AQI</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{pm25.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>PM2.5</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{pm10.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>PM10</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 24,
    },
    gaugeContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        position: 'absolute',
        top: 75, // Approximate center manually adjusted
        alignItems: 'center',
    },
    aqiValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    aqiLabel: {
        color: colors.mutedForeground,
        fontSize: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginTop: -20, // Pull up closer to the gauge
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: colors.foreground,
        fontSize: 18,
        fontWeight: '600',
    },
    statLabel: {
        color: colors.mutedForeground,
        fontSize: 12,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
    },
});
