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

  /* The deadline is carried as epoch SECONDS in data-rfp-due, written by the
   * template from the datetime the editor picked. Seconds, not a formatted
   * date, on purpose: an instant has no timezone ambiguity, so the comparison
   * below means the same thing in Mumbai and in New York. The old dd.mm.yyyy
   * string could not express a time of day and had to be parsed by hand to
   * avoid Date.parse treating it as UTC. */
  function dueTime(row) {
    var raw = row.getAttribute('data-rfp-due');
    if (!raw) return NaN;
    var secs = Number(raw);
    return isFinite(secs) && secs > 0 ? secs * 1000 : NaN;
  }

  /* Deadlines are quoted in one timezone for everybody — a tender closes at a
   * moment in India, not at each reader's local midnight — so the visible text
   * is always formatted in Asia/Kolkata whoever is looking. */
  var FMT_TZ = 'Asia/Kolkata';
  var dateFmt, timeFmt, timeFmtSec;
  function formatters() {
    if (dateFmt) return;
    var base = { timeZone: FMT_TZ };
    try {
      dateFmt = new Intl.DateTimeFormat('en-GB', Object.assign({
        day: '2-digit', month: '2-digit', year: 'numeric' }, base));
      timeFmt = new Intl.DateTimeFormat('en-GB', Object.assign({
        hour: '2-digit', minute: '2-digit', hour12: false }, base));
      timeFmtSec = new Intl.DateTimeFormat('en-GB', Object.assign({
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }, base));
    } catch (e) {
      dateFmt = timeFmt = timeFmtSec = null;   // ancient browser: keep the server text
    }
  }

  /* dd.mm.yyyy, then the time of day — with seconds only when they are set, so
   * an ordinary 5:30pm deadline reads "17:30" rather than "17:30:00". */
  function deadlineText(ms, tzLabel) {
    formatters();
    if (!dateFmt) return null;
    var d = new Date(ms);
    var day = dateFmt.format(d).replace(/\//g, '.');
    var time = (d.getSeconds() === 0 ? timeFmt : timeFmtSec).format(d);
    return day + ', ' + time + (tzLabel ? ' ' + tzLabel : '');
  }

  /* A row whose deadline cannot be read falls back to the tab the editor chose,
   * so a bad value never makes a live tender disappear. The warning names it. */
  function warnBadDate(row) {
    if (row._rfpWarned) return;
    row._rfpWarned = true;
    var name = (row.querySelector('.bk-rfp-name') || {}).textContent || '(unnamed)';
    console.warn('RFP ledger: no usable deadline on "' + name +
      '". Set one in the CMS. Leaving it in the tab it was given.');
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

  function emptyState(box) {
    var d = document.createElement('div');
    d.className = 'bk-directory-state';
    d.setAttribute('data-rfp-empty', '');
    d.innerHTML = '<div class="bk-directory-state-inner"><h3>' +
      esc(box.getAttribute('data-rfp-empty-heading') || 'No records found') +
      '</h3><p>' +
      esc(box.getAttribute('data-rfp-empty-body') || 'Nothing matches this filter right now.') +
      '</p></div>';
    return d;
  }

  /* Which tab does this row belong under?
   *
   * An empanelled agency is whatever the editor said and is never moved. For a
   * tender, the closing date normally wins — that is the whole point of
   * "Move tenders between Open and Closed automatically". The editor's own
   * choice is the fallback: when the switch is off, or when the date is
   * missing or unreadable. */
  function placeOf(row, now, auto) {
    var chosen = row.getAttribute('data-rfp-tab') || 'open';
    if (chosen === 'empanelled') return 'empanelled';
    if (auto) {
      var t = dueTime(row);
      if (!isNaN(t)) return t < now ? 'closed' : 'open';
      warnBadDate(row);
    }
    return chosen === 'closed' ? 'closed' : 'open';
  }

  /* Rewrite the server-rendered date with the full deadline in IST. The server
   * only writes the date part, as a no-JavaScript fallback. Idempotent: it
   * stops once the text already matches. */
  function paintDeadline(row, tzLabel) {
    var el = row.querySelector('[data-rfp-due-text]');
    if (!el) return;
    var ms = dueTime(row);
    if (isNaN(ms)) return;
    var text = deadlineText(ms, tzLabel);
    if (text && el.textContent !== text) el.textContent = text;
  }

  /* Decide what is visible. Called on load, on every keystroke in the search
   * box, and again after the editor re-renders the section. */
  function apply(section) {
    var now = Date.now();
    var auto = section.getAttribute('data-rfp-auto') !== 'off';
    var tzLabel = section.getAttribute('data-rfp-tz') || '';
    var input = section.querySelector('.bk-rfp-search');
    var q = input ? input.value.trim().toLowerCase() : '';
    var openCount = 0;

    section.querySelectorAll('[data-rfp-rows]').forEach(function (box) {
      var role = box.getAttribute('data-rfp-rows') || 'open';
      var shown = 0;

      box.querySelectorAll('.bk-rfp-row').forEach(function (row) {
        var place = placeOf(row, now, auto);
        paintDeadline(row, tzLabel);
        // Closed tenders are greyed down; the class is the one beckn.css styles.
        row.classList.toggle('bk-rfp-row-closed', place === 'closed');
        var matches = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
        row.hidden = !(place === role && matches);
        if (!row.hidden) shown++;
      });

      // Count the open tenders from the open panel, ignoring the search so the
      // headline figure is the real total rather than whatever is filtered.
      if (role === 'open') {
        openCount = 0;
        box.querySelectorAll('.bk-rfp-row').forEach(function (row) {
          if (placeOf(row, now, auto) === 'open') openCount++;
        });
      }

      var placeholder = box.querySelector('[data-rfp-empty]');
      if (shown === 0 && !placeholder) box.appendChild(emptyState(box));
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
