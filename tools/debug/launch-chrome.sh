#!/usr/bin/env bash
# Launches a dedicated Chrome profile with the Chrome DevTools Protocol
# open on localhost, so tools/debug/inspect.js can attach: load this
# extension, read console logs, and evaluate JS in the chess.com tab, the
# side panel, and the background service worker — without manual
# copy-paste into DevTools.
#
# NOTE: --load-extension is a no-op on current Chrome (verified — it
# silently does nothing even with developer mode on). Extensions are
# loaded via the CDP "Extensions.loadUnpacked" method instead; run
# `node tools/debug/inspect.js load` after this script starts Chrome.
#
# Uses a separate --user-data-dir so this never touches your regular
# Chrome profile, cookies, or logged-in sessions. You'll need to log into
# chess.com once in this window; the profile persists under
# .debug-chrome-profile/ across runs.
#
# SECURITY: CDP is bound to localhost, but any local process can connect
# while this is running (full JS eval + DOM access in every open tab).
# Only launch this when actively debugging, and quit it when done.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROFILE_DIR="$REPO_DIR/.debug-chrome-profile"
PORT="${CDP_PORT:-9222}"
CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

mkdir -p "$PROFILE_DIR"

"$CHROME_BIN" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "https://www.chess.com/play/computer" &

disown

echo "Chrome launched. CDP on http://localhost:$PORT, profile at $PROFILE_DIR"
echo "Next steps:"
echo "  1. Log into chess.com in this window (one-time; the profile persists)."
echo "  2. node tools/debug/inspect.js load     # loads the unpacked extension"
echo "  3. node tools/debug/inspect.js list     # see all targets"
