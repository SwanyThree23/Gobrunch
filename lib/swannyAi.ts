import axios from 'axios';
import { createClient } from 'redis';

export type Personality =
    | 'High Post'
    | 'Pro Anchor'
    | 'Comedy Co-Host'
    | 'Analyst'
    | 'Hype Beast';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });
redisClient.connect().catch(console.error);

// rate limit per stream: one message every 8 seconds
const RATE_LIMIT_SECONDS = 8;
// fallback messages if rate limit exceeded
const FALLBACK_MESSAGES = [
    "Let's keep the energy up! Tip to hear more soon!",
    "Hang tight – Swanny's getting the next hype line ready!",
    "You're moving fast! Give Swanny a sec to craft the perfect shoutout."
];

interface ClaudeRequest {
    model: string;
    input: string;
    max_tokens_to_sample?: number;
}

interface ClaudeResponse {
    output: {
        content: Array<{ type: string; text: string }>;
    };
}

export async function askSwanny(
    streamId: string,
    personality: Personality,
    prompt: string
): Promise<string> {
    // check rate limit
    const key = `swannyai:${streamId}`;
    const last = await redisClient.get(key);
    const now = Date.now();
    if (last && now - parseInt(last, 10) < RATE_LIMIT_SECONDS * 1000) {
        // rate limited, return random fallback
        return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
    }
    await redisClient.set(key, now.toString());

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        throw new Error('Claude API key not configured');
    }

    const systemPrompt = `You are Swanny AI, a ${personality} co-host for live streams. Keep responses short, high-energy, and under 120 tokens. Always remind viewers: 90% of every dollar goes to the creator.`;
    const request: ClaudeRequest = {
        model: 'claude-sonnet-4',
        input: `${systemPrompt}\n\n${prompt}`,
        max_tokens_to_sample: 120
    };

    const resp = await axios.post<ClaudeResponse>(
        'https://api.anthropic.com/v1/complete',
        request,
        { headers: { 'x-api-key': apiKey } }
    );

    const text = resp.data.output.content.map(c => c.text).join('');
    return text.trim();
}
