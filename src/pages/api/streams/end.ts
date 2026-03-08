import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';
import { sendN8nWebhook } from '../../../../lib/n8n';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const { streamId } = req.body;
    if (!streamId) return res.status(400).json({ error: 'missing streamId' });

    try {
        await supabaseAdmin
            .from('streams')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', streamId);
        await sendN8nWebhook(process.env.N8N_WEBHOOK_URL || '', 'stream.end', {
            streamId
        });
        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}