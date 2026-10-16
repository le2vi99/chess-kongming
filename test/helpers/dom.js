export function elementFromHtml(html) {
  const container = document.createElement('div');
  container.innerHTML = html.trim();
  return container.firstElementChild;
}
