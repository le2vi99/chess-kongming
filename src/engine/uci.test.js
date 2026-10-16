import { describe, it, expect } from 'vitest';
import {
  parseUciLine,
  buildPositionCommand,
  buildGoCommand,
  buildSetOptionCommand,
  scoreToCentipawns,
  bestLineEvalCp,
} from './uci.js';

describe('parseUciLine', () => {
  it('parses a bestmove line with no ponder', () => {
    expect(parseUciLine('bestmove e2e4')).toEqual({ type: 'bestmove', move: 'e2e4', ponder: null });
  });

  it('parses a bestmove line with a ponder move', () => {
    expect(parseUciLine('bestmove d2d4 ponder d7d5')).toEqual({
      type: 'bestmove',
      move: 'd2d4',
      ponder: 'd7d5',
    });
  });

  it('parses a full info line with centipawn score and principal variation', () => {
    expect(
      parseUciLine('info depth 10 seldepth 15 multipv 1 score cp 34 nodes 123456 nps 800000 time 150 pv e2e4 e7e5 g1f3')
    ).toEqual({
      type: 'info',
      depth: 10,
      seldepth: 15,
      multipv: 1,
      score: { cp: 34 },
      nodes: 123456,
      nps: 800000,
      time: 150,
      pv: ['e2e4', 'e7e5', 'g1f3'],
    });
  });

  it('parses a mate score', () => {
    expect(parseUciLine('info depth 12 score mate 3 pv d1h5 e8e7 h5f7')).toEqual({
      type: 'info',
      depth: 12,
      score: { mate: 3 },
      pv: ['d1h5', 'e8e7', 'h5f7'],
    });
  });

  it('parses the uciok handshake line', () => {
    expect(parseUciLine('uciok')).toEqual({ type: 'uciok' });
  });

  it('parses the readyok handshake line', () => {
    expect(parseUciLine('readyok')).toEqual({ type: 'readyok' });
  });

  it('passes through unrecognized lines as "other"', () => {
    expect(parseUciLine('id name Stockfish 16')).toEqual({ type: 'other', raw: 'id name Stockfish 16' });
  });
});

describe('buildPositionCommand', () => {
  it('builds the startpos command', () => {
    expect(buildPositionCommand('startpos')).toBe('position startpos');
  });

  it('builds a position command from a FEN', () => {
    expect(buildPositionCommand('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')).toBe(
      'position fen rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    );
  });
});

describe('buildGoCommand', () => {
  it('builds a depth-limited search command', () => {
    expect(buildGoCommand({ depth: 15 })).toBe('go depth 15');
  });

  it('builds a time-limited search command', () => {
    expect(buildGoCommand({ movetime: 1000 })).toBe('go movetime 1000');
  });
});

describe('buildSetOptionCommand', () => {
  it('builds a setoption command for MultiPV', () => {
    expect(buildSetOptionCommand('MultiPV', 3)).toBe('setoption name MultiPV value 3');
  });
});

describe('scoreToCentipawns', () => {
  it('passes through a centipawn score unchanged', () => {
    expect(scoreToCentipawns({ cp: 34 })).toBe(34);
  });

  it('maps a positive mate score (mating) to a large positive value', () => {
    expect(scoreToCentipawns({ mate: 3 })).toBe(10000);
  });

  it('maps a negative mate score (getting mated) to a large negative value', () => {
    expect(scoreToCentipawns({ mate: -2 })).toBe(-10000);
  });
});

describe('bestLineEvalCp', () => {
  it('returns 0 for no lines', () => {
    expect(bestLineEvalCp([])).toBe(0);
  });

  it('takes the score from the deepest principal (multipv 1) line', () => {
    const lines = [
      { type: 'info', depth: 5, multipv: 1, score: { cp: 10 }, pv: ['e2e4'] },
      { type: 'info', depth: 10, multipv: 1, score: { cp: 34 }, pv: ['e2e4', 'e7e5'] },
    ];
    expect(bestLineEvalCp(lines)).toBe(34);
  });

  it('ignores non-principal MultiPV lines', () => {
    const lines = [
      { type: 'info', depth: 10, multipv: 1, score: { cp: 34 }, pv: ['e2e4'] },
      { type: 'info', depth: 10, multipv: 2, score: { cp: 20 }, pv: ['d2d4'] },
    ];
    expect(bestLineEvalCp(lines)).toBe(34);
  });

  it('treats a line with no multipv field as principal', () => {
    const lines = [{ type: 'info', depth: 10, score: { cp: 50 }, pv: ['e2e4'] }];
    expect(bestLineEvalCp(lines)).toBe(50);
  });
});
