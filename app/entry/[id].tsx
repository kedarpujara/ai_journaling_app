import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { theme } from '../../src/constants/theme';
import { useJournal } from '../../src/context/JournalContext';
import { Entry } from '../../src/types/journal';
import { formatDisplayDate, formatTime } from '../../src/utils/format';

export default function EntryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { entries, deleteEntry } = useJournal();
    const [entry, setEntry] = useState<Entry | null>(null);

    useEffect(() => {
        const foundEntry = entries.find(e => e.id === id);
        setEntry(foundEntry || null);

        // 🐛 DEBUG: Log the entry to see what data is available
        if (foundEntry) {
            console.log('📄 ENTRY DETAIL - Full entry:', foundEntry);
            console.log('📸 ENTRY DETAIL - Photos:', foundEntry.photoUris);
            console.log('📍 ENTRY DETAIL - Location:', foundEntry.locationData);
            console.log('🏷️ ENTRY DETAIL - Tags:', foundEntry.tags);
        }
    }, [id, entries]);

    const handleDelete = () => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (entry) {
                            await deleteEntry(entry.id);
                            router.back();
                        }
                    },
                },
            ]
        );
    };

    const getMoodEmoji = (mood: number): string => {
        const emojis = ['😔', '😕', '😐', '🙂', '😊'];
        return emojis[Math.min(Math.max(mood - 1, 0), 4)];
    };

    if (!entry) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Entry not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.date}>{formatDisplayDate(entry.createdAt)}</Text>
                    <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={24} color={theme.colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            {entry.title && (
                <Text style={styles.title}>{entry.title}</Text>
            )}

            {entry.mood && (
                <View style={styles.moodContainer}>
                    <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                    <Text style={styles.moodText}>Mood: {entry.mood}/5</Text>
                </View>
            )}

            {/* Content Section - MOVED UP */}
            {entry.body && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Content</Text>
                    <View style={styles.bodyContainer}>
                        <Text style={styles.body}>{entry.body}</Text>
                    </View>
                </View>
            )}

            {/* Photos Section */}
            {entry.photoUris && entry.photoUris.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.photosScroll}
                    >
                        {entry.photoUris.map((photoUri, index) => (
                            <TouchableOpacity key={`detail-photo-${index}`} activeOpacity={0.8}>
                                <Image
                                    source={{ uri: photoUri }}
                                    style={styles.photo}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Minimal Location Section - Just icon and city */}
            {entry.locationData && (
                <View style={styles.locationSection}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.locationText}>
                        {entry.locationData.place?.name ||
                            entry.locationData.address?.city ||
                            'Unknown Location'}
                    </Text>
                </View>
            )}

            {/* Tags Section */}
            {entry.tags && entry.tags.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                        {entry.tags.map((tag, index) => (
                            <View
                                key={`detail-${entry.id}-tag-${index}-${tag.name || tag.id || 'unknown'}`}  // ✅ FIXED: Unique key
                                style={styles.tag}
                            >
                                <Text style={styles.tagText}>#{tag.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
    },
    errorText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
    },
    date: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '600',
    },
    time: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    actionButton: {
        padding: theme.spacing.sm,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
    },
    moodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    moodEmoji: {
        fontSize: 32,
    },
    moodText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },

    // NEW: Section styling
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },

    // NEW: Photos styling
    photosScroll: {
        marginHorizontal: -theme.spacing.sm,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: theme.radius.md,
        marginHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        // Add shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    // NEW: Minimal location styling
    locationSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    locationText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },

    // UPDATE: Better tags styling
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    tag: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20', // 20% opacity
    },
    tagText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '500',
    },

    // UPDATE: Content styling
    bodyContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    body: {
        ...theme.typography.body,
        color: theme.colors.text,
        lineHeight: 24,
    },
});
