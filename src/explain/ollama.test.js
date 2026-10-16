import { describe, it, expect, vi } from 'vitest';
import { buildNarrationPrompt, explainWithOllama } from './ollama.js';
import { buildTemplatedExplanation } from './templated.js';
import { extractFeatures } from './features.js';

const FEN = 'k7/4p3/8/8/8/8/4Q3/4K3 w - - 0 1';
const BEST_MOVE = 'Qxe7';
const FEATURES = extractFeatures(FEN);

describe('buildNarrationPrompt', () => {
  it('includes the FEN and best move so the model has grounded facts', () => {
    const prompt = buildNarrationPrompt({ bestMoveSan: BEST_MOVE, features: FEATURES, fen: FEN });
    expect(prompt).toContain(FEN);
    expect(prompt).toContain(BEST_MOVE);
  });

  it('includes forks and defends facts so the model can narrate them without guessing', () => {
    // Reuses the fork fixture independently verified in features.test.js.
    const forkFeatures = extractFeatures('r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1');
    const prompt = buildNarrationPrompt({ bestMoveSan: 'Nc7+', features: forkFeatures, fen: 'irrelevant' });
    expect(prompt).toContain('forks=');
    expect(prompt).toContain('"a8"');
    expect(prompt).toContain('defends=');
  });
});

describe('explainWithOllama', () => {
  it('returns the trimmed model response on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: '  Qxe7 wins a free pawn.  ' }),
    });

    const result = await explainWithOllama(
      { bestMoveSan: BEST_MOVE, features: FEATURES, fen: FEN },
      { fetchImpl }
    );

    expect(result).toBe('Qxe7 wins a free pawn.');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('falls back to the templated explanation when the request throws', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('connection refused'));

    const result = await explainWithOllama(
      { bestMoveSan: BEST_MOVE, features: FEATURES, fen: FEN },
      { fetchImpl }
    );

    expect(result).toBe(buildTemplatedExplanation({ bestMoveSan: BEST_MOVE, features: FEATURES }));
  });

  it('falls back to the templated explanation on a non-ok HTTP response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await explainWithOllama(
      { bestMoveSan: BEST_MOVE, features: FEATURES, fen: FEN },
      { fetchImpl }
    );

    expect(result).toBe(buildTemplatedExplanation({ bestMoveSan: BEST_MOVE, features: FEATURES }));
  });
});
