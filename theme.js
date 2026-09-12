// ---------- Theme toggle (light / dark) ----------
// Self-contained: exposes window.Theme with init(), toggle(), current().
// Persists the choice in localStorage so it survives reloads.
(function () {
  const KEY = 'elomeno7-theme';

  function apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function init() {
    const saved = localStorage.getItem(KEY);
    const mode = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    apply(mode);
  }

  function toggle() {
    const next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(KEY, next);
    return next;
  }

  // Small icon button; caller wires the click via id="themeToggle".
  function button(invert) {
    const icon = current() === 'dark' ? '☀' : '☾';
    return `<button class="${invert ? 'theme-toggle-invert' : 'theme-toggle'}" id="themeToggle" title="Switch theme">${icon}</button>`;
  }

  window.Theme = { init, toggle, current, button };
  init();
})();
