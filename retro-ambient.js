(() => {
  const marker = document.getElementById('route63Marker');
  if (!marker) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    marker.classList.add('is-settled');
    return;
  }

  const section = document.getElementById('locations') || marker;
  const io = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    marker.classList.add('is-settled');
    io.disconnect();
  }, { threshold: 0.32 });

  io.observe(section);
})();
