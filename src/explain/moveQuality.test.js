import { describe, it, expect } from 'vitest';
import { classifyMoveQuality, centipawnsToWinProbability, describeMoveQuality } from './moveQuality.js';

describe('centipawnsToWinProbability', () => {
  it('maps a dead-equal position to 50%', () => {
    // Exact by hand: 100 / (1 + 10^0) = 100 / 2 = 50.
    expect(centipawnsToWinProbability(0)).toBe(50);
  });
});

describe('classifyMoveQuality', () => {
  it('labels zero eval swing as best', () => {
    expect(classifyMoveQuality({ bestEvalCp: 0, playedEvalCp: 0 })).toBe('best');
  });

  it('treats the played move grading better than "best" as best (negative swing clamped to 0)', () => {
    expect(classifyMoveQuality({ bestEvalCp: 100, playedEvalCp: 150 })).toBe('best');
  });

  it('labels a small win-probability swing as good', () => {
    // Independently computed via the documented sigmoid formula:
    // winProb(800) - winProb(700) ≈ 0.76 points, within the "good" threshold.
    expect(classifyMoveQuality({ bestEvalCp: 800, playedEvalCp: 700 })).toBe('good');
  });

  it('labels a moderate win-probability swing as inaccuracy', () => {
    // Independently computed: winProb(900) - winProb(600) ≈ 2.51 points,
    // over the "good" threshold but within "inaccuracy".
    expect(classifyMoveQuality({ bestEvalCp: 900, playedEvalCp: 600 })).toBe('inaccuracy');
  });

  it('labels a larger win-probability swing as mistake', () => {
    // Independently computed: winProb(20) - winProb(-20) ≈ 5.75 points,
    // over "inaccuracy" but within "mistake".
    expect(classifyMoveQuality({ bestEvalCp: 20, playedEvalCp: -20 })).toBe('mistake');
  });

  it('labels a severe win-probability swing as blunder', () => {
    // Independently computed: winProb(300) - winProb(-100) ≈ 48.9 points,
    // well over the "mistake" threshold.
    expect(classifyMoveQuality({ bestEvalCp: 300, playedEvalCp: -100 })).toBe('blunder');
  });
});

describe('describeMoveQuality', () => {
  it('labels white and omits the percentage for a best move', () => {
    expect(describeMoveQuality('w', 0, 0)).toBe('White: Best');
  });

  it('labels black and omits the percentage for a best move', () => {
    expect(describeMoveQuality('b', 0, 0)).toBe('Black: Best');
  });

  it('labels the side, capitalizes the quality, and rounds the win-probability loss', () => {
    // Independently computed: winProb(300) - winProb(-100) ≈ 48.9 points,
    // rounding to 49.
    expect(describeMoveQuality('b', 300, -100)).toBe('Black: Blunder (-49%)');
  });
});
