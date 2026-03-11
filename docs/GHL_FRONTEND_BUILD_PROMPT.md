# SeeWhy LIVE — 1-Shot GoHighLevel Frontend Build Prompt

> Paste this entire prompt into GoHighLevel's Custom Code / Site Builder / Antigravity agent to generate the full client-side web application that connects to the SeeWhy LIVE backend.

---

## THE PROMPT

```
You are building the complete frontend client-side web application for "SeeWhy LIVE" — an enterprise live-streaming platform by SWANYTHREE EntTech. This frontend runs inside GoHighLevel as a custom-coded site/funnel. It connects to an existing Next.js + WebSocket backend API. No Make.com is used.

============================================================
BRAND IDENTITY & DESIGN SYSTEM
============================================================

App Name: SeeWhy LIVE
Tagline: "Enterprise Live Streaming Platform"
Company: SWANYTHREE EntTech
Version: 1.1.0

COLOR PALETTE (dark-first, luxury streaming brand):
- Burgundy (Primary):    #800020
- Gold (Accent):         #D4AF37
- Dark (Background):     #1a0b2e
- Dark Surface:          #150929
- White text on dark backgrounds
- All UI uses frosted-glass card aesthetic

CSS VARIABLES:
--burgundy: #800020;
--gold: #D4AF37;
--dark: #1a0b2e;
--dark-surface: #150929;

GLASS-CARD PATTERN (use everywhere):
background: rgba(255,255,255,0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.10);
border-radius: 16px;

GLASS-CARD-HOVER (interactive cards):
Same as glass-card plus:
transition: all 300ms;
hover: background rgba(255,255,255,0.10), border-color rgba(212,175,55,0.30), box-shadow 0 10px 15px rgba(212,175,55,0.05);

BUTTON STYLES:
- Primary: gradient from #800020 to burgundy-600, white text, rounded-xl, hover glow
- Secondary: glass-card bg, white text, gold border on hover
- Gold: gradient from gold-400 to gold-500, dark text, bold, hover glow
- Ghost: transparent bg, white/70 text, hover white/10 bg
- Danger: red-500/20 bg, red-400 text

INPUT FIELDS:
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.10);
border-radius: 12px;
color: white;
placeholder: rgba(255,255,255,0.40);
focus: border-color rgba(212,175,55,0.50), ring 1px rgba(212,175,55,0.25);

TYPOGRAPHY: System sans-serif stack. White text. Gold gradient text for headlines (gradient-text class: bg-gradient gold-300 → gold → gold-400, bg-clip-text, text-transparent).

BADGES:
- Default: white/10 bg, white/70 text
- Live: red-500/20 bg, red-400 text, includes animated pulsing red dot
- Gold: gold/20 bg, gold text
- Success: green-500/20 bg, green-400 text
- Warning: yellow-500/20 bg, yellow-400 text
- Danger: red-500/20 bg, red-400 text

ANIMATIONS:
- glow-pulse: scale 1→1.05→1, opacity 1→0.8→1 (2s infinite)
- float: translateY 0→-10px→0 (3s infinite)
- slide-up: translateY 10px→0, opacity 0→1 (0.3s)
- fade-in: opacity 0→1 (0.5s)
- pulse-dot: scale 1→1.5→1, opacity 1→0.5→1 (1.5s infinite) — used on live-dot

SCROLLBAR: 6px width, dark-700 track, burgundy-500/50 thumb rounded-full

============================================================
BACKEND API REFERENCE (your frontend calls these)
============================================================

BASE_URL: Set via environment variable. All API calls go here.
WS_URL: WebSocket server URL (separate from API).

AUTHENTICATION:
- Register:  POST /api/auth/register  body: { email, password, displayName, username }
- Login:     POST /api/auth/login     body: { email, password }
  Response: { success, data: { user, token, refreshToken } }
  Store token + refreshToken in localStorage keys "sw_token" and "sw_refresh_token"
  Also set cookie "auth_token" = token (for middleware)
- Session:   GET /api/auth/session    header: Authorization: Bearer <token>
- Logout:    Clear localStorage + cookies client-side

All authenticated endpoints require header: Authorization: Bearer <token>

ROOMS API:
- GET    /api/rooms                    → list rooms (query: status, hostId, page, pageSize)
- POST   /api/rooms                    → create room (body: title, description, visibility, maxViewers, tags, chatEnabled, recordingEnabled)
- GET    /api/rooms/{id}               → get room
- PATCH  /api/rooms/{id}               → update room
- DELETE /api/rooms/{id}               → delete room

STREAM CONFIG API (host-only):
- GET    /api/rooms/{id}/stream-config → get stream key, RTMP URL, multistream targets
- POST   /api/rooms/{id}/stream-config → actions: regenerate-key, add-multistream, remove-multistream, toggle-multistream, get-platform-config

WATCH PARTY API:
- GET    /api/watchparty               → list parties (or ?code=XXXX to find by invite code)
- POST   /api/watchparty               → create party (body: title, videoUrl, videoSource, maxParticipants, chatEnabled, aiAssistantEnabled)
- GET    /api/watchparty/{id}          → get party details
- POST   /api/watchparty/{id}          → join party
- PATCH  /api/watchparty/{id}          → send sync event (body: type, data)
- DELETE /api/watchparty/{id}          → leave party

AI CHAT API:
- POST   /api/openrouter/chat          → body: { message, model?, context? }
  Models: "openai/gpt-4o" (default), "anthropic/claude-3.5-sonnet", "google/gemini-pro", "meta-llama/llama-3-70b"
  For streaming: set header Accept: text/event-stream → returns SSE stream
  Context object: { roomId?, watchPartyId?, videoTitle? }

STRIPE PAYMENT API:
- POST   /api/stripe/checkout          → body: { priceId, successUrl, cancelUrl } → returns checkout URL
- POST   /api/stripe/portal            → returns Stripe billing portal URL
- GET    /api/stripe/connect           → get creator Connect account status
- POST   /api/stripe/connect           → create/continue Connect onboarding
- GET    /api/stripe/connect/earnings  → get creator earnings + transactions
- POST   /api/stripe/tip               → body: { hostId, roomId, amount, message?, successUrl, cancelUrl }
- POST   /api/stripe/ticket            → body: { hostId, roomId, amount, successUrl, cancelUrl }

AUTOMATION API:
- GET    /api/automation/webhooks      → list outbound webhooks
- POST   /api/automation/webhooks      → actions: create (name, targetUrl, triggers[]), delete (webhookId), toggle (webhookId)
- POST   /api/automation/make          → actions: generate_key (name?), revoke_key
  API key format: sw_<48 hex chars> — used via X-API-Key header
- POST   /api/automation/inbound/{userId} → inbound actions from GHL (needs X-API-Key header)
  Actions: stream.start, stream.end, room.update, send.chat, ping

USER API:
- GET    /api/users/profile            → get profile
- PUT    /api/users/profile            → update profile (displayName, bio, avatar)

============================================================
WEBSOCKET REAL-TIME LAYER
============================================================

Connect to WS_URL using Socket.IO client.
Auth: pass token in socket.handshake.auth.token
Transports: ['websocket', 'polling']
Reconnection: 5 attempts, 1000ms delay

CLIENT → SERVER EVENTS:
- room:join          { roomId, isHost? }
- room:leave         { roomId }
- stream:start       { roomId, title? }
- stream:end         { roomId, title? }
- chat:message       { roomId, content, type }
- chat:typing        { roomId }
- chat:reaction      { roomId, messageId, reaction }
- tip:received       { roomId, amount, fromUser, message? }
- watchparty:participant_join   { watchPartyId }
- watchparty:participant_leave  { watchPartyId }
- watchparty:sync    { watchPartyId, type, data }
- watchparty:reaction { watchPartyId, reaction }
- watchparty:start   { watchPartyId, videoUrl }

SERVER → CLIENT EVENTS:
- viewer:count       { count }
- chat:message       { id, roomId, userId, type, content, isPinned, reactions, createdAt }
- chat:typing        { userId }
- chat:reaction      { messageId, userId, reaction }
- stream:started     { roomId, userId, timestamp }
- stream:ended       { roomId, userId, timestamp }
- tip:received       { roomId, amount, fromUser, message, timestamp }
- ticket:purchased   { roomId, buyerId, amount, timestamp }
- watchparty:participant_join   { userId }
- watchparty:participant_leave  { userId }
- watchparty:sync    { type, timestamp, userId, data }
- watchparty:reaction { userId, reaction }
- watchparty:started  { watchPartyId, userId, videoUrl, timestamp }

============================================================
VALIDATION RULES (enforce client-side before API calls)
============================================================

Login:
- email: valid email format, required
- password: min 8 characters, required

Register:
- email: valid email, required
- username: 3-30 chars, alphanumeric + hyphens/underscores only, required
- displayName: required, trimmed
- password: min 8 chars, must contain uppercase + lowercase + number

Room Create:
- title: required, trimmed
- description: max 500 chars
- visibility: "public" | "private" | "unlisted" (default: "public")
- maxViewers: 1–100,000 (default: 1000)
- tags: array, max 10 items
- chatEnabled: boolean (default: true)
- recordingEnabled: boolean (default: false)

Watch Party Create:
- title: required
- videoUrl: valid URL, required
- videoSource: "youtube" | "vimeo" | "custom" | "upload"
- maxParticipants: 2–50 (default: 10)
- chatEnabled: boolean (default: true)
- aiAssistantEnabled: boolean (default: false)

Chat Message:
- roomId: UUID format
- content: 1–2,000 characters
- type: "text" | "system" | "ai_response" | "reaction" | "pinned"

AI Chat:
- message: 1–4,000 characters
- model: one of the 4 models listed above

Tip:
- amount: minimum $1.00
- message: max 500 characters (optional)

Ticket:
- amount: minimum $1.00

Checkout:
- priceId: required
- successUrl: valid URL
- cancelUrl: valid URL

============================================================
PAGES TO BUILD (complete list)
============================================================

PAGE 1: LANDING / HOME (route: /)
- Fixed navbar: logo "SeeWhy LIVE" (gradient-text), nav links [Dashboard, Pricing, Creator, Automations], auth buttons (Login/Register or Avatar+Logout if authenticated)
- Mobile: hamburger menu with slide-down nav
- Hero section: large gradient bg (burgundy/20 + gold/10), headline "Stream. Connect. Monetize.", subtitle about enterprise streaming, two CTAs: "Start Streaming" (gold btn) + "Watch Live" (secondary btn)
- Stats bar: 4 glass-cards showing "99.9% Uptime", "<200ms Latency", "100K+ Viewers", "4K HDR"
- Features grid: 6 glass-card-hover cards in 3-column responsive grid:
  1. Live Streaming (Radio icon) — "Professional-grade live streaming with ultra-low latency"
  2. Watch Parties (Users icon) — "Watch videos together with synchronized playback"
  3. AI Assistant (Sparkles icon) — "AI-powered chat assistant with multiple model support"
  4. Live Chat (MessageCircle icon) — "Real-time chat with reactions, pinning, and moderation"
  5. Security (Shield icon) — "Enterprise-grade security with encrypted streams"
  6. Global CDN (Globe icon) — "Worldwide content delivery for minimal buffering"
- CTA section: "Transform Your Streams" with paragraph and gold CTA button
- Footer: 4-column grid (Brand, Product links, Company links, Legal links), copyright, "Powered by OpenRouter AI"

PAGE 2: LOGIN (route: /auth/login) — protected: redirect to /dashboard if already authenticated
- Centered glass-card, max-width-md
- "Welcome Back" heading, "Sign in to SeeWhy LIVE" subtitle
- Email input, Password input
- "Sign In" primary button with loading spinner
- "Don't have an account? Sign up" link to /auth/register
- Error display (red alert box)
- On success: store tokens, set cookie, redirect to /dashboard (or redirect param)

PAGE 3: REGISTER (route: /auth/register) — protected: redirect if authenticated
- Centered glass-card
- "Create Account" heading
- Display Name, Username, Email, Password inputs
- "Create Account" primary button with loading state
- "Already have an account? Sign in" link
- Validation errors inline
- On success: store tokens, redirect to /dashboard

PAGE 4: DASHBOARD (route: /dashboard) — requires auth
- Tab navigation: "My Rooms" | "Watch Parties"
- 4 stat cards across top: Active Rooms, Total Viewers, Watch Parties, Total Rooms (with icons: Radio, Eye, Users, Tv)
- My Rooms tab:
  - "Create Room" gold button (links to /room/new)
  - Room cards grid: each card shows title, status badge (live=red pulsing, scheduled=gold, ended=white/50), viewer count with Eye icon, tags as small badges, creation time, click → /room/{id}
- Watch Parties tab:
  - "Create Party" gold button (links to /watchparty/new)
  - Party cards: title, participant count, status badge, "Join" button → /watchparty/{id}
- Loading state: gold spinner centered
- Empty states: "No rooms yet. Create your first room!" / "No watch parties. Start one!"

PAGE 5: CREATE ROOM (route: /room/new) — requires auth
- Glass-card form
- Inputs: Title, Description (textarea, 500 char limit), Visibility dropdown (Public/Unlisted/Private), Tags (comma-separated text input)
- Toggle: "Paid Event" — if enabled, show Ticket Price input (number, min $1.00) with note "Platform fee: 15%"
- "Create Room" gold button → POST /api/rooms → redirect to /room/{id}/settings

PAGE 6: LIVE ROOM (route: /room/{id}) — requires auth
- Full-viewport layout, dark bg
- LEFT: Video area (75% width on desktop, full on mobile)
  - VDO.Ninja iframe embed (or placeholder with Play icon if not streaming)
  - Overlay top-left: LIVE badge (animated red dot + "LIVE") + viewer count
  - Overlay bottom: reaction buttons row (❤️ 👍 😂 🔥) + Share button + Fullscreen button
  - Below video: stream info bar — host avatar, host name, room title, "Tip" button (gold, opens tip modal)
  - Host-only controls bar: "Go Live" (green) / "End Stream" (red) buttons, "Settings" link to /room/{id}/settings
- RIGHT: Chat sidebar (25% width, collapsible on mobile)
  - Chat header with message count
  - Scrollable message list: each message shows avatar, username, timestamp, content. System messages styled differently. AI responses have Sparkles icon.
  - Chat input at bottom: text input + send button
  - Typing indicator: "{user} is typing..."
  - AI Assistant toggle panel (collapsible): input to ask AI, model selector dropdown, responses displayed inline
- Ticket gate: if room has ticketPrice and user hasn't purchased, show overlay with "Purchase Ticket — ${price}" button blocking video
- TIP MODAL: preset amounts [$1, $5, $10, $25, $50, $100], custom amount input (min $1), optional message textarea (500 chars), "Send Tip" gold button → POST /api/stripe/tip → redirect to Stripe Checkout
- WebSocket: on mount join room, listen for chat messages + viewer count + stream events. On unmount leave room.

PAGE 7: ROOM SETTINGS (route: /room/{id}/settings) — requires auth, host-only
- Back link to /room/{id}
- Stream Configuration card:
  - Stream Key: masked field (•••••) with Show/Copy buttons
  - RTMP URL: displayed with Copy button
  - "Regenerate Key" danger button with confirmation dialog
- Platform Instructions card:
  - Dropdown to select platform: OBS Studio, Streamlabs, PRISM Live, vMix, XSplit, Restream, Custom RTMP
  - Display platform-specific step-by-step setup instructions based on selection
- Multistream Targets card:
  - List existing targets: platform icon, name, status badge, toggle enable/disable, delete button
  - "Add Target" form: platform dropdown, name, RTMP URL, stream key inputs
- Receive External Stream card:
  - Display the room's receive URL for external stream input

PAGE 8: CREATE WATCH PARTY (route: /watchparty/new) — requires auth
- Glass-card form
- Inputs: Party Title, Video URL, Video Source dropdown (YouTube/Vimeo/Custom URL), Max Participants (2–50, default 10)
- "Create Party" gold button → POST /api/watchparty → redirect to /watchparty/{id}

PAGE 9: WATCH PARTY ROOM (route: /watchparty/{id}) — requires auth
- Layout similar to live room but for synced video playback
- LEFT: Video player area
  - Embedded video player (YouTube/Vimeo embed or HTML5 video for custom)
  - Host controls: Play/Pause buttons, seek bar (synced to all participants)
  - Playback time display
  - Floating reaction emojis when participants react
- TOP BAR: Party title, participant count, invite code with copy button
- Participant list: avatars with ready/not-ready indicators
- RIGHT: Chat sidebar (same pattern as room chat)
  - AI Assistant panel (if enabled): ask questions about the video being watched
- WebSocket: join watchparty on mount, sync playback events (play/pause/seek/rate_change), participant join/leave, reactions

PAGE 10: PRICING (route: /pricing) — public
- Monthly/Annual toggle switch (annual shows "Save 17%" badge)
- 3 pricing cards in row:
  STARTER (Free): 2 rooms, 50 viewers, basic chat, watch parties (5), community support. CTA: "Get Started" secondary btn
  PROFESSIONAL ($29/mo or $290/yr): 20 rooms, 5K viewers, AI Assistant, watch parties (25), recording, analytics, priority support. "Most Popular" gold ring border. CTA: "Subscribe" gold btn
  ENTERPRISE ($99/mo or $990/yr): Unlimited rooms, 100K viewers, all AI models, watch parties (50), HD recording, advanced analytics, custom branding, dedicated support, SLA. CTA: "Subscribe" gold btn
- Each plan card: glass-card, plan name, price (large), feature list with checkmark icons
- If user is on a plan, show "Current Plan" badge instead of subscribe button
- Subscribe buttons → POST /api/stripe/checkout → redirect to Stripe Checkout URL
- Bottom CTA: "Start Earning as a Creator" card linking to /creator/onboarding

PAGE 11: PROFILE (route: /profile) — requires auth
- Profile header: large avatar, display name (gradient-text), @username, subscription tier badge
- Edit Profile card: display name input, bio textarea, email (disabled/readonly)
- "Save Changes" primary button with success checkmark feedback
- Subscription card: current plan name + badge, "Manage Subscription" button (→ Stripe portal) or "Upgrade" button (→ /pricing)
- Security card: Change Password section (current + new password inputs), 2FA mention (coming soon)

PAGE 12: CREATOR ONBOARDING (route: /creator/onboarding) — requires auth
- Payment Account Status card:
  - Stripe Connect status indicator: Active (green), Onboarding (yellow), Action Required (orange), Disabled (red), Not Connected (gray)
  - If connected: show Charges Enabled / Payouts Enabled indicators
  - If action required: warning box with "Complete your account setup" message
  - Button: "Setup Payments" / "Continue Onboarding" / "View Earnings" depending on status
    → POST /api/stripe/connect → redirect to Stripe Connect onboarding URL
- 3 benefit cards: "Accept Tips" (Heart icon), "Sell Tickets" (Ticket icon), "Secure Payouts" (DollarSign icon)

PAGE 13: CREATOR EARNINGS (route: /creator/earnings) — requires auth
- 4 stat cards: Total Earnings, Available Balance, Pending, Last Payout (all formatted as currency)
- "Stripe Dashboard" button → opens Stripe Express dashboard
- Recent Transactions list: each row shows:
  - Icon by type (payout=ArrowUpRight, tip=Heart, ticket=Ticket, refund=RefreshCw)
  - Description + relative timestamp
  - Amount (green for income, red for payouts/refunds)
  - Status badge (completed=green, pending=yellow)
  - Fee amount if applicable
- Empty state: "No transactions yet. Start streaming to earn!"

PAGE 14: AUTOMATIONS (route: /creator/automations) — requires auth
- Section 1: Inbound Webhook
  - Display inbound URL: {BASE_URL}/api/automation/inbound/{userId}
  - Copy button
  - "Available Actions" expandable list: stream.start, stream.end, room.update, send.chat, ping — each with description and example JSON body
  - API Key management: Generate / Regenerate / Revoke buttons
  - New key display with copy button + "I've saved this key" confirmation before hiding

- Section 2: Create Outbound Webhook (collapsible form)
  - Name input
  - Target URL input (this is where you paste a GHL inbound webhook URL)
  - Trigger checkboxes (multi-select): stream.started, stream.ended, viewer.joined, viewer.left, chat.message, tip.received, ticket.purchased, subscriber.new, room.created, watchparty.started
  - "Create Webhook" gold button

- Section 3: Active Outbound Webhooks list
  - Each webhook card shows:
    - Name + enabled/disabled status badge
    - Target URL (truncated)
    - Signing Secret: masked with show/hide toggle + copy button
    - Trigger badges (gold badges for each trigger)
    - Last triggered timestamp
    - Failure count (if > 0, show warning)
    - Toggle switch (enable/disable)
    - Delete button (with confirmation)

- Info box: "Webhook Delivery Headers" — documents X-SeeWhy-Signature, X-SeeWhy-Event, X-SeeWhy-Delivery headers

PAGE 15: ADMIN DASHBOARD (route: /admin) — requires auth + admin role
- Access guard: if user.role !== 'admin', show "Access Denied" message
- 4 stat cards: Total Users, Active Streams, Revenue, System Health (percentage)
- Recent Activity list: 5 most recent events with type icon, description, timestamp
- Platform Analytics: 4 progress bars — Server Load, Bandwidth Usage, Storage Used, API Rate Limit — each with percentage and color-coded bar

PAGE 16: TIP SUCCESS (route: /tip/success)
- Centered glass-card
- Gold circle with Heart icon
- "Tip Sent!" heading (gradient-text)
- "Thank you for supporting the creator!" message
- "Back to Dashboard" button with arrow icon

PAGE 17: TIP CANCELLED (route: /tip/cancelled)
- Centered glass-card
- Gray circle with XCircle icon
- "Tip Cancelled" heading
- "No worries! You can always tip later." message
- "Back to Dashboard" button

============================================================
STATE MANAGEMENT
============================================================

Use a client-side state store (Zustand pattern, or vanilla JS store, or GHL's built-in state) with these stores:

AUTH STORE:
- user: User | null
- token: string | null
- refreshToken: string | null
- isAuthenticated: boolean
- isLoading: boolean
- setAuth(response) — stores user + tokens
- logout() — clears everything

ROOM STORE:
- currentRoom: Room | null
- rooms: Room[]
- chatMessages: ChatMessage[] (keep last 200)
- isConnected: boolean
- viewerCount: number

WATCHPARTY STORE:
- party: WatchParty | null
- isHost: boolean
- isReady: boolean
- chatMessages: ChatMessage[] (keep last 200)
- syncEvents: WatchPartySyncEvent[] (keep last 50)

On app load: check localStorage for token → if found, call GET /api/auth/session to validate → populate auth store.

============================================================
PROTECTED ROUTE MIDDLEWARE
============================================================

These routes require authentication (redirect to /auth/login if no token):
/dashboard/*, /profile/*, /admin/*, /room/*, /watchparty/*, /creator/*

These routes redirect TO /dashboard if already authenticated:
/auth/login, /auth/register

============================================================
KEY UX PATTERNS
============================================================

1. All API errors display in a red alert box near the form/action that triggered them
2. Loading states: gold spinning SVG circle (animate-spin)
3. Page loading: full-page centered spinner with "Loading..." text
4. Copy-to-clipboard: show brief "Copied!" tooltip/toast on success
5. Confirmations: use modal dialogs for destructive actions (delete room, regenerate key, revoke API key)
6. Responsive: mobile-first, 1-col on mobile, 2-col on tablet, 3-col on desktop for grids
7. Navigation: highlight current page link in navbar with gold underline
8. Chat auto-scrolls to newest message
9. Relative timestamps: "2m ago", "1h ago", "3d ago"
10. Currency formatting: USD, 2 decimal places, cents divided by 100 for display

============================================================
CRITICAL INTEGRATION NOTES FOR GHL
============================================================

1. The backend API runs on a SEPARATE server — all fetches go to the configured BASE_URL (not relative paths)
2. CORS: the backend allows the GHL-hosted frontend origin
3. WebSocket: Socket.IO client library must be loaded (CDN: https://cdn.socket.io/4.7.5/socket.io.min.js)
4. Stripe: redirects to Stripe-hosted checkout/portal — no Stripe.js needed on frontend
5. VDO.Ninja: embedded via iframe, communicates via postMessage API
6. No server-side rendering needed — this is a pure client-side SPA running in GHL
7. GHL Custom Values can store: BASE_URL, WS_URL as configuration
8. All API responses follow shape: { success: boolean, data?: any, error?: string, message?: string }
9. Paginated responses add: { pagination: { page, pageSize, total, totalPages } }

============================================================
BUILD THIS NOW
============================================================

Generate the complete frontend application with all 17 pages listed above. Use clean, semantic HTML with the glass-card dark theme CSS system described. Wire up all API calls to the endpoints documented. Implement WebSocket connections for real-time chat and watch party sync. Handle all auth flows including token storage, session validation, and protected routes. Include the tip modal, Stripe checkout redirects, and creator earnings dashboard. Make it fully responsive.

Do NOT use Make.com anywhere. The automation page connects directly to the SeeWhy LIVE webhook API and is designed for GoHighLevel webhook integration.
```

---

## Usage Instructions

### In GoHighLevel:
1. **Sites/Funnels → Custom Code**: Paste the prompt into Antigravity or your AI builder
2. **Custom Values**: Set `BASE_URL` and `WS_URL` to your deployed SeeWhy LIVE backend
3. **CORS**: Add your GHL site domain to the backend's `NEXT_PUBLIC_APP_URL` env var

### In Antigravity:
1. Feed this entire prompt as the build specification
2. Antigravity generates the pages, wires the API calls, and deploys to GHL hosting

### With Claude Code (this repo):
1. Backend is already built — just deploy it
2. Set `NEXT_PUBLIC_APP_URL` to your GHL frontend URL for CORS
3. The WebSocket server (`npx tsx server/websocket.ts`) runs alongside the Next.js app
