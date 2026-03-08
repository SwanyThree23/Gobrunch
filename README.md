# CY Live

CY Live is a creator‑first live streaming platform by SwanyThree Entech. Creators retain 90% of every dollar; the platform keeps 10%. That split is enforced in the database, server logic and user interfaces.

This monorepo contains:

- A Next.js 14 front‑end with TypeScript strict mode and Tailwind CSS using the Criterion Vault design system.
- Supabase/Postgres schema with RLS, real‑time subscriptions and enforceable check constraints.
- Stripe Connect helpers for destination charges.
- MediaSoup WebRTC SFU, socket.io/Redis real‑time services and FFmpeg RTMP routing.
- VaultPro AES‑256-GCM stream key encryption.
- Swanny AI co‑host integration with Claude Sonnet 4 and Redis rate limiting.
- N8N webhook utilities with HMAC signing and retry logic.
- An MCP server exposing 12 tools and six interactive React panels bundled as single HTML files.
- Domino Arena game engine, server and UI.

## Getting started

1. Copy `.env.example` to `.env.local` and fill in credentials (Supabase, Stripe, Redis, Claude, N8N, etc.).
2. Install dependencies:
   ```bash
   npm install
   cd mcp/apps/command-center-dashboard && npm install
   # repeat for each panel or run `npm run prepare-panels` later
   ```
3. Run migrations (Supabase/Prisma not configured but refer to `migrations/001_init.sql`).
4. Build panels:
   ```bash
   npm run prepare-panels
   ```
5. Start development servers:
   ```bash
   npm run dev            # nextjs front end
   npm run ws:dev         # socket server
   node server/index.ts   # mediasoup & others
   node mcp/index.ts      # MCP server
   ```

## Deployment

- Front‑end: Vercel (`vercel.json` provided).
- MCP & backend services: Railway (`railway.json`).

## License

Licensed under the SwannyThree internal license.

