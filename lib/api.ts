import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  User,
  Room,
  WatchParty,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }

  return data;
}

// ---- Auth API ----
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data) {
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('refresh_token', res.data.refreshToken);
    }
    return res.data!;
  },

  async register(payload: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data) {
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('refresh_token', res.data.refreshToken);
    }
    return res.data!;
  },

  async getSession(): Promise<User> {
    const res = await request<User>('/api/auth/session');
    return res.data!;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },
};

// ---- Room API ----
export const roomApi = {
  async list(params?: {
    status?: string;
    hostId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Room>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.hostId) searchParams.set('hostId', params.hostId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const query = searchParams.toString();
    const res = await request<Room[]>(`/api/rooms${query ? `?${query}` : ''}`);
    return res as PaginatedResponse<Room>;
  },

  async get(id: string): Promise<Room> {
    const res = await request<Room>(`/api/rooms/${id}`);
    return res.data!;
  },

  async create(payload: {
    title: string;
    description?: string;
    visibility?: string;
    tags?: string[];
  }): Promise<Room> {
    const res = await request<Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Room> {
    const res = await request<Room>(`/api/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async delete(id: string): Promise<void> {
    await request(`/api/rooms/${id}`, { method: 'DELETE' });
  },
};

// ---- WatchParty API ----
export const watchPartyApi = {
  async list(): Promise<WatchParty[]> {
    const res = await request<WatchParty[]>('/api/watchparty');
    return res.data!;
  },

  async get(id: string): Promise<WatchParty> {
    const res = await request<WatchParty>(`/api/watchparty/${id}`);
    return res.data!;
  },

  async getByCode(code: string): Promise<WatchParty> {
    const res = await request<WatchParty>(`/api/watchparty?code=${code}`);
    return res.data!;
  },

  async create(payload: {
    title: string;
    videoUrl: string;
    videoSource: string;
    maxParticipants?: number;
    aiAssistantEnabled?: boolean;
  }): Promise<WatchParty> {
    const res = await request<WatchParty>('/api/watchparty', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data!;
  },

  async join(id: string): Promise<WatchParty> {
    const res = await request<WatchParty>(`/api/watchparty/${id}`, {
      method: 'POST',
    });
    return res.data!;
  },

  async sync(
    id: string,
    event: { type: string; data: Record<string, unknown> }
  ): Promise<WatchParty> {
    const res = await request<WatchParty>(`/api/watchparty/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(event),
    });
    return res.data!;
  },

  async leave(id: string): Promise<void> {
    await request(`/api/watchparty/${id}`, { method: 'DELETE' });
  },
};

// ---- AI / OpenRouter API ----
export const aiApi = {
  async chat(
    message: string,
    options?: {
      model?: string;
      context?: { roomId?: string; watchPartyId?: string; videoTitle?: string };
    }
  ): Promise<{ message: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    const res = await request<{
      message: string;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    }>('/api/openrouter/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        model: options?.model,
        context: options?.context,
      }),
    });
    return res.data!;
  },

  chatStream(
    message: string,
    options?: {
      model?: string;
      context?: { roomId?: string; watchPartyId?: string; videoTitle?: string };
    }
  ): EventSource | null {
    // For streaming, create a fetch with event-stream accept header
    // This returns null on server side
    if (typeof window === 'undefined') return null;

    const token = getToken();
    // Use fetch-based streaming instead of EventSource for POST + auth
    return null; // Handled via useChatStream hook below
  },
};

// ---- Stripe API ----
export const stripeApi = {
  async createCheckout(priceId: string): Promise<{ sessionId: string; url: string }> {
    const res = await request<{ sessionId: string; url: string }>(
      '/api/stripe/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
        }),
      }
    );
    return res.data!;
  },

  async createPortalSession(): Promise<{ url: string }> {
    const res = await request<{ url: string }>('/api/stripe/portal', { method: 'POST' });
    return res.data!;
  },

  async getConnectStatus(): Promise<{
    status: string;
    accountId: string | null;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    currentlyDue?: string[];
  }> {
    const res = await request<{
      status: string;
      accountId: string | null;
      chargesEnabled?: boolean;
      payoutsEnabled?: boolean;
      detailsSubmitted?: boolean;
      currentlyDue?: string[];
    }>('/api/stripe/connect');
    return res.data!;
  },

  async createConnectAccount(action?: string): Promise<{ accountId?: string; onboardingUrl?: string; url?: string }> {
    const res = await request<{ accountId?: string; onboardingUrl?: string; url?: string }>(
      '/api/stripe/connect',
      {
        method: 'POST',
        body: JSON.stringify({ action: action || 'create' }),
      }
    );
    return res.data!;
  },

  async getCreatorEarnings(): Promise<{
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    lastPayoutDate?: string;
    lastPayoutAmount?: number;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      fee: number;
      net: number;
      currency: string;
      description: string;
      status: string;
      createdAt: string;
    }>;
  }> {
    const res = await request<{
      totalEarnings: number;
      availableBalance: number;
      pendingBalance: number;
      lastPayoutDate?: string;
      lastPayoutAmount?: number;
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        fee: number;
        net: number;
        currency: string;
        description: string;
        status: string;
        createdAt: string;
      }>;
    }>('/api/stripe/connect/earnings');
    return res.data!;
  },

  async createTip(params: {
    creatorId: string;
    amount: number;
    message?: string;
    roomId?: string;
  }): Promise<{ sessionId: string; url: string }> {
    const res = await request<{ sessionId: string; url: string }>(
      '/api/stripe/tip',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return res.data!;
  },

  async createTicket(params: {
    roomId: string;
    amount: number;
  }): Promise<{ sessionId: string; url: string }> {
    const res = await request<{ sessionId: string; url: string }>(
      '/api/stripe/ticket',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return res.data!;
  },
};

// ---- Streaming Toolkit API ----
export const streamingApi = {
  async getToolkit(roomId: string): Promise<Record<string, unknown>> {
    const res = await request<Record<string, unknown>>(`/api/rooms/${roomId}/streaming`);
    return res.data!;
  },
};

/** Custom error class for API errors */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
