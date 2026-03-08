import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const { streamId, senderId, content } = req.body;
    if (!streamId || !content) return res.status(400).json({ error: 'invalid parameters' });
    try {
        await supabaseAdmin.from('chat_messages').insert({
            stream_id: streamId,
            sender_id: senderId,
            content
        });
        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}