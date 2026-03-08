import axios from 'axios';
import { createHmac } from 'crypto';

const SECRET = process.env.N8N_WEBHOOK_SECRET || '';
if (!SECRET) throw new Error('N8N_WEBHOOK_SECRET not set');

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 4000, 16000];

export async function sendN8nWebhook(
    url: string,
    eventType: string,
    payload: any
): Promise<void> {
    const body = { eventType, payload };
    const timestamp = Date.now().toString();
    const signature = createHmac('sha256', SECRET)
        .update(timestamp)
        .update(JSON.stringify(body))
        .digest('hex');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await axios.post(url, body, {
                headers: {
                    'x-n8n-timestamp': timestamp,
                    'x-n8n-signature': signature,
                    'content-type': 'application/json'
                }
            });
            return;
        } catch (err) {
            if (attempt === MAX_ATTEMPTS) {
                console.error('n8n webhook failed', err);
                throw err;
            }
            await new Promise(r => setTimeout(r, BACKOFF_MS[attempt - 1]));
        }
    }
}
