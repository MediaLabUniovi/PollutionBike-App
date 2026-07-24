import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/colors';

export function BatteryIndicator({ level }) {
    const getColor = () => {
        if (level <= 20) return colors.destructive;
        if (level <= 50) return colors.warning;
        return colors.success;
    };

    return (
        <View style={{
            width: 24,
            height: 12,
            borderWidth: 1,
            borderColor: colors.mutedForeground,
            borderRadius: 3,
            padding: 1,
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            <View style={{
                width: `${Math.max(5, Math.min(100, level))}%`,
                height: '100%',
                backgroundColor: getColor(),
                borderRadius: 1,
            }} />
            <View style={{
                position: 'absolute',
                right: -3,
                top: 3,
                width: 2,
                height: 4,
                backgroundColor: colors.mutedForeground,
                borderRadius: 1,
            }} />
        </View>
    );
}
