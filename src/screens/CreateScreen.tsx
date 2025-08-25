import { generateId } from '@/utils/id';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native';
import EntryEditor from '../components/EntryEditor';
import EntryPreview from '../components/EntryPreview';
import RecordButton from '../components/RecordButton';
import { theme } from '../constants/theme';
import { useJournal } from '../context/JournalContext';
import { analyzeEntryWithAI } from '../services/aiAnalyzer';
import { getCurrentLocation, LocationData } from '../services/locationService';
import { transcribeAudio } from '../services/transcription';
import { Mood } from '../types/journal';
import { formatTime } from '../utils/format';

export interface EntryData {
  content: string;
  title: string;
  mood?: Mood;
  photoUris: string[];
  location?: LocationData;
  entryDate: Date;
}

export default function CreateScreen() {
  const router = useRouter();
  const { createEntry } = useJournal();

  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Entry state
  const [entryData, setEntryData] = useState<EntryData>({
    content: '',
    title: '',
    mood: undefined,
    photoUris: [],
    location: undefined,
    entryDate: new Date(),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const hasContent = entryData.content.trim().length > 0 ||
    entryData.title.trim().length > 0 ||
    entryData.photoUris.length > 0;

  // Animation
  const previewOpacity = useRef(new Animated.Value(0)).current;

  // Bottom sheet ref
  const editorSheetRef = useRef<BottomSheet>(null);

  // Timer for recording duration
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Animate preview visibility
  useEffect(() => {
    Animated.timing(previewOpacity, {
      toValue: hasContent ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [hasContent, previewOpacity]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = recording.getURI();

      if (uri) {
        setIsTranscribing(true);
        editorSheetRef.current?.snapToIndex(1);

        try {
          const text = await transcribeAudio(uri);

          setEntryData(prev => ({
            ...prev,
            content: prev.content ? `${prev.content}\n\n${text}` : text,
          }));
        } catch (error) {
          console.error('Transcription failed:', error);
          Alert.alert(
            'Transcription Failed',
            'Unable to transcribe audio. You can type your entry manually.',
            [{ text: 'OK' }]
          );
        } finally {
          setIsTranscribing(false);
        }
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);

      // ✅ FIXED: Use functional update to get latest state
      setEntryData(prev => {
        const updatedPhotos = [...prev.photoUris, ...newPhotos].slice(0, 5);
        console.log('📸 PICK - Previous photos:', prev.photoUris);
        console.log('📸 PICK - New photos from picker:', newPhotos);
        console.log('📸 PICK - Final updated array:', updatedPhotos);
        return {
          ...prev,
          photoUris: updatedPhotos,
        };
      });
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotoUri = result.assets[0].uri;

      // ✅ FIXED: Use functional update and proper logging
      setEntryData(prev => {
        const updatedPhotos = [...prev.photoUris, newPhotoUri].slice(0, 5);
        console.log('📸 CAMERA - Previous photos:', prev.photoUris);
        console.log('📸 CAMERA - New photo:', newPhotoUri);
        console.log('📸 CAMERA - Final updated array:', updatedPhotos);
        return {
          ...prev,
          photoUris: updatedPhotos,
        };
      });
    }
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setEntryData(prev => ({ ...prev, location }));
      } else {
        Alert.alert('Location', 'Unable to get location. Please check permissions.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleRemoveLocation = () => {
    setEntryData(prev => ({ ...prev, location: undefined }));
  };

  const handleRemovePhoto = (index: number) => {
    setEntryData(prev => ({
      ...prev,
      photos: prev.photoUris.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const content = entryData.content.trim();

    if (!content && !entryData.title.trim() && entryData.photoUris.length === 0) {
      Alert.alert('Empty Entry', 'Please add some content to save.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('🚀 STARTING SAVE PROCESS');
      console.log('📸 Photos to save:', entryData.photoUris);
      console.log('📍 Location to save:', entryData.location);

      // Use AI to generate title and tags
      const aiAnalysis = await analyzeEntryWithAI(
        content,
        entryData.mood,
        entryData.photoUris.length > 0,
        entryData.location
      );

      console.log('🤖 AI analysis completed:', aiAnalysis);

      // Use AI title or user's title
      const finalTitle = entryData.title.trim() || aiAnalysis.title;

      // Format date as YYYY-MM-DD
      const entryDateString = entryData.entryDate.toISOString().split('T')[0];

      const formattedTags = aiAnalysis.tags?.map((tagName: string) => ({
        id: generateId(),
        name: tagName.toLowerCase().trim(),
      })) || [];

      // CORRECTED: Match the EntriesService interface
      const entryPayload = {
        title: finalTitle,
        body: content,
        mood: entryData.mood,
        tags: formattedTags,

        // NEW: Photos and location
        photoUris: entryData.photoUris,
        hasPhotos: entryData.photoUris.length > 0,
        locationData: entryData.location,

        // AI analysis data
        sentiment: aiAnalysis.sentiment,
        themes: aiAnalysis.themes,

        // Dates
        date: entryDateString,
        createdAt: entryData.entryDate.toISOString(),
      };

      console.log('💾 ENTRY PAYLOAD:', JSON.stringify(entryPayload, null, 2));

      // Save entry
      const savedEntry = await createEntry(entryPayload);
      console.log('✅ Entry saved successfully:', savedEntry);

      // Verify photos and location were saved
      if (savedEntry.photoUris && savedEntry.photoUris.length > 0) {
        console.log('📸 ✅ Photos were saved:', savedEntry.photoUris);
      } else {
        console.log('📸 ❌ NO PHOTOS in saved entry!');
      }

      if (savedEntry.locationData) {
        console.log('📍 ✅ Location was saved:', savedEntry.locationData);
      } else {
        console.log('📍 ❌ NO LOCATION in saved entry!');
      }

      // Reset form
      setEntryData({
        content: '',
        title: '',
        mood: undefined,
        photoUris: [],
        location: undefined,
        entryDate: new Date()
      });
      editorSheetRef.current?.close();

      Alert.alert('Success', 'Entry saved!', [
        { text: 'View', onPress: () => router.push('/history') },
        { text: 'New Entry', onPress: () => { } },
      ]);
    } catch (error) {
      console.error('💥 SAVE ERROR:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const testSave = async () => {
    const testPayload = {
      title: 'Test Entry with Photos',
      body: 'Testing photo and location save',
      photoUris: ['test-photo-1.jpg', 'test-photo-2.jpg'],
      hasPhotos: true,
      locationData: {
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        address: {
          formattedAddress: '123 Test St, San Francisco, CA',
          street: '123 Test St',
          city: 'San Francisco',
          region: 'CA',
          country: 'USA',
        },
        place: {
          name: 'Test Restaurant',
          category: 'Restaurant',
        },
        timestamp: new Date().toISOString(),
      },
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      tags: [],
    };

    try {
      console.log('🧪 TEST SAVE:', testPayload);
      const result = await createEntry(testPayload);
      console.log('🧪 TEST RESULT:', result);
      Alert.alert('Test Result', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('🧪 TEST ERROR:', error);
      Alert.alert('Test Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.timeText}>{formatTime(new Date())}</Text>
        </View>

        {/* Entry Preview (shows when there's content) */}
        {hasContent && (
          <EntryPreview
            title={entryData.title}
            content={entryData.content}
            photoCount={entryData.photoUris.length}
            location={entryData.location}
            opacity={previewOpacity}
            onPress={() => editorSheetRef.current?.snapToIndex(1)}
          />
        )}

        {/* Record Button */}
        <RecordButton
          isRecording={isRecording}
          duration={recordingDuration}
          onStart={startRecording}
          onStop={stopRecording}
          formatDuration={formatDuration}
        />

        {/* Prompt Text */}
        {!isRecording && !hasContent && (
          <Text style={styles.promptText}>
            Tap to start recording your thoughts
          </Text>
        )}

        {/* Simple Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => editorSheetRef.current?.snapToIndex(1)}
          >
            <Ionicons name="text-outline" size={24} color={theme.colors.text} />
            <Text style={styles.actionLabel}>Write</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => router.push('/history')}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.text} />
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Entry Editor Bottom Sheet */}
      <EntryEditor
        ref={editorSheetRef}
        entryData={entryData}
        onUpdateEntry={setEntryData}
        onSave={handleSave}
        onPickImage={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onRemovePhoto={handleRemovePhoto}
        onGetLocation={handleGetLocation}
        onRemoveLocation={handleRemoveLocation}
        isGettingLocation={isGettingLocation}
        isSaving={isSaving}
        isTranscribing={isTranscribing}
        hasContent={hasContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  dateHeader: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  dateText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  promptText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xxxl,
    marginTop: theme.spacing.xl,
  },
  action: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  actionLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});