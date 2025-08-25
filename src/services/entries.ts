import { Entry, GroupedEntries, LocationData, Mood, Tag } from '../types/journal';
import { generateId } from '../utils/id';
import {
    formatDate, startOfMonth, startOfWeek
} from './dates';
import { storageService } from './storage/asyncStorage';

export class EntriesService {
    async createEntry(data: {
      title?: string;
      body?: string;
      mood?: Mood;
      tags?: Tag[];  // Change from string[] to Tag[]
      photoUris?: string[];  // NEW: Support multiple photos
      hasPhotos?: boolean;   // NEW: Flag for quick queries
      locationData?: LocationData;    // NEW: Location data
      audioUri?: string;
      transcription?: string;
      sentiment?: any;       // NEW: AI sentiment
      themes?: string[];     // NEW: AI themes
      date?: string;         // NEW: Custom entry date
      createdAt?: string;    // NEW: Custom creation time
    }): Promise<Entry> {
      console.log('🔧 EntriesService.createEntry called with:', data);
      console.log('🔧 Photos in service:', data.photoUris);
      console.log('🔧 Location in service:', data.locationData);
  
      const now = new Date();
      const entry: Entry = {
        id: generateId(),
        createdAt: data.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
        date: data.date || formatDate(now),
        title: data.title?.trim(),
        body: data.body?.trim(),
        mood: data.mood,
        tags: data.tags || [],  // Already Tag[] format
        
        // NEW: Photos support
        photoUris: data.photoUris || [],
        hasPhotos: data.hasPhotos || (data.photoUris?.length || 0) > 0,
        
        // NEW: Location support
        locationData: data.locationData,
        
        // Existing fields
        audioUri: data.audioUri,
        transcription: data.transcription,
        deleted: false,
      };
  
      console.log('🔧 Created entry object:', entry);
      console.log('🔧 Photos in entry:', entry.photoUris);
      console.log('🔧 Location in entry:', entry.locationData);
  
      await storageService.addEntry(entry);
      console.log('🔧 Entry saved to storage');
      
      // Verify it was saved correctly
      const savedEntry = await storageService.getEntry(entry.id);
      console.log('🔧 Verified saved entry:', savedEntry);
      console.log('🔧 Photos in saved entry:', savedEntry?.photoUris);
      console.log('🔧 Location in saved entry:', savedEntry?.locationData);
      
      return entry;
    }

    async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null> {
        const entry = await storageService.getEntry(id);
        if (!entry) return null;
    
        const updated: Entry = {
          ...entry,
          ...updates,
          id: entry.id, // Prevent ID change
          createdAt: entry.createdAt, // Preserve creation date
          updatedAt: new Date().toISOString(),
          
          // Handle photo updates
          hasPhotos: updates.photoUris ? updates.photoUris.length > 0 : entry.hasPhotos,
        };
    
        await storageService.updateEntry(updated);
        return updated;
      }

    async deleteEntry(id: string): Promise<void> {
        await storageService.deleteEntry(id);
    }

    async getEntry(id: string): Promise<Entry | null> {
        return storageService.getEntry(id);
    }

    async listEntries(): Promise<Entry[]> {
        const entries = await storageService.listEntries();
        // Sort by date DESC, then by createdAt DESC
        return entries.sort((a, b) => {
            if (a.date !== b.date) {
                return b.date.localeCompare(a.date);
            }
            return b.createdAt.localeCompare(a.createdAt);
        });
    }

    async listByDateRange(startDate: Date, endDate: Date): Promise<Entry[]> {
        return storageService.listByDateRange(
            formatDate(startDate),
            formatDate(endDate)
        );
    }

    async searchEntries(query: string): Promise<Entry[]> {
        if (!query.trim()) return this.listEntries();
        return storageService.searchEntries(query);
    }

    async groupEntriesByDay(): Promise<GroupedEntries> {
        const entries = await this.listEntries();
        const grouped: GroupedEntries = {};

        entries.forEach(entry => {
            const date = entry.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });

        return grouped;
    }

    async groupEntriesByWeek(): Promise<GroupedEntries> {
        const entries = await this.listEntries();
        const grouped: GroupedEntries = {};

        entries.forEach(entry => {
            const weekStart = formatDate(startOfWeek(new Date(entry.date)));
            if (!grouped[weekStart]) {
                grouped[weekStart] = [];
            }
            grouped[weekStart].push(entry);
        });

        return grouped;
    }

    async groupEntriesByMonth(): Promise<GroupedEntries> {
        const entries = await this.listEntries();
        const grouped: GroupedEntries = {};

        entries.forEach(entry => {
            const monthStart = formatDate(startOfMonth(new Date(entry.date)));
            if (!grouped[monthStart]) {
                grouped[monthStart] = [];
            }
            grouped[monthStart].push(entry);
        });

        return grouped;
    }

    async getStats() {
        const entries = await this.listEntries();
        const totalEntries = entries.length;
        const avgMood = entries.reduce((sum, e) => sum + (e.mood || 3), 0) / totalEntries;

        // Get top tags
        const tagCounts = new Map<string, number>();
        entries.forEach(entry => {
            entry.tags.forEach(tag => {
                tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
            });
        });

        const topTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        return {
            totalEntries,
            avgMood: Math.round(avgMood * 10) / 10,
            topTags,
        };
    }
}

export const entriesService = new EntriesService();