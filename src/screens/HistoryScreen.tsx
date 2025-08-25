import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, FlatList,
    RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import EntryListItem from '../components/EntryListItem';
import SegmentedControl from '../components/SegmentedControl';
import { theme } from '../constants/theme';
import { useJournal } from '../context/JournalContext';
import { entriesService } from '../services/entries';
import { Entry, GroupedEntries, ViewMode } from '../types/journal';
import { formatDisplayDate } from '../utils/format';

export default function HistoryScreen() {
  const router = useRouter();
  const { entries, isLoading, refreshEntries, deleteEntry } = useJournal();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroupedEntries();
  }, [entries, viewMode]);

  const loadGroupedEntries = async () => {
    let grouped: GroupedEntries = {};
    
    switch (viewMode) {
      case 'day':
        grouped = await entriesService.groupEntriesByDay();
        break;
      case 'week':
        grouped = await entriesService.groupEntriesByWeek();
        break;
      case 'month':
        grouped = await entriesService.groupEntriesByMonth();
        break;
    }
    
    setGroupedEntries(grouped);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshEntries();
    setRefreshing(false);
  }, [refreshEntries]);

  const handleEntryPress = (entry: Entry) => {
    router.push(`/entry/${entry.id}`);
  };

  const handleEntryDelete = (entry: Entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(entry.id);
          },
        },
      ]
    );
  };

  const renderDayView = () => {
    if (entries.length === 0) {
      return (
        <EmptyState
          icon="book-outline"
          title="No entries yet"
          message="Start journaling to see your thoughts here"
          actionLabel="Create Entry"
          onAction={() => router.push('/')}
        />
      );
    }

    return (
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryListItem
            entry={item}
            onPress={() => handleEntryPress(item)}
            onDelete={() => handleEntryDelete(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    );
  };

  const renderWeekView = () => {
    const weeks = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));
    
    if (weeks.length === 0) {
      return (
        <EmptyState
          icon="calendar-outline"
          title="No weekly data"
          message="Create entries to see weekly summaries"
        />
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {weeks.map((weekStart) => {
          const weekEntries = groupedEntries[weekStart];
          const avgMood = weekEntries.reduce((sum, e) => sum + (e.mood || 3), 0) / weekEntries.length;
          
          // Get top tags for the week
          const tagCounts = new Map<string, number>();
          weekEntries.forEach(entry => {
            entry.tags.forEach(tag => {
              tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
            });
          });
          const topTag = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0];

          return (
            <Card key={weekStart} style={styles.weekCard}>
              <Text style={styles.weekTitle}>
                Week of {formatDisplayDate(weekStart)}
              </Text>
              <View style={styles.weekStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{weekEntries.length}</Text>
                  <Text style={styles.statLabel}>Entries</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{avgMood.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Avg Mood</Text>
                </View>
                {topTag && (
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>#{topTag}</Text>
                    <Text style={styles.statLabel}>Top Tag</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.weekViewMore}
                onPress={() => {
                  // Could expand to show all entries for this week
                  Alert.alert('Week Details', `${weekEntries.length} entries this week`);
                }}
              >
                <Text style={styles.viewMoreText}>View Entries →</Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>
    );
  };

  const renderMonthView = () => {
    const months = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));
    
    if (months.length === 0) {
      return (
        <EmptyState
          icon="calendar-outline"
          title="No monthly data"
          message="Create entries to see monthly summaries"
        />
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {months.map((monthStart) => {
          const monthEntries = groupedEntries[monthStart];
          const date = new Date(monthStart);
          const monthName = date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          });

          // Create a simple calendar view
          const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
          
          // Map entries by day of month
          const entriesByDay = new Map<number, Entry[]>();
          monthEntries.forEach(entry => {
            const day = new Date(entry.date).getDate();
            if (!entriesByDay.has(day)) {
              entriesByDay.set(day, []);
            }
            entriesByDay.get(day)!.push(entry);
          });

          return (
            <Card key={monthStart} style={styles.monthCard}>
              <Text style={styles.monthTitle}>{monthName}</Text>
              
              <View style={styles.calendarGrid}>
                {/* Day labels */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Text key={i} style={styles.dayLabel}>{day}</Text>
                ))}
                
                {/* Empty cells for alignment */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}
                
                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEntries = entriesByDay.get(day) || [];
                  const hasEntries = dayEntries.length > 0;
                  const avgMood = hasEntries
                    ? dayEntries.reduce((sum, e) => sum + (e.mood || 3), 0) / dayEntries.length
                    : 0;

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        hasEntries && styles.dayCellActive,
                      ]}
                      onPress={() => {
                        if (hasEntries) {
                          Alert.alert(
                            `${monthName} ${day}`,
                            `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`
                          );
                        }
                      }}
                    >
                      <Text style={[
                        styles.dayNumber,
                        hasEntries && styles.dayNumberActive,
                      ]}>
                        {day}
                      </Text>
                      {hasEntries && (
                        <View 
                          style={[
                            styles.dayDot,
                            { backgroundColor: getMoodColor(Math.round(avgMood)) }
                          ]} 
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <View style={styles.monthStats}>
                <Text style={styles.monthStatText}>
                  {monthEntries.length} entries this month
                </Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    );
  };

  const getMoodColor = (mood: number): string => {
    const colors = [
      theme.colors.mood1,
      theme.colors.mood2,
      theme.colors.mood3,
      theme.colors.mood4,
      theme.colors.mood5,
    ];
    return colors[Math.min(Math.max(mood - 1, 0), 4)];
  };

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={['Day', 'Week', 'Month']}
        selectedIndex={viewMode === 'day' ? 0 : viewMode === 'week' ? 1 : 2}
        onChange={(index) => {
          const modes: ViewMode[] = ['day', 'week', 'month'];
          setViewMode(modes[index]);
        }}
        style={styles.segmentedControl}
      />
      
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentedControl: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  
  // Week view styles
  weekCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  weekTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  weekViewMore: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  viewMoreText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  
  // Month view styles
  monthCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  monthTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.lg,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    ...theme.typography.caption,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
  },
  dayCellActive: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
  },
  dayNumber: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  dayNumberActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  monthStats: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  monthStatText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});