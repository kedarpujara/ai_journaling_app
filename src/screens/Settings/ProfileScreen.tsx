// Debug version of ProfileScreen to identify the issue

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProfileScreen: React.FC = () => {
  const { profile, user, loading, signOut, testConnection } = useAuth();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('📱 ProfileScreen render:', {
      hasUser: !!user,
      hasProfile: !!profile,
      loading,
      profileData: profile ? {
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name
      } : null
    });
  }, [user, profile, loading]);

  // Force clear everything and sign out
  const forceClearAndSignOut = async () => {
    Alert.alert(
      'Force Clear & Sign Out',
      'This will clear all cached data and sign you out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear Everything',
          style: 'destructive',
          onPress: async () => {
            console.log('🧹 Force clearing everything...');
            try {
              // Clear AsyncStorage
              await AsyncStorage.clear();
              console.log('✅ AsyncStorage cleared');
              
              // Sign out from Supabase
              await supabase.auth.signOut();
              console.log('✅ Supabase signed out');
              
              // Navigate to login
              router.replace('/auth/login');
              console.log('✅ Navigated to login');
            } catch (error) {
              console.error('❌ Force clear error:', error);
              // Still try to navigate
              router.replace('/auth/login');
            }
          }
        }
      ]
    );
  };

  // Show what we're waiting for
  if (loading) {
    console.log('⏸️ ProfileScreen showing loading spinner');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
          <Text style={styles.debugText}>
            User: {user ? '✅' : '❌'} | Profile: {profile ? '✅' : '❌'} | Loading: {loading ? '🔄' : '✅'}
          </Text>
          
          {/* Emergency buttons while loading */}
          <View style={styles.emergencyButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.dangerButton]}
              onPress={forceClearAndSignOut}
            >
              <Text style={styles.buttonText}>🧹 Force Clear & Sign Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                console.log('🚫 User cancelled loading, going back');
                router.back();
              }}
            >
              <Text style={styles.buttonText}>Cancel & Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    console.log('❌ ProfileScreen: No user found');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No user found</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    console.log('❌ ProfileScreen: No profile found');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No profile found</Text>
          <Text style={styles.debugText}>User ID: {user.id}</Text>
          <Text style={styles.debugText}>User Email: {user.email}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log('✅ ProfileScreen: Rendering profile content');
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileCard}>
          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{profile.id}</Text>
          
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{profile.email}</Text>
          
          <Text style={styles.label}>Display Name:</Text>
          <Text style={styles.value}>{profile.display_name || 'Not set'}</Text>
          
          <Text style={styles.label}>Bio:</Text>
          <Text style={styles.value}>{profile.bio || 'Not set'}</Text>
          
          <Text style={styles.label}>Avatar URL:</Text>
          <Text style={styles.value}>{profile.avatar_url || 'Not set'}</Text>
          
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>{profile.created_at}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity 
          style={styles.button}
          onPress={async () => {
            console.log('🔗 Testing connection manually...');
            try {
              await testConnection();
              console.log('✅ Manual connection test passed');
            } catch (error) {
              console.error('❌ Manual connection test failed:', error);
            }
          }}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]}
          onPress={forceClearAndSignOut}
        >
          <Text style={styles.buttonText}>🧹 Force Clear & Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={async () => {
            console.log('🚪 Sign out button pressed');
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('❌ Sign out failed:', error);
            }
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Debug Info */}
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>Loading: {loading ? 'true' : 'false'}</Text>
          <Text style={styles.debugText}>User exists: {user ? 'true' : 'false'}</Text>
          <Text style={styles.debugText}>Profile exists: {profile ? 'true' : 'false'}</Text>
          <Text style={styles.debugText}>User ID: {user?.id}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyButtons: {
    marginTop: 30,
    width: '100%',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});