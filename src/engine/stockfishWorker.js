// Browser/Worker glue only — no logic lives here. Command/response parsing
// is in uci.js (unit tested). Not unit tested per the same reasoning as
// board.js: this only makes sense running inside a real Worker talking to
// the real Stockfish binary.
//
// Vendored at vendor/stockfish/{stockfish.js,stockfish.wasm}: Stockfish.js 19,
// "lite, single-threaded" build (~1.9MB). Single-threaded so it runs in a
// plain Worker without cross-origin-isolation headers; "lite" so the
// NNUE net stays small — still far stronger than any human opponent.
import { parseUciLine, buildPositionCommand, buildGoCommand, buildSetOptionCommand } from './uci.js';

const DEFAULT_WORKER_PATH = 'vendor/stockfish/stockfish.js';

export function createStockfishClient(workerPath = DEFAULT_WORKER_PATH) {
  // Resolve against the extension root, not the calling document's URL —
  // the side panel lives at dist/panel/panel.html, two levels below vendor/.
  const worker = new Worker(chrome.runtime.getURL(workerPath));
  const listeners = new Set();
  // The engine is a single search at a time. Without this queue, a second
  // getBestMove() call issued before the first's "bestmove" arrives would
  // register a second listener — and worker.onmessage broadcasts every
  // message to all listeners, so an older in-flight search's answer could
  // resolve a newer call's promise with a stale, wrong-side move.
  let queue = Promise.resolve();

  worker.onmessage = (event) => {
    const parsed = parseUciLine(event.data);
    for (const listener of listeners) listener(parsed);
  };

  function send(command) {
    worker.postMessage(command);
  }

  send('uci');
  send(buildSetOptionCommand('MultiPV', 3));

  function runSearch(fen, { depth = 15 } = {}) {
    return new Promise((resolve, reject) => {
      const infoLines = [];
      const onError = (err) => {
        listeners.delete(onMessage);
        reject(err);
      };
      const onMessage = (parsed) => {
        if (parsed.type === 'info' && parsed.score) infoLines.push(parsed);
        if (parsed.type === 'bestmove') {
          listeners.delete(onMessage);
          worker.removeEventListener('error', onError);
          resolve({ bestmove: parsed, lines: infoLines });
        }
      };
      listeners.add(onMessage);
      worker.addEventListener('error', onError, { once: true });
      send(buildPositionCommand(fen));
      send(buildGoCommand({ depth }));
    });
  }

  function getBestMove(fen, opts) {
    const result = queue.then(() => runSearch(fen, opts));
    queue = result.catch(() => {});
    return result;
  }

  function terminate() {
    worker.terminate();
  }

  return { getBestMove, terminate };
}
