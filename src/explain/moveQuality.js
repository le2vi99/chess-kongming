// Win-probability-swing thresholds, not flat centipawn loss. Rationale:
// losing 100cp in a dead-equal position is a real mistake; losing 100cp
// from +800 is noise a flat threshold can't tell apart. Converting both
// evals to a win-probability and comparing the swing does. The sigmoid
// scale and the swing thresholds below are a documented convention for
// this project (same spirit as Lichess's win% model, not its exact
// curve, and chess.com's grading is undisclosed/ML-based anyway) — tune
// freely; nothing elsewhere depends on these exact numbers.
const WIN_PROB_SIGMOID_SCALE = 400;

export const WIN_PROB_LOSS_THRESHOLDS = {
  good: 2,
  inaccuracy: 5,
  mistake: 10,
};

export function centipawnsToWinProbability(cp) {
  return 100 / (1 + 10 ** (-cp / WIN_PROB_SIGMOID_SCALE));
}

export function classifyMoveQuality({ bestEvalCp, playedEvalCp }) {
  const winProbLoss = Math.max(
    0,
    centipawnsToWinProbability(bestEvalCp) - centipawnsToWinProbability(playedEvalCp)
  );
  if (winProbLoss === 0) return 'best';
  if (winProbLoss <= WIN_PROB_LOSS_THRESHOLDS.good) return 'good';
  if (winProbLoss <= WIN_PROB_LOSS_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (winProbLoss <= WIN_PROB_LOSS_THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}

const SIDE_LABELS = { w: 'White', b: 'Black' };

export function describeMoveQuality(moverColor, bestEvalCp, playedEvalCp) {
  const quality = classifyMoveQuality({ bestEvalCp, playedEvalCp });
  const sideLabel = SIDE_LABELS[moverColor];
  const capitalizedQuality = quality[0].toUpperCase() + quality.slice(1);
  if (quality === 'best') return `${sideLabel}: ${capitalizedQuality}`;

  const winProbLoss = Math.max(
    0,
    centipawnsToWinProbability(bestEvalCp) - centipawnsToWinProbability(playedEvalCp)
  );
  return `${sideLabel}: ${capitalizedQuality} (-${winProbLoss.toFixed(0)}%)`;
}
