// chess-kongming selector probe — stress-test pass.
// Open a bot game on chess.com/play/computer. Play a game that exercises:
//   - captures (x)            - checks (+) / checkmate (#)
//   - pawn promotion (=Q)     - en passant
//   - castling both sides (O-O / O-O-O)
//   - a disambiguated move if you can force one (e.g. two knights, Nbd2)
// Then open DevTools Console, paste this, press Enter. Copy the output back.
(() => {
  // Exclude STYLE/LINK — a stylesheet tag like id="board-styles-play-computer"
  // can match [id^="board-"] before the real board element.
  const board = document.querySelector('wc-chess-board, chess-board, [id^="board-"]:not(style):not(link)');
  const out = { url: location.href };

  out.board = board ? {
    tag: board.tagName,
    id: board.id,
    classes: board.className,
    flipped: board.classList.contains('flipped'),
    hasShadowRoot: !!board.shadowRoot,
    hasGameObject: !!board.game,
    fenFromGame: (() => { try { return board.game?.getFEN?.(); } catch (e) { return 'err: ' + e.message; } })(),
  } : 'NOT FOUND';

  // Pieces live in light DOM on most chess.com layouts, but some embed
  // the board inside a shadow root. Search both so an empty result from
  // the light DOM isn't silently mistaken for "no pieces found".
  const files = 'abcdefgh';
  const pieceRoot = board?.shadowRoot ?? document;
  out.pieces = {
    foundIn: board?.shadowRoot ? 'shadowRoot' : 'document',
    list: [...pieceRoot.querySelectorAll('.piece')].map(el => {
      const cls = [...el.classList];
      const type = cls.find(c => /^[wb][pnbrqk]$/.test(c));
      const sq = cls.find(c => /^square-\d\d$/.test(c));
      return type && sq ? `${type}@${files[+sq[7] - 1]}${sq[8]}` : el.className;
    }),
  };

  out.highlights = [...pieceRoot.querySelectorAll('.highlight')].map(e => e.className);

  // SAN reconstruction rule confirmed live: a child span with
  // [data-figurine] carries the piece letter (N/B/R/Q/K); its absence means
  // a pawn move, where textContent is already the full SAN token. Prepending
  // figurine + rawText should hold for captures ("Nxe5") and disambiguation
  // ("Nbd2") since those extra characters are plain text after the icon.
  // UNVERIFIED by prior runs: promotion (does "=Q" also render as an icon,
  // which would break naive prefixing?) and whether a capture ever shows a
  // second figurine span for the captured piece. html is dumped in full so
  // we can see if either breaks the rule.
  // Analysis mode can hold variation branches alongside the main line —
  // confirmed live: branch plies render as plain ".node" without the
  // ".main-line-ply" class the real game moves carry. Flattening all
  // ".node" matches in DOM order (as earlier probe versions did) silently
  // splices variations into the main sequence and produces garbage SAN.
  const extractPlies = (root) => [...root.querySelectorAll('[data-ply], .node, .move-text-component')].map(n => {
    const figurineSpans = [...n.querySelectorAll('[data-figurine]')];
    const rawText = n.textContent.replace(/\s+/g, '').trim();
    const figurine = figurineSpans[0]?.dataset.figurine ?? '';
    return {
      cls: n.className,
      ply: n.dataset?.ply,
      isMainLine: n.classList.contains('main-line-ply'),
      rawText,
      figurine: figurine || null,
      figurineCount: figurineSpans.length,
      reconstructedSAN: figurine ? figurine + rawText : rawText,
      html: n.innerHTML,
    };
  });

  const mlCandidates = [...document.querySelectorAll('wc-simple-move-list, wc-move-list, vertical-move-list, .move-list, [class*="move-list"]')];

  // Several candidates are usually redundant per-row duplicates of the same
  // data (confirmed in a prior run) — treat whichever has the most MAIN LINE
  // ply nodes as canonical (not raw node count, which a large variation
  // branch could inflate) and only summarize (tag/count) the rest.
  let canonical = null, canonicalMainLineCount = -1;
  out.moveListCandidates = mlCandidates.map(ml => {
    const root = ml.shadowRoot ?? ml;
    const plies = extractPlies(root);
    const mainLineCount = plies.filter(p => p.isMainLine).length;
    if (mainLineCount > canonicalMainLineCount) { canonical = plies; canonicalMainLineCount = mainLineCount; }
    return { tag: ml.tagName, classes: ml.className, foundIn: ml.shadowRoot ? 'shadowRoot' : 'lightDom', plyCount: plies.length, mainLineCount, variationCount: plies.length - mainLineCount };
  });

  out.moveListFull = canonical ?? 'NOT FOUND';

  const mainLinePlies = canonical ? canonical.filter(p => p.isMainLine) : [];
  const variationPlies = canonical ? canonical.filter(p => !p.isMainLine) : [];

  out.reconstructedPGN = mainLinePlies.length
    ? mainLinePlies.map((p, i) => (i % 2 === 0 ? `${i / 2 + 1}. ` : '') + p.reconstructedSAN).join(' ')
    : null;
  out.variationPGN = variationPlies.length
    ? `(${variationPlies.length} variation plies, excluded from main line) ` + variationPlies.map(p => p.reconstructedSAN).join(' ')
    : null;

  console.log(JSON.stringify(out, null, 2));
  return out;
})();
