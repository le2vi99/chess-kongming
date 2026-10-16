import { describe, it, expect } from 'vitest';
import { sanMovesToFen } from './fen.js';

describe('sanMovesToFen', () => {
  it('matches the standard FEN after 1.e4 — no en-passant target since no capture is possible', () => {
    // Independent source of truth: board placement, side to move, castling
    // rights, halfmove/fullmove counters are the textbook FEN for this
    // position. The en-passant field is intentionally "-": chess.js uses
    // the modern/strict FEN convention (same as Stockfish) where that field
    // is only set when a pawn could actually capture en passant — no black
    // pawn is adjacent to e4 yet, confirmed via direct chess.js testing,
    // not assumed.
    expect(sanMovesToFen(['e4'])).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    );
  });

  it('sets the en-passant target square when a capture is actually possible', () => {
    // After 1.e4 d6 2.e5 f5, black's f5 pawn can capture en passant on e6.
    expect(sanMovesToFen(['e4', 'd6', 'e5', 'f5'])).toBe(
      'rnbqkbnr/ppp1p1pp/3p4/4Pp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3'
    );
  });

  it('throws a descriptive error on an illegal/unparseable SAN move', () => {
    expect(() => sanMovesToFen(['e4', 'Qh9'])).toThrow(/Qh9/);
  });
});
