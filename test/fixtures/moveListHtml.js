// Verbatim move-list fragment captured live from chess.com analysis mode
// (output6.txt) — 10 real main-line plies followed by 12 real variation
// plies (the queenside-castling line played as a branch, not a
// continuation). This is the exact case that exposed the variation-mixing
// bug the probe had before `.main-line-ply` filtering was added.
export const MAIN_LINE_WITH_VARIATION = `
<wc-move-list class="analysis-view-movelist move-list chessboard-pkg-move-list-component">
  <div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">e4 </span></div>
  <div class="node black-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">h6 </span></div>
  <div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">e5 </span></div>
  <div class="node black-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">d5 </span></div>
  <div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">exd6 <div class="move-info-icon" data-tooltip="Ăn tốt qua đường là nước đi đặt biệt của tốt khi nó ăn một quân tốt khác vừa đi hai ô." style="--tooltip-top:1px"><span class="icon-font-chess circle-info"></span></div></span></div>
  <div class="node black-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess queen-black " data-figurine="Q"></span> xd6 </span></div>
  <div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess knight-white " data-figurine="N"></span> c3 </span></div>
  <div class="node black-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">a6 </span></div>
  <div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">d4 </span></div>
  <div class="node black-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess queen-black " data-figurine="Q"></span> d5 </span></div>
  <div class="node black-move "> <span class="node-highlight-content">h5 </span></div>
  <div class="node white-move "> <span class="node-highlight-content"><span class="icon-font-chess bishop-white " data-figurine="B"></span> c4 </span></div>
  <div class="node black-move "> <span class="node-highlight-content">h4 </span></div>
  <div class="node white-move "> <span class="node-highlight-content"><span class="icon-font-chess queen-white " data-figurine="Q"></span> d3 </span></div>
  <div class="node black-move "> <span class="node-highlight-content">h3 </span></div>
  <div class="node white-move "> <span class="node-highlight-content"><span class="icon-font-chess bishop-white " data-figurine="B"></span> f4 </span></div>
  <div class="node black-move "> <span class="node-highlight-content">g6 </span></div>
  <div class="node white-move "> <span class="node-highlight-content">O-O-O </span></div>
  <div class="node black-move "> <span class="node-highlight-content"><span class="icon-font-chess bishop-black " data-figurine="B"></span> d7 </span></div>
  <div class="node white-move "> <span class="node-highlight-content">g4 </span></div>
  <div class="node black-move "> <span class="node-highlight-content"><span class="icon-font-chess bishop-black " data-figurine="B"></span> c8 </span></div>
  <div class="node white-move "> <span class="node-highlight-content selected">g5 </span></div>
</wc-move-list>
`;

export const EXPECTED_MAIN_LINE_SAN = ['e4', 'h6', 'e5', 'd5', 'exd6', 'Qxd6', 'Nc3', 'a6', 'd4', 'Qd5'];
