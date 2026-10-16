import { describe, it, expect } from 'vitest';
import { isMainLinePly, plyToSAN, extractMainLineSAN } from './moveList.js';
import {
  PAWN_MOVE,
  PIECE_MOVE,
  CHECK_MOVE,
  PIECE_CAPTURE,
  PAWN_CAPTURE,
  PROMOTION,
  CHECKMATE,
  CASTLE_KINGSIDE,
  CASTLE_QUEENSIDE,
  EN_PASSANT,
  VARIATION_PLY,
  DISAMBIGUATED_MOVE_CONSTRUCTED,
} from '../../test/fixtures/plyNodeHtml.js';
import { MAIN_LINE_WITH_VARIATION, EXPECTED_MAIN_LINE_SAN } from '../../test/fixtures/moveListHtml.js';
import { elementFromHtml } from '../../test/helpers/dom.js';

describe('isMainLinePly', () => {
  it('is true for a node with the main-line-ply class', () => {
    expect(isMainLinePly(elementFromHtml(PAWN_MOVE))).toBe(true);
  });

  it('is false for a variation node lacking main-line-ply', () => {
    expect(isMainLinePly(elementFromHtml(VARIATION_PLY))).toBe(false);
  });
});

describe('plyToSAN', () => {
  it('reads a plain pawn move as-is', () => {
    expect(plyToSAN(elementFromHtml(PAWN_MOVE))).toBe('e4');
  });

  it('prefixes a piece move with its data-figurine letter', () => {
    expect(plyToSAN(elementFromHtml(PIECE_MOVE))).toBe('Bc4');
  });

  it('keeps the check symbol attached to a piece move', () => {
    expect(plyToSAN(elementFromHtml(CHECK_MOVE))).toBe('Qa5+');
  });

  it('keeps the capture "x" attached to a piece move', () => {
    expect(plyToSAN(elementFromHtml(PIECE_CAPTURE))).toBe('Bxa5');
  });

  it('reads a pawn capture as plain text (no figurine span)', () => {
    expect(plyToSAN(elementFromHtml(PAWN_CAPTURE))).toBe('dxe6');
  });

  it('reads promotion as plain text — chess.com renders no icon for it', () => {
    expect(plyToSAN(elementFromHtml(PROMOTION))).toBe('e8=Q');
  });

  it('keeps the checkmate symbol attached to a piece move', () => {
    expect(plyToSAN(elementFromHtml(CHECKMATE))).toBe('Qd5#');
  });

  it('reads kingside castling as the literal token', () => {
    expect(plyToSAN(elementFromHtml(CASTLE_KINGSIDE))).toBe('O-O');
  });

  it('reads queenside castling as the literal token', () => {
    expect(plyToSAN(elementFromHtml(CASTLE_QUEENSIDE))).toBe('O-O-O');
  });

  it('ignores the en-passant tooltip icon and reads the move as plain text', () => {
    expect(plyToSAN(elementFromHtml(EN_PASSANT))).toBe('exd6');
  });

  it('reconstructs a disambiguated move from figurine + rawText', () => {
    expect(plyToSAN(elementFromHtml(DISAMBIGUATED_MOVE_CONSTRUCTED))).toBe('Nbd2');
  });
});

describe('extractMainLineSAN', () => {
  it('returns only main-line plies, excluding a variation branch', () => {
    const container = document.createElement('div');
    container.innerHTML = MAIN_LINE_WITH_VARIATION;
    const moveListRoot = container.querySelector('wc-move-list');

    expect(extractMainLineSAN(moveListRoot)).toEqual(EXPECTED_MAIN_LINE_SAN);
  });
});
