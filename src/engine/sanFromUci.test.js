import { describe, it, expect } from 'vitest';
import { sanFromUciMove } from './sanFromUci.js';

describe('sanFromUciMove', () => {
  it('converts a plain pawn move', () => {
    expect(sanFromUciMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e4')).toBe('e4');
  });

  it('converts a 5-character UCI promotion move, independently confirmed via chess.js', () => {
    expect(sanFromUciMove('k7/4P3/8/8/8/8/8/4K3 w - - 0 1', 'e7e8q')).toBe('e8=Q+');
  });

  it('throws a descriptive error for an illegal UCI move', () => {
    expect(() => sanFromUciMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2e5')).toThrow(
      /e2e5/
    );
  });
});
