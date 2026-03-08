export interface Profile {
    id: string;
    stripe_account_id?: string;
    total_earnings: number;
    subscriber_count: number;
    created_at: string;
    updated_at: string;
}

export type StreamMode = 'public' | 'private' | 'unlisted';
export type StreamStatus = 'offline' | 'configuring' | 'live' | 'ended';

export interface Stream {
    id: string;
    creator_id: string;
    title: string;
    category?: string;
    mode: StreamMode;
    status: StreamStatus;
    encrypted_stream_key: string;
    view_account_id?: string;
    started_at?: string;
    ended_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    stream_id: string;
    viewer_id?: string;
    gross_amount: number;
    creator_amount: number;
    platform_amount: number;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    stream_id: string;
    sender_id?: string;
    type: 'text' | 'tip' | 'subscription' | 'system' | 'moderation';
    content: any;
    created_at: string;
    moderated: boolean;
}
