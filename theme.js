(() => {
  const KEY = 'legion_rx_theme';
  const THEMES = new Set(['rx-red', 'rx-light']);

  function getTheme() {
    const saved = localStorage.getItem(KEY);
    return THEMES.has(saved) ? saved : 'rx-red';
  }

  function applyTheme(theme) {
    const safeTheme = THEMES.has(theme) ? theme : 'rx-red';
    document.documentElement.dataset.theme = safeTheme;
    document.documentElement.style.colorScheme = safeTheme === 'rx-light' ? 'light' : 'dark';
    localStorage.setItem(KEY, safeTheme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = safeTheme === 'rx-light' ? '#f3f4f6' : '#090b0f';
    return safeTheme;
  }

  applyTheme(getTheme());
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('themeSelect');
    if (!select) return;
    select.value = getTheme();
    select.addEventListener('change', e => applyTheme(e.target.value));
  });
  window.LegionTheme = { getTheme, applyTheme };
})();
