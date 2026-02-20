import { create } from 'zustand';
import type { WatchParty, WatchPartySyncEvent, ChatMessage } from '@/types';

interface WatchPartyState {
  party: WatchParty | null;
  isHost: boolean;
  isReady: boolean;
  chatMessages: ChatMessage[];
  syncEvents: WatchPartySyncEvent[];

  setParty: (party: WatchParty | null) => void;
  setIsHost: (isHost: boolean) => void;
  setIsReady: (isReady: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  addSyncEvent: (event: WatchPartySyncEvent) => void;
  clearSyncEvents: () => void;
  updatePartyState: (updates: Partial<WatchParty>) => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  party: null,
  isHost: false,
  isReady: false,
  chatMessages: [],
  syncEvents: [],

  setParty: (party) => set({ party }),

  setIsHost: (isHost) => set({ isHost }),

  setIsReady: (isReady) => set({ isReady }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-199), message],
    })),

  addSyncEvent: (event) =>
    set((state) => ({
      syncEvents: [...state.syncEvents.slice(-49), event],
    })),

  clearSyncEvents: () => set({ syncEvents: [] }),

  updatePartyState: (updates) =>
    set((state) => ({
      party: state.party ? { ...state.party, ...updates } : null,
    })),
}));
