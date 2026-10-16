import { describe, it, expect } from 'vitest';
import { extractFeatures } from './features.js';
import { sanMovesToFen } from '../content/fen.js';

describe('extractFeatures', () => {
  it('lists captures available to the side to move', () => {
    // Independently verified via direct chess.js query (not through this
    // module): after 1.e4 d5, White's only capture is exd5.
    const fen = sanMovesToFen(['e4', 'd5']);
    const features = extractFeatures(fen);

    expect(features.captures).toEqual([
      { san: 'exd5', from: 'e4', to: 'd5', captured: 'p' },
    ]);
  });

  it('lists moves that would give check', () => {
    // Hand-constructed minimal position (white rook d1, white king h1,
    // lone black king e8) with no other pieces, so check status is
    // reasoned geometrically, not copied from this module's own output.
    // Independently confirmed via direct chess.js query: both Rd8+ (same
    // rank as the king) and Re1+ (same file, clear path) give check.
    const fen = '4k3/8/8/8/8/8/8/3R3K w - - 0 1';
    const features = extractFeatures(fen);

    expect(features.checks.sort()).toEqual(['Rd8+', 'Re1+'].sort());
  });

  it('flags the side to move as in check', () => {
    // Hand-constructed, legal: White rook e1 has a clear file to Black's
    // king e8, and it's Black to move (the normal, legal shape of "just
    // got checked"). Independently confirmed via direct chess.js query.
    const inCheckFen = '4k3/8/8/8/8/8/8/4R2K b - - 0 1';
    expect(extractFeatures(inCheckFen).inCheck).toBe(true);
    expect(extractFeatures(sanMovesToFen(['e4', 'd5'])).inCheck).toBe(false);
  });

  it('identifies a piece attacked by the opponent with no defenders as hanging', () => {
    // Hand-constructed: black pawn e7 is attacked by the white queen on
    // e2 (clear file) and undefended (lone black king sits on a8, far
    // away). Independently confirmed via direct chess.js isAttacked calls.
    const fen = 'k7/4p3/8/8/8/8/4Q3/4K3 w - - 0 1';
    const features = extractFeatures(fen);

    expect(features.hangingPieces).toEqual([{ square: 'e7', type: 'p' }]);
  });

  it('flags a knight move that attacks two valuable pieces at once as a fork', () => {
    // Hand-constructed: White Nd5, Ke1 vs Black Ra8, Ke8, nothing else on
    // the board. Independently confirmed via direct chess.js calls: after
    // Nc7+, attackers('a8', 'w') and attackers('e8', 'w') both include
    // c7 — the knight forks the rook and gives check to the king. No
    // other legal move produces two simultaneous attacks like this.
    const fen = 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1';
    const features = extractFeatures(fen);

    expect(features.forks).toEqual([
      {
        san: 'Nc7+',
        from: 'd5',
        to: 'c7',
        targets: [
          { square: 'a8', type: 'r' },
          { square: 'e8', type: 'k' },
        ],
      },
    ]);
  });

  it('flags a move that adds a defender to an own hanging piece', () => {
    // Hand-constructed: White Ra1, Nb4, Ke1 vs Black Ra8, Ke8. Ra1 is
    // attacked along the open a-file by Black's rook and currently
    // undefended. Independently confirmed via direct chess.js calls:
    // isAttacked('a1', 'b') is true and isAttacked('a1', 'w') is false
    // beforehand; after Nc2, attackers('a1', 'w') includes c2.
    const fen = 'r3k3/8/8/8/1N6/8/8/R3K3 w - - 0 1';
    const features = extractFeatures(fen);

    expect(features.defends).toEqual([
      {
        san: 'Nc2',
        from: 'b4',
        to: 'c2',
        defended: [{ square: 'a1', type: 'r' }],
      },
    ]);
  });
});
