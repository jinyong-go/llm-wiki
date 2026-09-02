/** Render-blocking, runs in <head> before first paint to avoid a flash of the wrong theme. */
export const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('llm-wiki-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

/** Placed at the end of <body>, after #theme-toggle-btn/#theme-toggle-menu exist in the DOM. */
export const THEME_TOGGLE_SCRIPT = `
(function () {
  var STORAGE_KEY = 'llm-wiki-theme';
  var btn = document.getElementById('theme-toggle-btn');
  var menu = document.getElementById('theme-toggle-menu');
  if (!btn || !menu) return;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener('click', function (e) {
    var option = e.target.closest('[data-theme-choice]');
    if (!option) return;
    applyTheme(option.getAttribute('data-theme-choice'));
    menu.hidden = true;
  });

  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) {
      menu.hidden = true;
    }
  });
})();
`
