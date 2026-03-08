import create from 'zustand';

interface ChatMessage { sender?: string; text: string; type?: string }

interface ChatState {
    messages: ChatMessage[];
    addMessage: (msg: ChatMessage) => void;
}

export const useChatStore = create<ChatState>(set => ({
    messages: [],
    addMessage: msg => set(state => ({ messages: [...state.messages, msg] }))
}));