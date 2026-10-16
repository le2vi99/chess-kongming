// Side-panel UI glue — no business logic. All decisions (what to say,
// how to grade a move, what hint to show) live in the already-tested
// modules this imports. Not unit tested, same reasoning as board.js: this
// only makes sense wired to a real chrome.storage session and a real
// Stockfish worker.
import { createStockfishClient } from '../engine/stockfishWorker.js';
import { sanFromUciMove } from '../engine/sanFromUci.js';
import { bestLineEvalCp } from '../engine/uci.js';
import { extractFeatures } from '../explain/features.js';
import { explainWithOllama } from '../explain/ollama.js';
import { describeMoveQuality } from '../explain/moveQuality.js';
import { getHint, HINT_LEVELS } from './hintLadder.js';

const MAX_RECENT_MOVE_GRADES = 5;

const stockfish = createStockfishClient();

let currentHintLevel = HINT_LEVELS.NUDGE;
let currentAnalysis = null;
// The engine's eval of the previously analyzed position, from its mover's
// perspective — the baseline the next position's outcome gets graded
// against. null before the first analysis, since there's nothing yet to
// compare the very first observed position to.
let previousBestEvalCp = null;
let recentMoveGrades = [];

const hintText = document.getElementById('hint-text');
const nextHintButton = document.getElementById('next-hint');
const moveGradesList = document.getElementById('move-grades');

function renderHint() {
  if (!currentAnalysis) return;
  hintText.textContent = getHint(currentHintLevel, currentAnalysis).text;
}

function recordMoveGrade(moverColor, bestEvalCp, playedEvalCp) {
  const label = describeMoveQuality(moverColor, bestEvalCp, playedEvalCp);
  // Newest first, since a bot reply can land and grade within a second or
  // two of your own move — without a short visible history, one grade
  // overwrites the other before you can read it.
  recentMoveGrades = [label, ...recentMoveGrades].slice(0, MAX_RECENT_MOVE_GRADES);
  moveGradesList.replaceChildren(
    ...recentMoveGrades.map((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    })
  );
}

async function analyzePosition(fen) {
  const { bestmove, lines } = await stockfish.getBestMove(fen, { depth: 15 });
  const currentBestEvalCp = bestLineEvalCp(lines);
  const features = extractFeatures(fen);

  // features.sideToMove is whoever moves NEXT from this position, so the
  // mover who just played to reach it is the other side. currentBestEvalCp
  // is this position's eval from that next-mover's perspective; negate it
  // to grade the move just played, from its own mover's perspective,
  // against the previous position's best-move eval.
  if (previousBestEvalCp != null) {
    const moverColor = features.sideToMove === 'w' ? 'b' : 'w';
    recordMoveGrade(moverColor, previousBestEvalCp, -currentBestEvalCp);
  }
  previousBestEvalCp = currentBestEvalCp;

  const bestMoveSan = sanFromUciMove(fen, bestmove.move);
  const bestMoveFrom = bestmove.move.slice(0, 2);
  const bestMoveTo = bestmove.move.slice(2, 4);
  const explanation = await explainWithOllama({ bestMoveSan, features, fen });

  currentAnalysis = { bestMoveSan, bestMoveFrom, bestMoveTo, features, explanation };
  currentHintLevel = HINT_LEVELS.NUDGE;
  renderHint();
}

nextHintButton.addEventListener('click', () => {
  currentHintLevel += 1;
  renderHint();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'session' && changes.latestGameState) {
    analyzePosition(changes.latestGameState.newValue.fen).catch((err) =>
      console.error('[chess-kongming] analysis failed:', err)
    );
  }
});

chrome.storage.session.get('latestGameState').then((result) => {
  if (result.latestGameState?.fen) {
    analyzePosition(result.latestGameState.fen).catch((err) =>
      console.error('[chess-kongming] initial analysis failed:', err)
    );
  }
});
