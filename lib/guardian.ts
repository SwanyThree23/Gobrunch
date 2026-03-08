import axios from 'axios';
import { sendN8nWebhook } from './n8n';

// check message via Claude asynchronously and fire webhook if moderated
export async function moderateMessage(message: string, messageId: string, streamId: string) {
    // call Claude to evaluate
    try {
        const resp = await axios.post(
            'https://api.anthropic.com/v1/complete',
            {
                model: 'claude-sonnet-4',
                input: `Moderate this chat message for policy violations:\n\n${message}`,
                max_tokens_to_sample: 60
            },
            { headers: { 'x-api-key': process.env.CLAUDE_API_KEY || '' } }
        );
        const text = resp.data.output?.content?.map((c: any) => c.text).join('');
        const violated = text && text.toLowerCase().includes('violate');
        if (violated) {
            // trigger webhook
            await sendN8nWebhook(process.env.N8N_WEBHOOK_URL || '', 'message.moderated', {
                messageId,
                streamId,
                reason: text
            });
        }
        return { moderated: violated, reason: text };
    } catch (err) {
        console.error('moderation failed', err);
        return { moderated: false, reason: '' };
    }
}
