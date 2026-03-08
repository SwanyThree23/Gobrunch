import Stripe from 'stripe';
import { calculateSplit } from './revenue';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-08-23'
});

/**
 * Create a payment intent (destination charge) for a tip or transaction. The
 * platform fee is calculated server‑side and never accepted from the client.
 */
export async function createDestinationPaymentIntent(options: {
    amount: number; // in cents
    currency: string;
    creatorStripeAccountId: string;
    metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
    const { amount, currency, creatorStripeAccountId, metadata } = options;
    const { creatorAmount } = calculateSplit(amount);

    return stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ['card'],
        // destination charge indicates the amount to transfer to the connected
        // account. Stripe will keep the remainder.
        transfer_data: {
            destination: creatorStripeAccountId,
            amount: creatorAmount
        },
        metadata
    });
}

/**
 * Retrieve payment intent by id. Useful for webhook handling.
 */
export async function retrievePaymentIntent(
    id: string
): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.retrieve(id);
}

/**
 * Verify webhook signature and return the event. Throws if validation fails.
 */
export function constructStripeEvent(
    payload: Buffer,
    signature: string
): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return stripe.webhooks.constructEvent(payload, signature, secret);
}
