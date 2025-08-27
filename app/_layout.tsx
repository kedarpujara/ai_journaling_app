// app/_layout.tsx - Complete working navigation

import { DrawerContent } from '@/components/DrawerContent';
import { HamburgerButton } from '@/components/HamburgerButton';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { JournalProvider } from '@/context/JournalContext';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../src/lib/supabaseClient';
import { ensureProfile } from '../src/services/profile';

function AuthenticatedDrawer() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) ensureProfile();
    });

    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    console.log('🔐 Navigation check:', { 
      user: !!user, 
      loading, 
      inAuthGroup, 
      segments,
      currentPath: `/${segments.join('/')}`
    });

    if (!user && !inAuthGroup) {
      console.log('➡️ No user, redirecting to login');
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      console.log('➡️ User logged in, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right',
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
        headerRight: () => <HamburgerButton />,
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      {/* Main tab screens */}
      <Drawer.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          drawerItemStyle: { display: 'none' }
        }} 
      />
      
      {/* Auth screens */}
      <Drawer.Screen 
        name="auth" 
        options={{ 
          headerShown: false,
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false,
        }} 
      />
      
      {/* Profile screen */}
      <Drawer.Screen 
        name="profile" 
        options={{ 
          headerShown: false,
          drawerItemStyle: { display: 'none' }
        }} 
      />
      
      {/* Settings screens */}
      <Drawer.Screen 
        name="settings" 
        options={{ 
          headerShown: false,
          drawerItemStyle: { display: 'none' }
        }} 
      />
      
      {/* Catch-all for any other routes */}
      <Drawer.Screen 
        name="[...missing]" 
        options={{ 
          headerShown: false,
          drawerItemStyle: { display: 'none' }
        }} 
      />
    </Drawer>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <JournalProvider>
          <AuthenticatedDrawer />
        </JournalProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}