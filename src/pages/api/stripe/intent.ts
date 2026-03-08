import type { NextApiRequest, NextApiResponse } from 'next';
import { createDestinationPaymentIntent } from '../../../../lib/stripe';
import { calculateSplit } from '../../../../lib/revenue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const { amount, currency, creatorStripeAccountId } = req.body;
    if (typeof amount !== 'number' || !currency || !creatorStripeAccountId) {
        return res.status(400).json({ error: 'invalid parameters' });
    }
    try {
        const intent = await createDestinationPaymentIntent({
            amount,
            currency,
            creatorStripeAccountId
        });
        return res.status(200).json({ clientSecret: intent.client_secret });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
