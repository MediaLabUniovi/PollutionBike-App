import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { BLEProvider } from './src/context/BLEContext';
import { LogBox } from 'react-native';

// Ignore specific warnings if needed (e.g. valid cycles in BLE)
LogBox.ignoreLogs(['new NativeEventEmitter']);

import { StatusBar } from 'expo-status-bar';

import { colors } from './src/theme/colors';

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <BLEProvider>
        <NavigationContainer theme={MyDarkTheme}>
          <StatusBar style="light" backgroundColor={colors.background} translucent={false} />
          <AppNavigator />
        </NavigationContainer>
      </BLEProvider>
    </SafeAreaProvider>
  );
}
