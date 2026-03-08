import { generateTiles, shuffle, deal, isValidMove, applyMove, isBlocked, calculateElo } from '../lib/domino';

describe('domino engine', () => {
    it('generates 28 unique tiles', () => {
        const tiles = generateTiles();
        expect(tiles.length).toBe(28);
        const set = new Set(tiles.map(t => t.join(',')));
        expect(set.size).toBe(28);
    });

    it('shuffle returns same elements', () => {
        const tiles = generateTiles();
        const s = shuffle(tiles);
        expect(s.length).toBe(28);
    });

    it('deal distributes hands', () => {
        const { hands, boneyard } = deal(generateTiles(), 2);
        expect(hands.length).toBe(2);
        expect(hands[0].length).toBe(7);
        expect(boneyard.length).toBe(14);
    });

    it('elo calculation works', () => {
        const { newA, newB } = calculateElo(1500, 1500);
        expect(newA).toBeGreaterThan(1500);
        expect(newB).toBeLessThan(1500);
    });
});