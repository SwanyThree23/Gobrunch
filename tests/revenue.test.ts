import { calculateSplit, assertValidSplit, PLATFORM_FEE_PERCENT } from '../lib/revenue';

describe('revenue engine', () => {
    it('splits correctly for various amounts', () => {
        const cases = [0, 1, 100, 12345, 99999];
        cases.forEach(gross => {
            const { creatorAmount, platformAmount } = calculateSplit(gross);
            expect(creatorAmount + platformAmount).toBe(gross);
            expect(creatorAmount).toBe(Math.round(gross * (100 - PLATFORM_FEE_PERCENT) / 100));
            expect(platformAmount).toBe(gross - creatorAmount);
            assertValidSplit(gross, creatorAmount, platformAmount);
        });
    });

    it('throws on negative', () => {
        expect(() => calculateSplit(-5)).toThrow();
    });
});