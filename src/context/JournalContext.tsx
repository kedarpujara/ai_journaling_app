import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { entriesService } from '../services/entries';
import { Entry } from '../types/journal';

interface JournalContextType {
  entries: Entry[];
  isLoading: boolean;
  refreshEntries: () => Promise<void>;
  createEntry: (data: Partial<Entry>) => Promise<Entry>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedEntries = await entriesService.listEntries();
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Failed to refresh entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (data: Partial<Entry>) => {
    const entry = await entriesService.createEntry(data);
    await refreshEntries();
    return entry;
  }, [refreshEntries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Entry>) => {
    await entriesService.updateEntry(id, updates);
    await refreshEntries();
  }, [refreshEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    await entriesService.deleteEntry(id);
    await refreshEntries();
  }, [refreshEntries]);

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  return (
    <JournalContext.Provider
      value={{
        entries,
        isLoading,
        refreshEntries,
        createEntry,
        updateEntry,
        deleteEntry,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within JournalProvider');
  }
  return context;
}