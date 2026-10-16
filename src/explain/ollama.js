import { buildTemplatedExplanation } from './templated.js';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2.5:7b';

export function buildNarrationPrompt({ bestMoveSan, features, fen }) {
  return [
    'You are a chess tutor. Explain the engine-chosen move in 1-2 plain-language sentences.',
    'Do not suggest a different move. Do not invent facts beyond what is given — only call a move',
    'a "fork" or say it "defends" a piece if the facts below say so.',
    `FEN: ${fen}`,
    `Best move: ${bestMoveSan}`,
    `Facts: inCheck=${features.inCheck}, captures=${JSON.stringify(features.captures.map((c) => c.san))}, checks=${JSON.stringify(features.checks)}, hangingPieces=${JSON.stringify(features.hangingPieces)}, forks=${JSON.stringify(features.forks)}, defends=${JSON.stringify(features.defends)}`,
  ].join('\n');
}

export async function explainWithOllama(
  { bestMoveSan, features, fen },
  { baseUrl = DEFAULT_BASE_URL, model = DEFAULT_MODEL, fetchImpl = fetch } = {}
) {
  try {
    const res = await fetchImpl(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: buildNarrationPrompt({ bestMoveSan, features, fen }),
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
    const data = await res.json();
    return data.response.trim();
  } catch {
    return buildTemplatedExplanation({ bestMoveSan, features });
  }
}
