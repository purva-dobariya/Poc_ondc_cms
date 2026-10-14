/* RFP / RFQ ledger — the tender table on /rfp.html.
 *
 * The tenders themselves are CMS content: they live in the page's "RFP / RFQ
 * ledger" section and are already in the HTML when this file runs. Nothing is
 * fetched. This script only does the three things the markup cannot:
 *
 *   1. decides which tenders are Open and which are Closed, from today's date
 *   2. filters rows as you type in the search box
 *   3. counts the open tenders into the hero counter
 *
 * Why the date check is here and not at build time: a tender has to move to
 * Closed the day after its closing date, and nobody is going to rebuild the
 * site at midnight to make that happen. The dates are baked into the page; the
 * comparison is live.
 *
 * Every feed panel is rendered with ALL tenders in it and this script hides the
 * ones that do not belong in that panel. It never moves or creates row
 * elements — that matters, because inside the CloudCannon editor Bookshop
 * re-renders the section whenever a field changes, and a script that reshuffled
 * the DOM would fight that re-render in a loop. Hiding is idempotent: running
 * it twice does the same thing as running it once.
 */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  /* A closing date is written dd.mm.yyyy (a stray dd-mm-yyyy or dd/mm/yyyy is
   * tolerated). The deadline is the END of that day.
   *
   * The parts are read as numbers and handed to the Date constructor rather
   * than letting Date parse the string. Date.parse treats "2026-11-30" as UTC
   * midnight, which is the day BEFORE in any timezone west of Greenwich — a
   * tender would close a day early for readers in the Americas. Building the
   * date from parts keeps it local everywhere. */
  function dueTime(str) {
    var parts = String(str || '').trim().split(/[.\-\/]/);
    if (parts.length < 3) return NaN;
    var dd = +parts[0], mm = +parts[1], yyyy = +parts[2];
    if (!dd || !mm || !yyyy) return NaN;
    return new Date(yyyy, mm - 1, dd, 23, 59, 59, 999).getTime();
  }

  function isClosed(row, now) {
    var t = dueTime(row.getAttribute('data-rfp-due'));
    // An unreadable or missing date keeps the tender in Open rather than
    // silently hiding it, so a typo stays visible instead of losing a live
    // tender. The warning says which one.
    if (isNaN(t)) {
      if (!row._rfpWarned) {
        row._rfpWarned = true;
        console.warn('RFP ledger: could not read the closing date "' +
          row.getAttribute('data-rfp-due') + '" on "' +
          (row.querySelector('.bk-rfp-name') || {}).textContent +
          '". Expected dd.mm.yyyy, for example 30.11.2026. Showing it as open.');
      }
      return false;
    }
    return t < now;
  }

  /* The hero counter counts up, matching the easing beckn.js uses for every
   * other [data-bk-count] on the site. */
  function countUpTo(el, target) {
    if (!el) return;
    if (el._rfpShown === target) return;      // nothing changed, don't re-animate
    el._rfpShown = target;
    if (!target) { el.textContent = '0'; return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(target);
      return;
    }
    var t0 = performance.now(), dur = 1200;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function emptyState(section) {
    var d = document.createElement('div');
    d.className = 'bk-directory-state';
    d.setAttribute('data-rfp-empty', '');
    d.innerHTML = '<div class="bk-directory-state-inner"><h3>' +
      esc(section.getAttribute('data-rfp-empty-heading') || 'No records found') +
      '</h3><p>' +
      esc(section.getAttribute('data-rfp-empty-body') || 'Nothing matches this filter right now.') +
      '</p></div>';
    return d;
  }

  /* Decide what is visible. Called on load, on every keystroke in the search
   * box, and again after the editor re-renders the section. */
  function apply(section) {
    var now = Date.now();
    var input = section.querySelector('.bk-rfp-search');
    var q = input ? input.value.trim().toLowerCase() : '';
    var openCount = 0;

    section.querySelectorAll('[data-rfp-rows]').forEach(function (box) {
      var wantClosed = box.getAttribute('data-rfp-rows') === 'closed';
      var shown = 0;

      box.querySelectorAll('.bk-rfp-row').forEach(function (row) {
        var closed = isClosed(row, now);
        // Closed tenders are greyed down; the class is the one beckn.css styles.
        row.classList.toggle('bk-rfp-row-closed', closed);
        var belongs = closed === wantClosed;
        var matches = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
        row.hidden = !(belongs && matches);
        if (!row.hidden) shown++;
      });

      // Count the open tenders once, from the open panel, ignoring the search
      // so the headline figure is the real total rather than whatever is
      // currently filtered.
      if (!wantClosed) {
        openCount = 0;
        box.querySelectorAll('.bk-rfp-row').forEach(function (row) {
          if (!isClosed(row, now)) openCount++;
        });
      }

      var placeholder = box.querySelector('[data-rfp-empty]');
      if (shown === 0 && !placeholder) box.appendChild(emptyState(section));
      if (shown > 0 && placeholder) placeholder.remove();
    });

    var tallyId = section.getAttribute('data-rfp-tally');
    countUpTo(tallyId ? document.getElementById(tallyId) : null, openCount);
  }

  function init(section) {
    if (!section._rfpReady) {
      section._rfpReady = true;

      // Tabs. Each button owns one panel; only the chosen panel is shown.
      var tabs = [].slice.call(section.querySelectorAll('.bk-tab'));
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) {
            var on = t === tab;
            t.setAttribute('aria-selected', String(on));
            var panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !on;
          });
        });
      });

      var input = section.querySelector('.bk-rfp-search');
      if (input) input.addEventListener('input', function () { apply(section); });
    }
    apply(section);
  }

  /* apply() can add or remove the "nothing here" block, which is a DOM change
   * the observer below would see. apply() is idempotent so it would settle
   * after one extra pass anyway, but muting the observer while it runs keeps
   * that off the table entirely. */
  var busy = false;
  function scan() {
    if (busy) return;
    busy = true;
    try { document.querySelectorAll('.bk-rfp-ledger').forEach(init); }
    finally { busy = false; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  /* The visual editor replaces the section's DOM when a field changes. Pick the
   * fresh copy up, debounced, so editing stays responsive. Safe to run as often
   * as it likes: init() only binds handlers once per section element and
   * apply() only ever sets .hidden. */
  if (window.MutationObserver) {
    var pending = null;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(scan, 50);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
