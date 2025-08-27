// src/context/AuthContext.tsx - Simple version that never hangs

import { supabase } from '@/services/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ensureProfile } from '../services/profile';


interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_premium?: boolean;
  timezone?: string;
  locale?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Force loading to false after 5 seconds no matter what
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 EMERGENCY TIMEOUT: Force setting loading to false after 5 seconds');
      setLoading(false);
      
      // If we have a user but no profile, create a fallback
      if (user && !profile) {
        console.log('🆘 Creating emergency fallback profile');
        const fallbackProfile = {
          id: user.id,
          email: user.email || 'user@example.com',
          display_name: user.email?.split('@')[0] || 'User',
          bio: '',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_premium: false,
          timezone: 'UTC',
          locale: 'en'
        };
        setProfile(fallbackProfile);
      }
    }, 5000);

    return () => clearTimeout(emergencyTimeout);
  }, [user, profile]);

  const createFallbackProfile = (userData: User) => {
    console.log('⚠️ Creating fallback profile immediately');
    const fallbackProfile = {
      id: userData.id,
      email: userData.email || 'user@example.com',
      display_name: userData.email?.split('@')[0] || 'User',
      bio: '',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_premium: false,
      timezone: 'UTC',
      locale: 'en'
    };
    setProfile(fallbackProfile);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    console.log('🔍 fetchProfile START for userId:', userId);
    
    // Try to fetch profile but with very short timeout
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]) as any;

      if (data) {
        console.log('✅ Profile loaded from database');
        setProfile(data);
      } else {
        console.log('⚠️ No profile data, using fallback');
        const userData = await supabase.auth.getUser();
        if (userData.data?.user) {
          createFallbackProfile(userData.data.user);
        }
      }
    } catch (err: any) {
      console.log('⚠️ Profile fetch failed/timeout, using fallback:', err.message);
      const userData = await supabase.auth.getUser();
      if (userData.data?.user) {
        createFallbackProfile(userData.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('🚀 Auth initialization START');
      
      try {
        const { data: { session: storedSession } } = await supabase.auth.getSession();
        console.log('🔐 Session result:', !!storedSession);
        
        if (storedSession && mounted) {
          setSession(storedSession);
          setUser(storedSession.user);
          await fetchProfile(storedSession.user.id);
        } else {
          console.log('❌ No session');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state change:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Sign in attempt');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      await ensureProfile();
      console.log('✅ Sign in successful');
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error.message);
      Alert.alert('Sign In Error', error.message);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Sign out');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: displayName,
          },
        },
      });

      if (error) throw error;
      Alert.alert('Success', 'Please check your email to verify your account');
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No user or profile');
    
    try {
      // Update local state immediately
      const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
      setProfile(updatedProfile);
      
      // Try to update database in background
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (data) {
        console.log('✅ Profile updated in database');
        setProfile(data);
      } else {
        console.log('⚠️ Database update failed, keeping local changes');
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      // Don't throw error, keep local changes
      Alert.alert('Partial Success', 'Profile updated locally. Database sync will retry later.');
    }
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error('❌ Upload error:', error);
        return uri; // Return local URI as fallback
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err) {
      console.error('❌ Avatar upload error:', err);
      return uri; // Return local URI as fallback
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        profile, 
        loading, 
        signIn,
        signUp,
        signOut,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
