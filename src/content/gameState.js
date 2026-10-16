import { extractMainLineSAN } from './moveList.js';
import { sanMovesToFen } from './fen.js';

export function buildGameState(moveListRoot) {
  const sanMoves = extractMainLineSAN(moveListRoot);
  const fen = sanMovesToFen(sanMoves);
  return { sanMoves, fen };
}
