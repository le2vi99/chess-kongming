// Real class convention confirmed live across every probe run against
// chess.com (see output.txt–output6.txt): `piece <color><type> square-<file><rank>`
// where square digits are 1-8 for a-h/1-8. These specific elements are
// re-encoded directly from the real final piece list captured in
// output4.txt (not invented squares), using that confirmed convention.
export const SINGLE_PAWN = '<div class="piece wp square-52"></div>'; // wp@e2

export const MIXED_BOARD_FRAGMENT = `
  <div class="piece bp square-17"></div>
  <div class="piece bp square-84"></div>
  <div class="piece br square-28"></div>
  <div class="piece wq square-48"></div>
  <div class="piece wq square-45"></div>
  <div class="piece wr square-68"></div>
`;

export const NON_PIECE_ELEMENT = '<div class="highlight square-52"></div>';
