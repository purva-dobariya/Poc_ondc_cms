/* ONDC home — tiny vanilla JS (carousel + rail arrows).
 *
 * RULE: this script must NEVER change anything INSIDE a data-editable region
 * (no text, no classes, no attributes). CloudCannon saves a region's innerHTML,
 * so anything we inject there would be written back into home.html.
 * We only touch wrappers/buttons that sit outside the regions.
 */
(function () {
  var root = document.documentElement;

  /* ---- Editor mode: CloudCannon sets window.inEditorMode inside its iframe ---- */
  function setEditing() { if (window.inEditorMode) root.classList.add('is-editing'); }
  setEditing();
  document.addEventListener('cloudcannon:load', function () { setEditing(); });
  var editing = function () { return root.classList.contains('is-editing'); };
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Sector carousel ---- */
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var rail = document.querySelector('.sector-rail');
  var cur = 0, timer = null, hovering = false;

  // Pill label = text after "·" in the slide's sector tag (read-only access).
  var pills = slides.map(function (s, i) {
    var tag = s.querySelector('.slide-content > p');
    var t = tag ? tag.textContent.trim() : 'Sector ' + (i + 1);
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sector-pill';
    b.textContent = t.indexOf('·') > -1 ? t.split('·').pop().trim() : t;
    b.addEventListener('click', function () { go(i); });
    if (rail) rail.appendChild(b);
    return b;
  });

  function go(i) {
    if (!slides.length) return;
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('active', k === cur); });
    pills.forEach(function (p, k) {
      p.classList.toggle('active', k === cur);
      if (k === cur && rail) rail.scrollTo({ left: p.offsetLeft - (rail.clientWidth - p.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
    });
    restart();
  }
  function restart() {
    clearInterval(timer);
    if (still) return;
    timer = setInterval(function () { if (!hovering && !editing()) go(cur + 1); }, 6000);
  }
  var sec = document.querySelector('.sectors');
  if (sec) {
    sec.addEventListener('mouseenter', function () { hovering = true; });
    sec.addEventListener('mouseleave', function () { hovering = false; });
    sec.addEventListener('focusin', function () { hovering = true; });
    sec.addEventListener('focusout', function () { hovering = false; });
    sec.querySelector('.car-arrow.prev').addEventListener('click', function () { go(cur - 1); });
    sec.querySelector('.car-arrow.next').addEventListener('click', function () { go(cur + 1); });
  }
  go(0);

  /* ---- Horizontal rails (building blocks, doors, news) ---- */
  document.querySelectorAll('.rail-wrap').forEach(function (wrap) {
    var track = wrap.querySelector('.rail');
    var prev = wrap.querySelector('.rail-arrow.prev');
    var next = wrap.querySelector('.rail-arrow.next');
    if (!track || !prev || !next) return;
    function step() {
      var c = track.firstElementChild;
      return c ? c.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 20) : 300;
    }
    function sync() {
      prev.disabled = track.scrollLeft <= 8;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });
})();
