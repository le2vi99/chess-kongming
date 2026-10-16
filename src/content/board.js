// Browser/extension glue only — no logic lives here. All actual parsing
// and FEN replay is in gameState.js (and the modules it composes), which
// are unit tested. This file just wires the live page to that pipeline.
// Not unit tested per project decision: mocking MutationObserver + the
// chrome.runtime extension API would mostly test the mocks, not real
// behavior. Verify by loading as an unpacked extension on a bot game or
// the analysis board and checking the console/background logs.
import { buildGameState } from './gameState.js';

const DEBOUNCE_MS = 150;
const MOVE_LIST_SELECTOR = 'wc-simple-move-list, wc-move-list';
const MOVE_LIST_WARNING_MS = 10000;

function findMoveListRoot() {
  return document.querySelector(MOVE_LIST_SELECTOR);
}

// chess.com is a SPA: at document_idle the static DOM has loaded, but the
// move-list custom element is mounted later by the page's own JS once a
// game starts. A user can sit on the bot-picker screen for any length of
// time before starting a game, so this must never give up and stop
// watching — a one-shot timeout here previously meant the content script
// permanently quit before the game even started, silently reporting
// nothing for the rest of the page's life. The 10s log is diagnostic only.
function waitForMoveListRoot() {
  return new Promise((resolve) => {
    const existing = findMoveListRoot();
    if (existing) return resolve(existing);

    const warnTimer = setTimeout(() => {
      console.warn('[chess-kongming] move list still not found after 10s, still watching...');
    }, MOVE_LIST_WARNING_MS);

    const observer = new MutationObserver(() => {
      const root = findMoveListRoot();
      if (root) {
        clearTimeout(warnTimer);
        observer.disconnect();
        resolve(root);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}

function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function reportGameState(moveListRoot) {
  try {
    const state = buildGameState(moveListRoot);
    chrome.runtime.sendMessage({ type: 'chess-kongming/game-state', ...state });
  } catch (err) {
    console.error('[chess-kongming] failed to build game state:', err);
  }
}

export async function startWatching() {
  const moveListRoot = await waitForMoveListRoot();

  const debouncedReport = debounce(() => reportGameState(moveListRoot), DEBOUNCE_MS);
  const observer = new MutationObserver(debouncedReport);
  observer.observe(moveListRoot, { childList: true, subtree: true, characterData: true });

  reportGameState(moveListRoot);
  return observer;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWatching);
  } else {
    startWatching();
  }
}
