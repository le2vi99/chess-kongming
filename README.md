# Chess Kongming

A Chrome extension that watches the chess.com board and teaches you the best move. A local Stockfish finds the move, and a local LLM explains it. Nothing is sent to a server.

## Fair play

Chess.com bans outside help in games against people. This extension only runs on:

- `chess.com/play/computer*` (bot games)
- `chess.com/analysis*` (analysis and review of finished games)

It never runs in live human games. Keep it that way.

## How it works

1. A content script reads the move list and rebuilds the position with chess.js.
2. Stockfish (wasm, in the side panel) returns the best move and top lines.
3. A feature extractor finds captures, checks, hanging pieces, forks, and defenses.
4. Ollama explains those facts in plain words. If Ollama is off, a template explains instead.

The LLM never picks the move. Stockfish does. The LLM only narrates facts it is given.

### Teaching features

- **Hint ladder**: nudge, then the piece, then the move, then the explanation.
- **Move grading**: each move is graded best / good / inaccuracy / mistake / blunder by win-probability swing.

## Requirements

- Node.js and npm
- Chrome
- [Ollama](https://ollama.com) (optional) with a model such as `qwen2.5:7b`

## Setup

```bash
npm install
npm run build
```

Allow the extension to call Ollama, then start it:

```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

Load the extension:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Open a bot game on chess.com and click the extension icon to open the side panel.

## Development

```bash
npm test                # unit tests (vitest)
npm run build           # bundle to dist/
npm run debug:launch    # Chrome with a debug profile and CDP port
npm run debug:inspect   # drive the live extension over CDP
```

`probe.js` can be pasted into DevTools to check that board selectors still match chess.com's DOM.

## Layout

| Path | Role |
|---|---|
| `src/content/` | Read board, move list, FEN |
| `src/background/sw.js` | Message router and URL gate |
| `src/engine/` | Stockfish worker and UCI helpers |
| `src/explain/` | Features, Ollama prompt, templates, move grading |
| `src/panel/` | Side panel UI and hint ladder |
| `vendor/stockfish/` | Stockfish.js 19 (lite, single-threaded) |

See [DESIGN.md](DESIGN.md) for decisions and open issues.
