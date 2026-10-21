/* Resources knowledge base — the hub search and the per-page filter.
   =====================================================================
   Every row on every Resources page is already in the page: Eleventy renders
   all of them at build time from src/_data/resources.json. This script only
   toggles `hidden`, sets `order`, and writes text into elements that exist.
   It never creates, moves or removes a node — the rule the participant
   directories follow, and for the same reason: Bookshop replaces a section's
   DOM while an editor types, and a row the script built would vanish on the
   next keystroke.

   Markup contract (data attributes, so ids stay free for anchors):
     HUB
       [data-res-search]          the search box, carries [data-res-limit]
       [data-res-search-input]    the input
       [data-res-results]         the results box
       [data-res-results-head]    "12 results"
       [data-res-hit]             one pre-rendered result, with
                                  [data-res-title] and [data-res-hay]
       [data-res-no-results]      the nothing-found line
     SUB-PAGE
       [data-res-library]         the section
       [data-res-filter]          the filter box
       [data-res-filter-count]    "3 matching resources"
       [data-res-filter-empty]    the nothing-matched line
       [data-res-sec]             one section of documents
       [data-res-row]             one document row
       [data-res-nav-details]     the sidebar disclosure

   Safe to load on any page: does nothing when neither is present.
   ===================================================================== */
(function () {
  'use strict';

  function text(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  /* ── hub: search the whole knowledge base ─────────────────────────── */
  function setupSearch(root) {
    if (root._resReady) return;
    root._resReady = true;

    var input = root.querySelector('[data-res-search-input]');
    var results = document.querySelector('[data-res-results]');
    if (!input || !results) return;

    var head = results.querySelector('[data-res-results-head]');
    var none = results.querySelector('[data-res-no-results]');
    var hits = [].slice.call(results.querySelectorAll('[data-res-hit]')).map(function (el) {
      return {
        el: el,
        title: (el.getAttribute('data-res-title') || ''),
        hay: (el.getAttribute('data-res-hay') || '')
      };
    });
    var limit = parseInt(root.getAttribute('data-res-limit'), 10) || 30;

    function clear() {
      for (var i = 0; i < hits.length; i++) hits[i].el.hidden = true;
      results.hidden = true;
      if (none) none.hidden = true;
      text(head, '');
    }

    function run() {
      var q = input.value.trim().toLowerCase();
      if (!q) { clear(); return; }

      /* Two passes so a title match outranks one found only in the blurb,
         WITHOUT moving a node: the results box is a flex column, so `order`
         does the sorting the original did by rebuilding the list. */
      var shown = 0, total = 0;
      for (var i = 0; i < hits.length; i++) {
        var h = hits[i];
        var match = h.hay.indexOf(q) !== -1;
        if (!match) { h.el.hidden = true; continue; }
        total++;
        if (shown < limit) {
          h.el.hidden = false;
          h.el.style.order = h.title.indexOf(q) !== -1 ? 1 : 2;
          shown++;
        } else {
          h.el.hidden = true;
        }
      }

      /* A title match found after the cap would have outranked something
         already shown. Cheap to be right: when the cap bit, sweep once more
         and swap the tail for any title matches that missed out. */
      if (total > limit) {
        var visible = [], spare = [];
        for (var j = 0; j < hits.length; j++) {
          var hit = hits[j];
          if (hit.hay.indexOf(q) === -1) continue;
          if (!hit.el.hidden) visible.push(hit);
          else if (hit.title.indexOf(q) !== -1) spare.push(hit);
        }
        for (var k = visible.length - 1; k >= 0 && spare.length; k--) {
          if (visible[k].title.indexOf(q) !== -1) continue;   // already a title match
          visible[k].el.hidden = true;
          var promoted = spare.shift();
          promoted.el.hidden = false;
          promoted.el.style.order = 1;
        }
      }

      text(head, total
        ? total + ' result' + (total === 1 ? '' : 's') + (total > limit ? ' — showing first ' + limit : '')
        : 'No results');
      if (none) {
        none.hidden = total !== 0;
        if (!total) text(none, 'Nothing found for “' + input.value.trim() + '”. Try a different term.');
      }
      results.hidden = false;
    }

    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; run(); input.blur(); }
    });
    if (!root._resHotkey) {
      root._resHotkey = true;
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
          e.preventDefault();
          input.focus();
        }
      });
    }

    clear();
  }

  /* ── sub-page: filter the documents on this page ──────────────────── */
  function setupLibrary(root) {
    if (root._resReady) return;
    root._resReady = true;

    var input = root.querySelector('[data-res-filter]');
    if (!input) return;
    var countEl = root.querySelector('[data-res-filter-count]');
    var emptyEl = root.querySelector('[data-res-filter-empty]');

    var sections = [].slice.call(root.querySelectorAll('[data-res-sec]')).map(function (sec) {
      var headEl = sec.querySelector('.res-sec-head');
      return {
        el: sec,
        head: (headEl ? headEl.textContent : '').toLowerCase(),
        rows: [].slice.call(sec.querySelectorAll('[data-res-row]')).map(function (r) {
          return { el: r, hay: r.textContent.toLowerCase() };
        })
      };
    });

    /* The sidebar ships open because the desktop layout shows it flat. On a
       phone it is a disclosure, and open by default it would push the
       documents a screen and a half down. */
    if (window.matchMedia && window.matchMedia('(max-width: 1000px)').matches) {
      [].forEach.call(root.querySelectorAll('[data-res-nav-details]'), function (d) { d.open = false; });
    }

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;

      sections.forEach(function (sec) {
        /* A query naming the section keeps all of its rows: row titles are
           often just a participant's name, and "static terms" should find the
           section that phrase heads. */
        var secHit = !!q && sec.head.indexOf(q) !== -1;
        var visible = 0;
        sec.rows.forEach(function (row) {
          var on = !q || secHit || row.hay.indexOf(q) !== -1;
          row.el.hidden = !on;
          if (on) visible++;
        });
        /* A section that is prose with no documents has nothing to match, so
           it stays while the page is unfiltered and goes once it is. */
        sec.el.hidden = sec.rows.length === 0 ? !!q : visible === 0;
        shown += visible;
      });

      text(countEl, q ? shown + ' matching resource' + (shown === 1 ? '' : 's') : '');
      if (emptyEl) emptyEl.hidden = !(q && shown === 0);
    }

    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(apply, 120);
    });

    apply();
  }

  function scan() {
    document.querySelectorAll('[data-res-search]').forEach(setupSearch);
    document.querySelectorAll('[data-res-library]').forEach(setupLibrary);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // Bookshop swaps a section's DOM while editing, which drops the listeners
  // and the _resReady flag with it. Re-running setup on the new nodes is all
  // that is needed; the flag stops it stacking listeners on untouched ones.
  if (window.MutationObserver) {
    var pending = null;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(scan, 80);
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
