import React from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from '@/src/context/ThemeContext';

export default function RootLayout(){
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{headerShown:false,animation:'slide_from_right'}} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
