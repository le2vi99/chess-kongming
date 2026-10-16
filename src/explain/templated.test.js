import { describe, it, expect } from 'vitest';
import { buildTemplatedExplanation } from './templated.js';
import { extractFeatures } from './features.js';
import { sanMovesToFen } from '../content/fen.js';

describe('buildTemplatedExplanation', () => {
  it('calls out winning an undefended piece', () => {
    // Independently confirmed (features.test.js + direct chess.js query):
    // e7 pawn is attacked and undefended; Qxe7 is the real SAN for taking it.
    const features = extractFeatures('k7/4p3/8/8/8/8/4Q3/4K3 w - - 0 1');
    expect(buildTemplatedExplanation({ bestMoveSan: 'Qxe7', features })).toBe(
      'Qxe7 wins the undefended pawn on e7.'
    );
  });

  it('calls out a plain capture that is not hanging', () => {
    // Independently confirmed via direct chess.js query: after 1.e4 d5,
    // d5 is defended by the black queen (not hanging), so this should
    // fall through to the plain-capture phrasing.
    const features = extractFeatures(sanMovesToFen(['e4', 'd5']));
    expect(buildTemplatedExplanation({ bestMoveSan: 'exd5', features })).toBe(
      'exd5 captures the pawn on d5.'
    );
  });

  it('calls out a check when the move is not a capture', () => {
    const features = extractFeatures('4k3/8/8/8/8/8/8/3R3K w - - 0 1');
    expect(buildTemplatedExplanation({ bestMoveSan: 'Re1+', features })).toBe('Re1+ gives check.');
  });

  it('calls out a fork over any other reason', () => {
    // Reuses the fork fixture independently verified in features.test.js:
    // Nc7+ attacks both the rook on a8 and the king on e8 at once.
    const features = extractFeatures('r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1');
    expect(buildTemplatedExplanation({ bestMoveSan: 'Nc7+', features })).toBe(
      'Nc7+ forks the rook on a8 and the king on e8.'
    );
  });

  it('calls out defending a hanging piece when the move is not a capture, fork, or check', () => {
    // Reuses the defends fixture independently verified in features.test.js:
    // Nc2 adds a defender to the previously-hanging rook on a1.
    const features = extractFeatures('r3k3/8/8/8/1N6/8/8/R3K3 w - - 0 1');
    expect(buildTemplatedExplanation({ bestMoveSan: 'Nc2', features })).toBe(
      'Nc2 defends the rook on a1.'
    );
  });

  it('falls back to a generic line for a quiet, non-tactical move', () => {
    const features = extractFeatures('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(buildTemplatedExplanation({ bestMoveSan: 'Nf3', features })).toBe(
      "Nf3 is the engine's top choice here."
    );
  });
});
