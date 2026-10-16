#!/usr/bin/env node
// CDP debug client for the chess-kongming extension. Talks to a Chrome
// instance launched with tools/debug/launch-chrome.sh (or any Chrome
// started with --remote-debugging-port). See that script's header for
// setup and the security tradeoff of leaving a debug port open.
//
// Usage:
//   node tools/debug/inspect.js load               # load/reload the unpacked extension
//   node tools/debug/inspect.js open                # open the side panel as a tab
//   node tools/debug/inspect.js list                # list all open targets
//   node tools/debug/inspect.js eval <urlMatch> "<js expression>"
//   node tools/debug/inspect.js logs <urlMatch> [durationMs]
//
// urlMatch is a substring of the target's url or title, e.g. "chess.com"
// or "panel.html".
//
// --load-extension at the Chrome CLI level is a no-op on current Chrome
// (verified empirically — silently does nothing even with developer mode
// on in the profile). "load" uses the CDP Extensions.loadUnpacked method
// instead, which actually works, and caches the resulting extension id in
// .debug-chrome-profile/extension-id.txt so "open" can find it again.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import CDP from 'chrome-remote-interface';

const PORT = Number(process.env.CDP_PORT || 9222);
const REPO_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROFILE_DIR = join(REPO_DIR, '.debug-chrome-profile');
const EXTENSION_ID_FILE = join(PROFILE_DIR, 'extension-id.txt');

async function browserSession() {
  const version = await fetch(`http://localhost:${PORT}/json/version`).then((r) => r.json());
  return CDP({ target: version.webSocketDebuggerUrl });
}

async function loadExtension() {
  const client = await browserSession();
  try {
    const { id } = await client.send('Extensions.loadUnpacked', { path: REPO_DIR });
    mkdirSync(PROFILE_DIR, { recursive: true });
    writeFileSync(EXTENSION_ID_FILE, id);
    console.log(`loaded extension id: ${id}`);
  } finally {
    await client.close();
  }
}

function cachedExtensionId() {
  try {
    return readFileSync(EXTENSION_ID_FILE, 'utf8').trim();
  } catch {
    throw new Error('no cached extension id — run "load" first');
  }
}

async function openPanel() {
  const id = cachedExtensionId();
  const client = await browserSession();
  try {
    const { targetId } = await client.send('Target.createTarget', {
      url: `chrome-extension://${id}/dist/panel/panel.html`,
    });
    console.log(`opened panel as target ${targetId}`);
  } finally {
    await client.close();
  }
}

async function listTargets() {
  const targets = await CDP.List({ port: PORT });
  for (const t of targets) {
    console.log(`${t.type.padEnd(14)} ${t.title || '(no title)'}\n${' '.repeat(15)}${t.url}`);
  }
}

async function findTarget(urlMatch) {
  const targets = await CDP.List({ port: PORT });
  const target = targets.find(
    (t) => t.url.includes(urlMatch) || (t.title || '').includes(urlMatch)
  );
  if (!target) {
    throw new Error(`no target matching "${urlMatch}" — run "list" to see what's open`);
  }
  return target;
}

async function evalInTarget(urlMatch, expression) {
  const target = await findTarget(urlMatch);
  const client = await CDP({ port: PORT, target: target.id });
  try {
    await client.Runtime.enable();
    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      console.error(exceptionDetails.exception?.description || exceptionDetails.text);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(result.value, null, 2));
  } finally {
    await client.close();
  }
}

async function streamLogs(urlMatch, durationMs) {
  const target = await findTarget(urlMatch);
  const client = await CDP({ port: PORT, target: target.id });
  const { Runtime, Log } = client;
  Runtime.consoleAPICalled((params) => {
    const text = params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    console.log(`[console.${params.type}] ${text}`);
  });
  Log.entryAdded(({ entry }) => {
    console.log(`[${entry.level}] ${entry.text}`);
  });
  await Runtime.enable();
  await Log.enable();
  console.log(`Watching ${target.url} for ${durationMs}ms...`);
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  await client.close();
}

const [, , command, ...rest] = process.argv;

try {
  if (command === 'load') {
    await loadExtension();
  } else if (command === 'open') {
    await openPanel();
  } else if (command === 'list') {
    await listTargets();
  } else if (command === 'eval') {
    const [urlMatch, expression] = rest;
    if (!urlMatch || !expression) throw new Error('usage: inspect.js eval <urlMatch> "<js expression>"');
    await evalInTarget(urlMatch, expression);
  } else if (command === 'logs') {
    const [urlMatch, duration] = rest;
    if (!urlMatch) throw new Error('usage: inspect.js logs <urlMatch> [durationMs]');
    await streamLogs(urlMatch, duration ? Number(duration) : 15000);
  } else {
    console.error('usage: inspect.js <load | open | list | eval <urlMatch> <expr> | logs <urlMatch> [ms]>');
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
