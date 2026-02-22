import { create } from 'zustand';
import type { Room, ChatMessage } from '@/types';

interface RoomState {
  currentRoom: Room | null;
  rooms: Room[];
  chatMessages: ChatMessage[];
  isConnected: boolean;
  viewerCount: number;

  setCurrentRoom: (room: Room | null) => void;
  setRooms: (rooms: Room[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setConnected: (connected: boolean) => void;
  setViewerCount: (count: number) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  rooms: [],
  chatMessages: [],
  isConnected: false,
  viewerCount: 0,

  setCurrentRoom: (currentRoom) => set({ currentRoom }),

  setRooms: (rooms) => set({ rooms }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-199), message],
    })),

  setChatMessages: (chatMessages) => set({ chatMessages }),

  setConnected: (isConnected) => set({ isConnected }),

  setViewerCount: (viewerCount) => set({ viewerCount }),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
      currentRoom:
        state.currentRoom?.id === roomId
          ? { ...state.currentRoom, ...updates }
          : state.currentRoom,
    })),
}));
