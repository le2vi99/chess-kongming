import { describe, it, expect } from 'vitest';
import { buildGameState } from './gameState.js';
import { sanMovesToFen } from './fen.js';
import { MAIN_LINE_WITH_VARIATION, EXPECTED_MAIN_LINE_SAN } from '../../test/fixtures/moveListHtml.js';

describe('buildGameState', () => {
  it('wires main-line extraction into FEN replay, ignoring variation plies', () => {
    const container = document.createElement('div');
    container.innerHTML = MAIN_LINE_WITH_VARIATION;
    const moveListRoot = container.querySelector('wc-move-list');

    const state = buildGameState(moveListRoot);

    expect(state.sanMoves).toEqual(EXPECTED_MAIN_LINE_SAN);
    expect(state.fen).toBe(sanMovesToFen(EXPECTED_MAIN_LINE_SAN));
  });
});
