/**
 * Revenue engine for CY Live. All calculations are canonical and deterministic.
 * The platform fee percentage is hard-coded and never taken from the client.
 * The 90/10 split is enforced here and also by the database check constraints.
 */

export const PLATFORM_FEE_PERCENT = 10 as const; // do not change
export const CREATOR_SHARE_PERCENT = 100 - PLATFORM_FEE_PERCENT;

/**
 * Given a gross amount (in cents) returns the split amounts (in cents) for
 * creator and platform. Amounts are rounded to the nearest cent so they sum to
 * gross.
 */
export function calculateSplit(gross: number): {
    creatorAmount: number;
    platformAmount: number;
} {
    if (gross < 0) {
        throw new Error('Gross amount must be non-negative');
    }
    // Use integer arithmetic to avoid floating point issues
    const creatorAmount = Math.round((gross * CREATOR_SHARE_PERCENT) / 100);
    const platformAmount = gross - creatorAmount;
    // sanity check
    if (creatorAmount + platformAmount !== gross) {
        throw new Error('Split arithmetic failed');
    }
    return { creatorAmount, platformAmount };
}

/**
 * Validate that a stored transaction satisfies the 90/10 rule. Throws on
 * violation.
 */
export function assertValidSplit(
    gross: number,
    creatorAmount: number,
    platformAmount: number
): void {
    const { creatorAmount: expectedCreator, platformAmount: expectedPlatform } =
        calculateSplit(gross);
    if (creatorAmount !== expectedCreator || platformAmount !== expectedPlatform) {
        throw new Error('Invalid revenue split');
    }
}
