import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const PrivacyScreen: React.FC = () => {
  const [localOnly, setLocalOnly] = useState(true);
  const [faceId, setFaceId] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [crashReports, setCrashReports] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Privacy Notice */}
        <View style={styles.notice}>
          <Ionicons name="shield-checkmark" size={24} color="#34C759" />
          <Text style={styles.noticeText}>
            Your privacy is our priority. All journal entries are encrypted and stored locally by default.
          </Text>
        </View>

        {/* Data Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA STORAGE</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Local Only Mode</Text>
              <Text style={styles.rowDescription}>Store all data on device only</Text>
            </View>
            <Switch
              value={localOnly}
              onValueChange={setLocalOnly}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>End-to-End Encryption</Text>
              <Text style={styles.rowDescription}>Always enabled for cloud sync</Text>
            </View>
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledText}>ON</Text>
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Face ID / Touch ID</Text>
              <Text style={styles.rowDescription}>Require biometric to open app</Text>
            </View>
            <Switch
              value={faceId}
              onValueChange={setFaceId}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>App Lock Settings</Text>
              <Text style={styles.rowDescription}>Configure auto-lock timing</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANALYTICS & DIAGNOSTICS</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Usage Analytics</Text>
              <Text style={styles.rowDescription}>Help improve VidaAI</Text>
            </View>
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Crash Reports</Text>
              <Text style={styles.rowDescription}>Send anonymous crash data</Text>
            </View>
            <Switch
              value={crashReports}
              onValueChange={setCrashReports}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
          
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowTitle}>Export All Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <Text style={[styles.rowTitle, { color: '#FF3B30' }]}>Delete All Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.legal}>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFF',
    marginBottom: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLeft: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  enabledBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  enabledText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  legal: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
});