export const get = id => document.getElementById(id);
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(label, action, className = 'btn ghost') {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

export function title(node) {
  node.tabIndex = -1;
  node.focus();
}

export function list(entries, className) {
  const node = el('ul', className);
  for (const entry of entries) {
    const row = el('li');
    row.append(entry);
    node.append(row);
  }
  return node;
}

export function section(content, heading, text) {
  content.append(el('h3', '', heading), el('p', '', text));
}

export function statsText(stats) {
  return Object.entries(stats).map(([key, value]) => `${key.toUpperCase()} ${value}`).join(' · ');
}
