const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

function pieceName(type) {
  return PIECE_NAMES[type] ?? 'piece';
}

function describeTargets(targets) {
  return targets.map((t) => `${pieceName(t.type)} on ${t.square}`).join(' and the ');
}

export function buildTemplatedExplanation({ bestMoveSan, features }) {
  const fork = features.forks.find((f) => f.san === bestMoveSan);
  if (fork) {
    return `${bestMoveSan} forks the ${describeTargets(fork.targets)}.`;
  }

  const targetSquare = bestMoveSan.match(/([a-h][1-8])[+#]?$/)?.[1];
  const hangingTarget = targetSquare && features.hangingPieces.find((p) => p.square === targetSquare);
  if (hangingTarget) {
    return `${bestMoveSan} wins the undefended ${pieceName(hangingTarget.type)} on ${hangingTarget.square}.`;
  }

  const capture = features.captures.find((c) => c.san === bestMoveSan);
  if (capture) {
    return `${bestMoveSan} captures the ${pieceName(capture.captured)} on ${capture.to}.`;
  }

  const defend = features.defends.find((d) => d.san === bestMoveSan);
  if (defend) {
    return `${bestMoveSan} defends the ${describeTargets(defend.defended)}.`;
  }

  if (features.checks.includes(bestMoveSan)) {
    return `${bestMoveSan} gives check.`;
  }

  return `${bestMoveSan} is the engine's top choice here.`;
}
