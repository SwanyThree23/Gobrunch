import type { NextApiRequest, NextApiResponse } from 'next';
import { askSwanny } from '../../../../lib/swannyAi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const { streamId, personality, prompt } = req.body;
    if (!streamId || !personality || !prompt) {
        return res.status(400).json({ error: 'invalid parameters' });
    }
    try {
        const message = await askSwanny(streamId, personality, prompt);
        res.status(200).json({ message });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}