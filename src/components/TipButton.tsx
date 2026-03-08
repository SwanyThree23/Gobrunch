import React, { useState } from 'react';
import { Button } from './Button';
import { calculateSplit } from '../lib/revenue';

interface TipButtonProps {
    streamId: string;
    creatorStripeAccountId: string;
}

export const TipButton: React.FC<TipButtonProps> = ({ streamId, creatorStripeAccountId }) => {
    const [amount, setAmount] = useState<number>(0);
    const [processing, setProcessing] = useState(false);

    const handleTip = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/stripe/intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, currency: 'usd', creatorStripeAccountId })
            });
            const data = await res.json();
            const split = calculateSplit(amount);
            console.log('split', split);
            // normally would pass data.clientSecret to stripe.js
            alert(`Payment intent created, creator gets $${(split.creatorAmount / 100).toFixed(2)}`);
        } catch (err) {
            console.error(err);
            alert('error creating tip');
        }
        setProcessing(false);
    };

    return (
        <div className="flex gap-2 items-center">
            <input
                type="number"
                className="input-field w-24"
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value, 10) || 0)}
                placeholder="cents"
            />
            <Button variant="gold" onClick={handleTip} disabled={processing || amount <= 0}>
                Tip
            </Button>
        </div>
    );
};