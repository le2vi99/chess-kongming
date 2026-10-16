// Background service worker — glue only, no business logic. Routes
// game-state messages from the content script into session storage so the
// side panel can read the latest state whenever it's open. No npm
// dependencies, so this loads directly (unbundled). Not unit tested, same
// reasoning as board.js: this is pure chrome.* wiring.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'chess-kongming/game-state') {
    chrome.storage.session.set({ latestGameState: message });
  }
});
