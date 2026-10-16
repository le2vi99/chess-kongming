import { Chess } from 'chess.js';

export function sanFromUciMove(fen, uciMove) {
  const chess = new Chess(fen);
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

  try {
    return chess.move({ from, to, promotion }).san;
  } catch (err) {
    throw new Error(`Illegal UCI move "${uciMove}" for FEN "${fen}": ${err.message}`);
  }
}
