/* Scroll progress bar. Fills <span id="progBar"> as the page scrolls.
   Safe to load on any page: does nothing when the element is absent. */
(function () {
  'use strict';
    // ── SCROLL PROGRESS ──────────────────────────────────────────────────────
    const bar = document.getElementById('progBar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      bar.style.width = Math.min(p * 100, 100) + '%';
    }, { passive: true });
})();
