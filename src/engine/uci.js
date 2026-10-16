function parseInfoLine(tokens) {
  const result = { type: 'info' };
  for (let i = 1; i < tokens.length; i++) {
    const key = tokens[i];
    if (key === 'depth') result.depth = Number(tokens[++i]);
    else if (key === 'seldepth') result.seldepth = Number(tokens[++i]);
    else if (key === 'multipv') result.multipv = Number(tokens[++i]);
    else if (key === 'score') {
      const kind = tokens[++i];
      const value = Number(tokens[++i]);
      result.score = kind === 'mate' ? { mate: value } : { cp: value };
    } else if (key === 'nodes') result.nodes = Number(tokens[++i]);
    else if (key === 'nps') result.nps = Number(tokens[++i]);
    else if (key === 'time') result.time = Number(tokens[++i]);
    else if (key === 'pv') {
      result.pv = tokens.slice(i + 1);
      break;
    }
  }
  return result;
}

export function parseUciLine(line) {
  const trimmed = line.trim();
  const tokens = trimmed.split(/\s+/);

  if (tokens[0] === 'bestmove') {
    const ponderIdx = tokens.indexOf('ponder');
    return {
      type: 'bestmove',
      move: tokens[1] ?? null,
      ponder: ponderIdx !== -1 ? tokens[ponderIdx + 1] : null,
    };
  }
  if (tokens[0] === 'info') return parseInfoLine(tokens);
  if (trimmed === 'uciok') return { type: 'uciok' };
  if (trimmed === 'readyok') return { type: 'readyok' };
  return { type: 'other', raw: trimmed };
}

export function buildPositionCommand(fen) {
  return fen === 'startpos' ? 'position startpos' : `position fen ${fen}`;
}

export function buildGoCommand({ depth, movetime } = {}) {
  const parts = ['go'];
  if (depth != null) parts.push('depth', String(depth));
  if (movetime != null) parts.push('movetime', String(movetime));
  return parts.join(' ');
}

export function buildSetOptionCommand(name, value) {
  return `setoption name ${name} value ${value}`;
}

// Mate scores aren't on the centipawn scale at all; map them to a value
// far outside any realistic cp range so win-probability math saturates
// near 100%/0% without needing a separate mate-aware code path downstream.
const MATE_SCORE_CP = 10000;

export function scoreToCentipawns(score) {
  if (score.mate != null) return score.mate > 0 ? MATE_SCORE_CP : -MATE_SCORE_CP;
  return score.cp;
}

export function bestLineEvalCp(lines) {
  const principalLines = lines.filter((l) => l.multipv === 1 || l.multipv == null);
  const last = principalLines[principalLines.length - 1];
  return last ? scoreToCentipawns(last.score) : 0;
}
