import { Chess } from 'chess.js';

// Pawns don't count as fork/defend targets worth flagging to a learner —
// only pieces and the king (a check-plus-attack is still colloquially a
// "fork" even though the king can't actually be captured).
const FORK_TARGET_TYPES = new Set(['n', 'b', 'r', 'q', 'k']);

function findHangingPieces(chess, pieceColor, attackerColor) {
  return chess
    .board()
    .flat()
    .filter(Boolean)
    .filter((p) => p.color === pieceColor)
    .filter((p) => chess.isAttacked(p.square, attackerColor) && !chess.isAttacked(p.square, pieceColor))
    .map((p) => ({ square: p.square, type: p.type }));
}

function findForks(chess, verboseMoves, sideToMove, opponent) {
  const forks = [];
  for (const m of verboseMoves) {
    const after = new Chess(chess.fen());
    after.move({ from: m.from, to: m.to, promotion: m.promotion });

    const targets = after
      .board()
      .flat()
      .filter(Boolean)
      .filter((p) => p.color === opponent && FORK_TARGET_TYPES.has(p.type))
      .filter((p) => after.attackers(p.square, sideToMove).includes(m.to))
      .map((p) => ({ square: p.square, type: p.type }));

    if (targets.length >= 2) {
      forks.push({ san: m.san, from: m.from, to: m.to, targets });
    }
  }
  return forks;
}

function findDefendingMoves(chess, verboseMoves, ownHangingPieces, sideToMove) {
  if (ownHangingPieces.length === 0) return [];

  const defends = [];
  for (const m of verboseMoves) {
    const after = new Chess(chess.fen());
    after.move({ from: m.from, to: m.to, promotion: m.promotion });

    const defended = ownHangingPieces.filter(
      (p) => p.square !== m.from && after.attackers(p.square, sideToMove).length > 0
    );

    if (defended.length > 0) {
      defends.push({ san: m.san, from: m.from, to: m.to, defended });
    }
  }
  return defends;
}

export function extractFeatures(fen) {
  const chess = new Chess(fen);
  const sideToMove = chess.turn();
  const opponent = sideToMove === 'w' ? 'b' : 'w';

  const verboseMoves = chess.moves({ verbose: true });

  const captures = verboseMoves
    .filter((m) => m.flags.includes('c') || m.flags.includes('e'))
    .map((m) => ({ san: m.san, from: m.from, to: m.to, captured: m.captured }));

  const checks = verboseMoves.filter((m) => m.san.includes('+') || m.san.includes('#')).map((m) => m.san);

  const hangingPieces = findHangingPieces(chess, opponent, sideToMove);
  const ownHangingPieces = findHangingPieces(chess, sideToMove, opponent);
  const forks = findForks(chess, verboseMoves, sideToMove, opponent);
  const defends = findDefendingMoves(chess, verboseMoves, ownHangingPieces, sideToMove);

  return { sideToMove, inCheck: chess.inCheck(), captures, checks, hangingPieces, forks, defends };
}
