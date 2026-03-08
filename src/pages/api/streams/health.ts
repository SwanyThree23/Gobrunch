import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();
    const { streamId } = req.query;
    if (typeof streamId !== 'string') return res.status(400).json({ error: 'missing streamId' });
    try {
        const { data } = await supabaseAdmin
            .from('view_accounts')
            .select('revenue,duration')
            .eq('stream_id', streamId);
        res.status(200).json(data);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}