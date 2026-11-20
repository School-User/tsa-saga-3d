import { get, el, title } from './dom.js';

export function isVisible(node) {
  if (typeof node.checkVisibility === 'function') return node.checkVisibility({ visibilityProperty: true });
  return node.getClientRects().length > 0 && getComputedStyle(node).visibility === 'visible';
}

export function createModal(defaultFocus, onChange) {
  const dialog = get('overlay');
  const content = get('overlay-content');
  let opener;
  let onBack;
  let kind = null;

  function open(type, heading, build, back) {
    if (!dialog.open) {
      opener = document.activeElement;
      dialog.showModal();
    }
    kind = type;
    onChange(kind);
    onBack = back;
    dialog.dataset.kind = type;
    dialog.scrollTop = 0;
    content.replaceChildren();
    if (heading) content.append(el('h2', '', heading));
    build(content);
    const label = content.querySelector('h2');
    label.id = 'overlay-title';
    title(label);
  }

  function close() {
    if (!dialog.open) return;
    dialog.close();
    content.replaceChildren();
    kind = null;
    onChange(kind);
    onBack = null;
    if (opener?.matches('button') && opener.isConnected && isVisible(opener)) opener.focus();
    else defaultFocus()?.focus();
  }

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    onBack?.();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...content.querySelectorAll('button, input, select, summary, a[href], [tabindex]')]
      .filter(node => node.tabIndex >= 0 && !node.disabled && isVisible(node));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement.id === 'overlay-title')) {
      event.preventDefault();
      (last ?? document.activeElement).focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  return { open, close, get kind() { return kind; } };
}
