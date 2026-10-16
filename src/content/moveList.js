export function isMainLinePly(node) {
  return node.classList.contains('main-line-ply');
}

export function plyToSAN(node) {
  const figurineSpan = node.querySelector('[data-figurine]');
  const rawText = node.textContent.replace(/\s+/g, '').trim();
  const figurine = figurineSpan?.dataset.figurine ?? '';
  return figurine + rawText;
}

export function extractMainLineSAN(moveListRoot) {
  return [...moveListRoot.querySelectorAll('.node.main-line-ply')].map(plyToSAN);
}
