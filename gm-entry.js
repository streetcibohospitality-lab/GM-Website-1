(() => {
  const entry = document.getElementById('gmEntry');
  if (!entry) return;

  const root = document.documentElement;
  root.classList.add('gm-entry-lock');

  const finish = () => {
    if (!entry.isConnected) return;
    entry.classList.add('is-skip');
    root.classList.remove('gm-entry-lock');
    window.setTimeout(() => entry.remove(), 80);
  };

  entry.addEventListener('animationend', (event) => {
    if (event.animationName === 'gm-entry-overlay-out') finish();
  }, { once: false });

  // Hard fallback in case a browser suppresses animationend.
  window.setTimeout(finish, 2200);
})();
