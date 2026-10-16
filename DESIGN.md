# chess-kongming — design notes

A Chrome extension that watches the chess.com board, asks a **local** engine for the best move, and shows a teaching explanation in a side panel.

Status (2026-10-12): core pipeline implemented and verified live against a real unpacked extension (see §9 for the full rundown and what's left). Board selectors below were confirmed via `probe.js` runs against both `chess.com/play/computer` and `chess.com/analysis` (see `output.txt`–`output6.txt`) — the "not verified live" caveat that used to be here no longer applies.

---

## 1. Fair-play scope (read first)

Chess.com's fair-play rules forbid outside assistance in games against other people, and they actively detect it. Getting suggestions in live human games will get the account closed.

So the extension hard-gates itself to:

- `https://www.chess.com/play/computer*` (bot games)
- `https://www.chess.com/analysis*` and game review of **finished** games

Enforce this in `manifest.json` `matches` *and* in code (refuse to run if a live-game element is present). Check chess.com's current fair-play policy for bot games yourself — I haven't confirmed whether they treat assisted bot games differently.

---

## 2. Recommendation: Chrome extension + Side Panel — yes

Chrome MV3 has a first-class Side Panel API (`chrome.sidePanel`), the same surface the Claude extension uses. It's the right shape:

| Option | Verdict |
|---|---|
| **MV3 extension + side panel** | ✅ Persistent UI beside the board, reads DOM directly, no screen capture |
| Userscript (Tampermonkey) | Faster to prototype, but UI must be injected into chess.com's page — cramped, fragile |
| Desktop app with screen capture / OCR | Overkill; DOM already has exact piece positions |
| Overlay arrows on the board | Nice later add-on, not the core UI |

---

## 3. Key design decision: engine ≠ LLM

**Don't let an LLM pick moves.** Even good local LLMs blunder and hallucinate illegal moves. Split the job:

1. **Stockfish (local)** decides: best move, top-3 lines (MultiPV), eval, principal variation.
2. **Feature extractor (chess.js, in JS)** computes facts: hanging pieces, checks, captures, threats, forks, what the PV wins/loses.
3. **Local LLM (Ollama)** only *narrates* those facts in teaching language. It never computes the move.

This keeps the move strong and the explanation grounded.

### Stockfish options

| | Pros | Cons |
|---|---|---|
| **stockfish.wasm in the extension** (recommended to start) | Zero install, runs in a Web Worker / offscreen document | ~1/3–1/2 native speed; still far beyond human strength |
| Native Stockfish via small local server (or Chrome native messaging) | Full speed | Extra install step |

**Decided: stockfish.wasm.** Vendored at `vendor/stockfish/{stockfish.js,stockfish.wasm}` — Stockfish.js 19, "lite, single-threaded" build (~1.9MB total). Single-threaded avoids needing cross-origin-isolation headers (`COOP`/`COEP`) in the extension page; "lite" keeps the NNUE net small. Verified end-to-end via a real UCI session (uci → isready → position → go → bestmove) before vendoring, and confirmed working live in the actual side panel. `manifest.json` needs `content_security_policy.extension_pages` with `wasm-unsafe-eval` for WASM compilation to be allowed at all under MV3's default CSP. Native Stockfish wasn't needed — wasm depth 15 is already far beyond bot-game strength.

### Local LLM

- Ollama on `localhost:11434`. Something in the 7–14B range (Qwen, Llama, Gemma family) is enough for narration.
- Must set `OLLAMA_ORIGINS=chrome-extension://*` so the extension can call it, and add `http://localhost:11434/*` to `host_permissions`.
- Fallback: if Ollama isn't running, show engine output + templated explanation ("Nf5 attacks the queen and the rook on d6 — fork").
- Implemented in `src/explain/ollama.js`, default model `qwen2.5:7b` (hardcoded default — **still unconfirmed against what's actually installed on this machine**, see §9). Prompt is grounded with structured facts (`captures`, `checks`, `hangingPieces`, `forks`, `defends` from `src/explain/features.js`) and explicitly instructed not to call a move a "fork" or say it "defends" unless those facts say so — guards against the model inventing tactics that aren't there. Fallback to `templated.js` (hand-coded sentence templates over the same facts) confirmed working when Ollama is unreachable.

---

## 4. Capturing the board on chess.com

Expected DOM (verify with `probe.js`):

| What | Where |
|---|---|
| Board element | `wc-chess-board` (custom element; id like `board-play-computer`) |
| Pieces | `div.piece.<color><type>.square-<file><rank>` e.g. `piece wp square-52` = white pawn on e2 (file 1–8 = a–h) |
| Orientation | `flipped` class on the board when you're Black |
| Last move | `div.highlight.square-xx` (two of them) |
| Move list | `wc-simple-move-list` / `.move-list` with per-ply nodes (SAN text) |
| Game object | `board.game` with methods like `getFEN()` — **internal, page-world only, may change** |

### Two ways to get a full FEN

1. **Replay the move list with chess.js (recommended).** Read SAN moves from the move list, replay from the start position → exact FEN incl. side to move, castling, en passant. Robust and needs only DOM text.
2. **Read piece divs.** Gives placement only. Side-to-move/castling/en-passant must be guessed → used as a cross-check against (1).
3. *(Optional)* `board.game.getFEN()` via a `world: "MAIN"` content script. Most accurate, but relies on undocumented internals — treat as a bonus, not the foundation.

Content scripts run in an isolated world and can't see `board.game`; only DOM. That's another reason (1) is the default.

### Detecting changes

`MutationObserver` on the board + move list, debounced ~150 ms → recompute FEN → if changed, send to side panel.

---

## 5. Architecture

```
chess.com tab
  content script ── MutationObserver ──► FEN + SAN history
        │ chrome.runtime.sendMessage
        ▼
  service worker (router, gate: allowed URLs only)
        │
        ▼
  side panel UI ──► Stockfish worker (wasm, MultiPV 3, depth/time cap)
        │      ──► feature extractor (chess.js)
        │      ──► Ollama (narration prompt with engine facts)
        ▼
  "Best: Nf5  (+1.8)  — Why: …"   [hint ladder]  [show line]
```

### Teaching features (where the learning actually happens)

- **Hint ladder** instead of instant answer: "There's a tactic" → "Look at your knight" → show move → explain.
- **After-move feedback**: compare the move played vs engine best, grade by win-probability swing (best / good / inaccuracy / mistake / blunder) — implemented in `moveQuality.js`, see §9 for current limitations (graded for both sides, not just the human player).
- **Toggle "auto-reveal" off by default** so you think first.

---

## 6. Repo layout (as built)

```
chess-kongming/
  manifest.json                   # MV3, side_panel, content_scripts gated to allowed URLs
  src/content/board.js            # watches for the move list, builds game state, messages the background worker
  src/content/{moveList,pieces,fen,gameState}.js  # DOM → SAN list, piece map, FEN replay (chess.js)
  src/background/sw.js            # message router, stores latest game state in chrome.storage.session
  src/panel/panel.html|js         # UI: hint ladder + move-grade list
  src/panel/hintLadder.js         # nudge → piece → move → explanation ladder
  src/engine/stockfishWorker.js   # wasm Stockfish via UCI, serialized search queue
  src/engine/uci.js               # UCI line parsing/building, score → centipawns
  src/engine/sanFromUci.js        # UCI move → SAN via chess.js
  src/explain/features.js         # captures/checks/hanging/forks/defends extraction
  src/explain/templated.js        # offline fallback narration over the same facts
  src/explain/ollama.js           # prompt + call, templated fallback
  src/explain/moveQuality.js      # win%-swing move grading + display formatting
  vendor/stockfish/                # stockfish.js + stockfish.wasm (lite, single-threaded), LICENSE.txt
  probe.js                        # paste in DevTools to verify selectors
  tools/debug/launch-chrome.sh    # dedicated debug Chrome profile + CDP port
  tools/debug/inspect.js          # CDP client: load/open/list/eval/logs against the live extension
```

## 7. Build order

1. [x] Run `probe.js` on a bot game; fix selectors. — confirmed across play/computer and analysis pages, incl. en passant, figurines, promotions, variations.
2. [x] Content script → log FEN on every move. — `board.js` watches for the move-list element (handles it mounting late on chess.com's SPA) and replays SAN moves through chess.js.
3. [x] Side panel showing FEN + Stockfish best move. — wired through `chrome.storage.session`.
4. [x] Feature extractor + templated explanation. — captures/checks/hanging pieces, plus forks and defends.
5. [x] Ollama narration. — with templated fallback when Ollama is unreachable.
6. [x] Hint ladder + post-move feedback. — ladder shows piece+square+destination at each level; post-move feedback grades every move (both sides, labeled White/Black) via win%-swing, shown as a short recent-moves list.

See §9 for what's still rough or deliberately deferred within each of these.

## 8. Open questions

- ~~Native Stockfish speed needed, or is wasm enough?~~ Resolved: wasm (lite, single-threaded) is plenty — see §3.
- Which Ollama model is already on your machine? — still unconfirmed; `ollama.js` defaults to `qwen2.5:7b` without having verified that's actually pulled locally.
- Language of explanations (English / Vietnamese)? — still undecided; everything shipped so far is English-only. (Chess.com's own UI tooltips observed during probing were in Vietnamese, for what that's worth.)
- Fair-play policy for bot games (§1) — still not independently confirmed by the user; the hard-gate to `play/computer` and `analysis` URLs stands as the safe default in the meantime.

## 9. Progress notes & future plan (2026-10-12)

What's working, verified against a real loaded extension (not just unit tests — `npm test` is at 79 passing as of this note):

- Full pipeline: content script detects the move list → replays SAN via chess.js → FEN → Stockfish (wasm, serialized one-search-at-a-time) → feature extraction → hint ladder / Ollama narration → side panel.
- Hint ladder gives piece + origin square + destination square progressively, not just raw SAN.
- Tactic detection covers captures, checks, hanging pieces, forks (including fork + check via the king), and "defends" (a move that rescues a previously-hanging piece) — all grounded facts, not LLM guesses.
- Post-move feedback: every move (both sides) is graded by win-probability swing (not flat centipawn loss) and shown in a short, newest-first list labeled White/Black.
- `tools/debug/` gives CDP-based access to the running extension (load/reload it, open the panel as a tab, eval JS, stream console logs) without manual DevTools copy-paste — used throughout development to catch real bugs (a dropped import causing `ReferenceError`s, a content-script give-up timeout, a Stockfish search race condition producing wrong-side move suggestions).

Known gaps / deliberately deferred, not forgotten:

- **No orientation detection.** Move-grade labels are objectively White/Black, not "you" vs "the bot" — intentionally scoped this way to avoid the extra DOM work of reading the board's `flipped` class; revisit if "grade only my moves" becomes worth the scope.
- **No pin/skewer/discovered-attack detection.** Only forks and defends are hand-coded; these need ray-geometry along files/ranks/diagonals that chess.js doesn't expose directly — meaningfully more code for less common patterns.
- **PV not used for narration yet.** `stockfishWorker.js` returns the full principal variation (`lines`) but only the first move is used anywhere. The plan (see prior design discussion) is to feed the first few PV plies to Ollama as a fact and let it describe multi-move plans in prose, rather than hand-coding every "sets up X" pattern.
- **No MultiPV alternative-move comparison.** MultiPV 3 is requested from the engine but only the top line is ever used; comparing against the 2nd/3rd lines ("better than Bxd4, which only wins a pawn") is a possible phase 3.
- **`moveQuality.js` thresholds need real-world tuning.** The 2/5/10 percentage-point swing cutoffs (good/inaccuracy/mistake/blunder) are a first guess, documented as freely tunable. Live testing already showed `1.f3` graded a flat "Blunder" off a 13% swing — opening moves may need different handling (or the thresholds just need loosening) once more real games are observed.
- **Ollama model default unverified**, and **explanation language** undecided — both from §8, still open.
