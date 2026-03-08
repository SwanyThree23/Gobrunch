// Pure functions for domino game engine

export type Tile = [number, number];
export type Hand = Tile[];
export type Move = {
    tile: Tile;
    end: 'left' | 'right';
};

export function generateTiles(): Tile[] {
    const tiles: Tile[] = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            tiles.push([i, j]);
        }
    }
    return tiles;
}

export function shuffle<T>(array: T[]): T[] {
    // Fisher-Yates
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function deal(tiles: Tile[], count: number): { hands: Hand[]; boneyard: Tile[] } {
    const shuffled = shuffle(tiles);
    const hands: Hand[] = [];
    for (let p = 0; p < count; p++) {
        hands.push(shuffled.splice(0, 7));
    }
    return { hands, boneyard: shuffled };
}

export function isValidMove(
    board: Tile[],
    move: Move,
    hand: Hand
): boolean {
    // must have tile in hand
    const idx = hand.findIndex(t => t[0] === move.tile[0] && t[1] === move.tile[1]);
    if (idx === -1) return false;
    if (board.length === 0) return true;
    const left = board[0];
    const right = board[board.length - 1];
    const [a, b] = move.tile;
    if (move.end === 'left') {
        return a === left[0] || b === left[0];
    } else {
        return a === right[1] || b === right[1];
    }
}

export function applyMove(board: Tile[], move: Move): Tile[] {
    const [a, b] = move.tile;
    if (board.length === 0) return [move.tile];
    if (move.end === 'left') {
        const left = board[0];
        if (b === left[0]) return [move.tile, ...board];
        if (a === left[0]) return [[b, a], ...board];
    } else {
        const right = board[board.length - 1];
        if (a === right[1]) return [...board, move.tile];
        if (b === right[1]) return [...board, [b, a]];
    }
    throw new Error('invalid move');
}

export function isBlocked(hands: Hand[], board: Tile[]): boolean {
    // blocked when no player can play
    return hands.every(h => h.every(tile => !isValidMove(board, { tile, end: 'left' }, h) && !isValidMove(board, { tile, end: 'right' }, h)));
}

export function calculateElo(
    ratingA: number,
    ratingB: number,
    k = 32
): { newA: number; newB: number } {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 - expectedA;
    const scoreA = 1;
    const scoreB = 0;
    const newA = ratingA + k * (scoreA - expectedA);
    const newB = ratingB + k * (scoreB - expectedB);
    return { newA, newB };
}
