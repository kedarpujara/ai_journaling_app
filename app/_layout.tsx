// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Tabs } from 'expo-router';
// import { StyleSheet, View } from 'react-native';
// import { JournalProvider } from '../src/context/JournalContext';

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { JournalProvider } from '../src/context/JournalContext';



export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <JournalProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="entry/[id]" 
          options={{ 
            title: 'Entry Details',
            presentation: 'modal',
            headerShown: true,
          }} 
        />
      </Stack>
    </JournalProvider>
    </GestureHandlerRootView>
  );
}
