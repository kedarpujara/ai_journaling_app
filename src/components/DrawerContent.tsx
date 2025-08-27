import { useAuth } from '@/context/AuthContext';
import { useJournalStats } from '@/hooks/useJournalStats';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  badge?: string;
  separator?: boolean;
}

const menuItems: MenuItem[] = [
  // Profile Section
  { id: 'profile', label: 'Profile', icon: 'person-circle-outline', route: '/settings/profile' },
  
  // Main Settings
  { id: 'sep1', separator: true, label: '', icon: 'cube' },
  { id: 'general', label: 'General', icon: 'settings-outline', route: '/settings/general' },
  { id: 'privacy', label: 'Privacy & Security', icon: 'lock-closed-outline', route: '/settings/privacy' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: '/settings/notifications' },
  
  // Data Management
  { id: 'sep2', separator: true, label: '', icon: 'cube' },
  { id: 'backup', label: 'Backup & Sync', icon: 'cloud-outline', route: '/settings/backup' },
  { id: 'export', label: 'Export Data', icon: 'download-outline', route: '/settings/export' },
  { id: 'storage', label: 'Storage', icon: 'folder-outline', route: '/settings/storage' },
  
  // Account & Billing
  { id: 'sep3', separator: true, label: '', icon: 'cube' },
  { id: 'billing', label: 'Billing', icon: 'card-outline', route: '/settings/billing', badge: 'PRO' },
  { id: 'subscription', label: 'Subscription', icon: 'star-outline', route: '/settings/subscription' },
  
  // Support
  { id: 'sep4', separator: true, label: '', icon: 'cube' },
  { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: '/settings/help' },
  { id: 'about', label: 'About VidaAI', icon: 'information-circle-outline', route: '/settings/about' },
];

export const DrawerContent: React.FC<any> = (props) => {
  const router = useRouter();  
  const { profile } = useAuth();
  const stats = useJournalStats();

  const handleItemPress = (route?: string) => {
    if (route) {
      router.push(route as any);
      props.navigation.closeDrawer();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props} scrollEnabled={true}>
        {/* Header with User Info */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ 
                uri: profile?.avatar_url || 
                `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=007AFF&color=fff&size=80` 
              }} 
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || ''}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalEntries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalDays}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => {
            if (item.separator) {
              return <View key={item.id} style={styles.separator} />;
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemPress(item.route)}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={22} color="#666" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>VidaAI v1.0.0</Text>
          <TouchableOpacity onPress={() => handleItemPress('/settings/privacy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingTop: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 8,
    backgroundColor: '#F2F2F7',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#007AFF',
  },
});