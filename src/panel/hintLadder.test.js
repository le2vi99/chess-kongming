import { describe, it, expect } from 'vitest';
import { getHint, HINT_LEVELS, MAX_HINT_LEVEL } from './hintLadder.js';
import { extractFeatures } from '../explain/features.js';

const TACTICAL_FEATURES = extractFeatures('k7/4p3/8/8/8/8/4Q3/4K3 w - - 0 1'); // Qxe7 available
const QUIET_FEATURES = extractFeatures('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

describe('getHint', () => {
  it('nudge level mentions a tactic when one is available', () => {
    const hint = getHint(HINT_LEVELS.NUDGE, {
      bestMoveSan: 'Qxe7',
      features: TACTICAL_FEATURES,
      explanation: 'irrelevant at this level',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.NUDGE, text: "There's a tactic here." });
  });

  it('nudge level gives a generic prompt when no tactic is available', () => {
    const hint = getHint(HINT_LEVELS.NUDGE, {
      bestMoveSan: 'Nf3',
      features: QUIET_FEATURES,
      explanation: 'irrelevant at this level',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.NUDGE, text: 'Take your time — look for the best move.' });
  });

  it('nudge level mentions a tactic when the only signal is a fork (no capture/check of its own)', () => {
    // getHint only reads features.forks.length here, so a minimal
    // synthetic features object isolates that branch directly — a fork
    // can exist on a move that is itself neither a capture nor a check
    // (the threat lands only once the piece arrives).
    const forkOnlyFeatures = { captures: [], checks: [], hangingPieces: [], forks: [{ san: 'Nd2' }] };
    const hint = getHint(HINT_LEVELS.NUDGE, {
      bestMoveSan: 'Nd2',
      features: forkOnlyFeatures,
      explanation: 'irrelevant at this level',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.NUDGE, text: "There's a tactic here." });
  });

  it('piece level names the piece and its current square, for a piece move', () => {
    const hint = getHint(HINT_LEVELS.PIECE, {
      bestMoveSan: 'Qxe7',
      bestMoveFrom: 'e2',
      features: TACTICAL_FEATURES,
      explanation: 'irrelevant at this level',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.PIECE, text: 'Look at your queen on e2.' });
  });

  it('piece level calls it a pawn when the SAN has no piece letter', () => {
    const hint = getHint(HINT_LEVELS.PIECE, {
      bestMoveSan: 'e4',
      bestMoveFrom: 'e2',
      features: QUIET_FEATURES,
      explanation: 'irrelevant at this level',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.PIECE, text: 'Look at your pawn on e2.' });
  });

  it('move level gives the piece, its square, and the destination square', () => {
    const hint = getHint(HINT_LEVELS.MOVE, {
      bestMoveSan: 'Qxe7',
      bestMoveFrom: 'e2',
      bestMoveTo: 'e7',
      features: TACTICAL_FEATURES,
      explanation: 'irrelevant at this level',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.MOVE, text: 'Move your queen from e2 to e7.' });
  });

  it('explanation level returns the full explanation text', () => {
    const hint = getHint(HINT_LEVELS.EXPLANATION, {
      bestMoveSan: 'Qxe7',
      features: TACTICAL_FEATURES,
      explanation: 'Qxe7 wins the undefended pawn on e7.',
    });
    expect(hint).toEqual({ level: HINT_LEVELS.EXPLANATION, text: 'Qxe7 wins the undefended pawn on e7.' });
  });

  it('clamps a level above the max down to the explanation level', () => {
    const hint = getHint(99, {
      bestMoveSan: 'Qxe7',
      features: TACTICAL_FEATURES,
      explanation: 'full text',
    });
    expect(hint.level).toBe(MAX_HINT_LEVEL);
  });

  it('clamps a level below 1 up to the nudge level', () => {
    const hint = getHint(0, {
      bestMoveSan: 'Qxe7',
      features: TACTICAL_FEATURES,
      explanation: 'full text',
    });
    expect(hint.level).toBe(HINT_LEVELS.NUDGE);
  });
});
