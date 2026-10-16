import { Chess } from 'chess.js';

export function sanMovesToFen(sanMoves) {
  const chess = new Chess();
  for (const san of sanMoves) {
    try {
      chess.move(san);
    } catch (err) {
      throw new Error(`Illegal or unparseable SAN move "${san}" at ply ${chess.history().length + 1}: ${err.message}`);
    }
  }
  return chess.fen();
}
