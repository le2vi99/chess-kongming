import { describe, it, expect } from 'vitest';
import { parsePieceElement, extractPieces } from './pieces.js';
import { SINGLE_PAWN, MIXED_BOARD_FRAGMENT, NON_PIECE_ELEMENT } from '../../test/fixtures/pieceHtml.js';
import { elementFromHtml } from '../../test/helpers/dom.js';

describe('parsePieceElement', () => {
  it('decodes type and square from a real piece div', () => {
    const el = elementFromHtml(SINGLE_PAWN);
    expect(parsePieceElement(el)).toEqual({ type: 'wp', square: 'e2' });
  });

  it('returns null for an element with no piece/square classes', () => {
    const el = elementFromHtml(NON_PIECE_ELEMENT);
    expect(parsePieceElement(el)).toBeNull();
  });
});

describe('extractPieces', () => {
  it('extracts every piece from a multi-piece board fragment', () => {
    const container = document.createElement('div');
    container.innerHTML = MIXED_BOARD_FRAGMENT;

    expect(extractPieces(container)).toEqual([
      { type: 'bp', square: 'a7' },
      { type: 'bp', square: 'h4' },
      { type: 'br', square: 'b8' },
      { type: 'wq', square: 'd8' },
      { type: 'wq', square: 'd5' },
      { type: 'wr', square: 'f8' },
    ]);
  });
});
