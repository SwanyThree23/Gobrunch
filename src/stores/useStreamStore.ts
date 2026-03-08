import create from 'zustand';

interface StreamState {
    currentStreamId?: string;
    setStream: (id: string) => void;
}

export const useStreamStore = create<StreamState>(set => ({
    currentStreamId: undefined,
    setStream: id => set({ currentStreamId: id })
}));