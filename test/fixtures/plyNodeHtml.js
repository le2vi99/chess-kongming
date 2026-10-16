// Verbatim ply-node markup captured live from chess.com (output4.txt,
// output5.txt/output6.txt in the project's probe history). Each entry is
// the real outer `.node` div + its real inner HTML, unmodified.

export const PAWN_MOVE = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">e4 </span></div>';

export const PIECE_MOVE = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess bishop-white " data-figurine="B"></span> c4 </span></div>';

export const CHECK_MOVE = '<div class="node black-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess queen-black " data-figurine="Q"></span> a5+ </span></div>';

export const PIECE_CAPTURE = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess bishop-white " data-figurine="B"></span> xa5 </span></div>';

export const PAWN_CAPTURE = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">dxe6 </span></div>';

export const PROMOTION = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">e8=Q </span></div>';

export const CHECKMATE = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon selected"><span class="icon-font-chess queen-white " data-figurine="Q"></span> d5# </span></div>';

export const CASTLE_KINGSIDE = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">O-O </span></div>';

export const CASTLE_QUEENSIDE = '<div class="node white-move "> <span class="node-highlight-content">O-O-O </span></div>';

export const EN_PASSANT = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon">exd6 <div class="move-info-icon" data-tooltip="Ăn tốt qua đường là nước đi đặt biệt của tốt khi nó ăn một quân tốt khác vừa đi hai ô." style="--tooltip-top:1px"><span class="icon-font-chess circle-info"></span></div></span></div>';

export const VARIATION_PLY = '<div class="node black-move "> <span class="node-highlight-content">h5 </span></div>';

// NOT captured live — no probe run ever produced a real disambiguated move.
// Constructed from the same confirmed pattern (data-figurine span + plain
// text) that every other case above validated. Flagged here so it's never
// mistaken for a live-verified fixture.
export const DISAMBIGUATED_MOVE_CONSTRUCTED = '<div class="node white-move main-line-ply"> <span class="node-highlight-content offset-for-annotation-icon"><span class="icon-font-chess knight-white " data-figurine="N"></span> bd2 </span></div>';
