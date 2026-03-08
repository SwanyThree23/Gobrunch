import create from 'zustand';

interface UserProfile {
    id: string;
    stripe_account_id?: string;
}

interface UserState {
    profile?: UserProfile;
    setProfile: (p: UserProfile) => void;
}

export const useUserStore = create<UserState>(set => ({
    profile: undefined,
    setProfile: p => set({ profile: p })
}));