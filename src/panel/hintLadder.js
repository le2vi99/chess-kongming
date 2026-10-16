const PIECE_NAMES = { N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };

function pieceNameFromSan(san) {
  return PIECE_NAMES[san[0]] ?? 'pawn';
}

export const HINT_LEVELS = { NUDGE: 1, PIECE: 2, MOVE: 3, EXPLANATION: 4 };
export const MAX_HINT_LEVEL = HINT_LEVELS.EXPLANATION;

export function getHint(level, { bestMoveSan, bestMoveFrom, bestMoveTo, features, explanation }) {
  const clampedLevel = Math.min(Math.max(level, HINT_LEVELS.NUDGE), MAX_HINT_LEVEL);

  if (clampedLevel === HINT_LEVELS.NUDGE) {
    const hasTactic =
      features.captures.length > 0 ||
      features.checks.length > 0 ||
      features.hangingPieces.length > 0 ||
      features.forks.length > 0;
    return {
      level: clampedLevel,
      text: hasTactic ? "There's a tactic here." : 'Take your time — look for the best move.',
    };
  }
  if (clampedLevel === HINT_LEVELS.PIECE) {
    return { level: clampedLevel, text: `Look at your ${pieceNameFromSan(bestMoveSan)} on ${bestMoveFrom}.` };
  }
  if (clampedLevel === HINT_LEVELS.MOVE) {
    return {
      level: clampedLevel,
      text: `Move your ${pieceNameFromSan(bestMoveSan)} from ${bestMoveFrom} to ${bestMoveTo}.`,
    };
  }
  return { level: clampedLevel, text: explanation };
}
