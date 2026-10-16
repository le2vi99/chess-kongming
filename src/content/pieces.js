const FILES = 'abcdefgh';

export function parsePieceElement(el) {
  const classes = [...el.classList];
  const type = classes.find((c) => /^[wb][pnbrqk]$/.test(c));
  const squareClass = classes.find((c) => /^square-\d\d$/.test(c));
  if (!type || !squareClass) return null;
  const file = FILES[+squareClass[7] - 1];
  const rank = squareClass[8];
  return { type, square: `${file}${rank}` };
}

export function extractPieces(root) {
  return [...root.querySelectorAll('.piece')]
    .map(parsePieceElement)
    .filter(Boolean);
}
