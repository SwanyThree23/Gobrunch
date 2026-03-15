import { create } from 'zustand';
import type { WatchParty, WatchPartySyncEvent, ChatMessage, OpenRouterMessage, AIModel } from '@/types';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface WatchPartyState {
  party: WatchParty | null;
  isHost: boolean;
  isReady: boolean;
  chatMessages: ChatMessage[];
  syncEvents: WatchPartySyncEvent[];
  aiMessages: AIMessage[];
  aiLoading: boolean;
  aiModel: AIModel;

  setParty: (party: WatchParty | null) => void;
  setIsHost: (isHost: boolean) => void;
  setIsReady: (isReady: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  addSyncEvent: (event: WatchPartySyncEvent) => void;
  clearSyncEvents: () => void;
  updatePartyState: (updates: Partial<WatchParty>) => void;
  addAIMessage: (message: AIMessage) => void;
  setAILoading: (loading: boolean) => void;
  setAIModel: (model: AIModel) => void;
  clearAIMessages: () => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  party: null,
  isHost: false,
  isReady: false,
  chatMessages: [],
  syncEvents: [],
  aiMessages: [],
  aiLoading: false,
  aiModel: 'openai/gpt-4o',

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

  addAIMessage: (message) =>
    set((state) => ({
      aiMessages: [...state.aiMessages.slice(-99), message],
    })),

  setAILoading: (aiLoading) => set({ aiLoading }),

  setAIModel: (aiModel) => set({ aiModel }),

  clearAIMessages: () => set({ aiMessages: [] }),
}));
