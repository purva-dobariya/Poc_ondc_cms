# Adding pages — architecture and how-to

Four pages are in the CMS: the home page, `/about-us.html`, `/rfp.html` and
`/careers.html`. Between them they cover the shapes almost every remaining
ondc.org page takes, so each new page is now mostly picking components rather
than writing them.

| Archetype | Example | What it is |
| --- | --- | --- |
| **Narrative page** | About, Careers | A full-bleed photo hero, then long-form storytelling sections |
| **Role / directory page** | RFPs/RFQs | A text hero with a counter, then a table or directory, then a white closing panel |

Careers is the proof that this is paying off: **four sections, one new
component.** The hero and the closing band were already built, and its "Our
people" band turned out to be the existing `numbered_lists` in a different box.
It needed no new CSS and no new JavaScript at all.

The role shape is the common one: `bk-role-hero` appears on 7 ondc.org pages and
`bk-role-close` on 9, so the components built for RFPs/RFQs are already most of
Gateway, Network Participants, Ecosystem Participants, Buyer NP, Seller NP and
Technology Service Provider.

---

## The rule that keeps pages from breaking

**Shared chrome is not a page section.** The navbar, the sector pill row and the
footer appear on every page, so they are rendered by the layout
(`src/_includes/base.liquid`) from `src/_data/site.json`, not by components in a
page's `sections` list.

This was a deliberate change after the chrome repeatedly rendered empty. The
reason it failed: a Bookshop component is re-rendered **in the browser** during
live editing, where site-wide data may not be available. Chrome rendered that way
is empty in the editor whenever that data does not arrive. Rendered by the layout,
it is baked into the HTML at build time and is correct on every page, always.

What this gives up: editing the nav or footer no longer updates the preview as you
type — you save and the next build shows it. That was already true of the navbar,
and it is a better trade than a footer that is sometimes blank.

| | Where it lives | How it is edited |
| --- | --- | --- |
| Navbar | `src/_includes/chrome/header.liquid` | **Header & Footer** in the sidebar |
| Sector pills | `src/_includes/chrome/sector-rail.liquid` | **Header & Footer** → Sector links |
| Footer | `src/_includes/chrome/footer.liquid` | **Header & Footer** → Footer |
| Page content | `component-library/components/*` | **Page sections** on each page |

A page turns the sector rail on with `show_sector_rail: true` in its front matter.
A page that needs its own footer sets `page_footer:` with the same fields as
`site.footer`; otherwise every page shares one.

### Page structure

```
<body>
  [scroll progress bar, if show_progress]
  navbar                      ← chrome, from the layout
  <div id="root"> or <main class="bk">
    page sections             ← the editable array
  </...>
  sector rail, if enabled     ← chrome
  footer                      ← chrome
</body>
```

Chrome sits **outside** the page wrapper, matching ondc.org. This matters on
category pages: `beckn.css` is scoped to `.bk` and its own header says it "must
not leak into that chrome".

---

## Stylesheets

`category-chrome.css` owns the design tokens, the reset, the container, the
navbar and the footer grid. **The layout always loads it first, on every page**,
outside the per-page list, so a new page can never lose its chrome styling. It
must come before `fx.css`, which layers the site finish on top.

Everything after that is per-page. `base.liquid` loops over two lists whose
defaults live in `src/pages/pages.json`:

```yaml
override:styles: [fx, scale, type-boost, beckn, mobile]
override:scripts:
  - /js/ondc/fx.js
  - /js/ondc/beckn.js
```

The `override:` prefix is required. Eleventy **concatenates** arrays through the
data cascade, so without it a page's list is appended to the default instead of
replacing it — you get every stylesheet twice.

`blocks.css` and `cms.css` always load last, in that order. `cms.css` is the
editor layer and must stay last.

| Page | Stylesheets |
| --- | --- |
| Home | category-chrome, styles, fx, hero, scale, mobile |
| About | category-chrome, fx, scale, type-boost, beckn, mobile |
| RFPs/RFQs | category-chrome, fx, scale, type-boost, beckn, mobile |
| Careers | category-chrome, fx, scale, type-boost, beckn, mobile |

RFPs/RFQs and Careers both needed **no new CSS at all** — every rule they use
was already in `beckn.css` and `mobile.css`, and the three inner pages now share
one identical stylesheet list. Expect that for most of the remaining pages:
check before copying anything.

Three more per-page switches, all hidden from editors:

| Field | Purpose | Home | About | RFPs/RFQs |
| --- | --- | --- | --- | --- |
| `body_class` | class on `<body>` | `home` | *(none)* | *(none)* |
| `wrapper_tag` / `wrapper_id` / `wrapper_class` | the element around the sections | `div#root` | `main.bk` | `main.bk.bk-role-page.bk-rfp-page` |
| `show_progress` | the scroll-progress bar | off | on | on |

Careers uses the same switches as About: `main.bk`, progress bar on, no body
class, no sector rail.

---

## URLs

Every page is served flat at `/<slug>.html`, which is what
`collections_config.pages.url: /[slug].html` expects. The two must agree — when
they disagree CloudCannon shows "No preview available" even though the build
succeeded.

Links in the header, footer and sector rail already point at the remaining 45
pages. They 404 until each page is built, and start working the moment it lands.

### Menu links that point at the home page

Two menu items — "Home" and "Roles You Can Play" — point at a *spot on the home
page* (`#site-top`, `#find-your-place`). A bare `#anchor` only works while you
are already on the home page; from any other page it jumps nowhere. ondc.org
handles this by writing `../index.html#site-top` on its inner pages.

`chrome/header.liquid` does the same automatically: a menu URL that starts with
`#` is prefixed with `site.home_url` on every page except the home page itself,
so the home page keeps its smooth in-page scroll and the other 47 pages
navigate. The logo links to `site.home_url#site-top` the same way, and the
current page's menu item gets `class="nav-link active"`.

Keep writing `#find-your-place` in `site.json` — the prefixing is automatic.

---

## The component library

21 components, each a folder under `component-library/components/<name>/` with a
template and a `.bookshop.yml` spec. All are page content; none is chrome.

**Added for the About page**, all reusable:

| Component | What it is | Where it is used again |
| --- | --- | --- |
| `page_hero` | Full-bleed hero: photo, heading, paragraphs, buttons | the narrative pages |
| `closing_cta` | Short closing heading + buttons | ~44 pages (both variants) |
| `numbered_lists` | A lead beside groups of auto-numbered points | sector pages, careers |
| `institutions` | Named organisations + a logo strip with a counter | about, investor pages |
| `people_grid` | Photo, name, role, organisation | about, careers |
| `awards` | Featured award + awards by year, with a lightbox | about |
| `timeline` | Year-by-year story with the animated India map | about |

**Added for the RFPs/RFQs page:**

| Component | What it is | Where it is used again |
| --- | --- | --- |
| `role_hero` | Text hero with an optional live counter on the right | **7 pages** — RFPs, Gateway, Network/Ecosystem Participants, Buyer NP, Seller NP, TSP |
| `rfp_ledger` | Tabs + search over a table of tenders, each a name and a link | RFPs |

**Added for the Careers page — just one:**

| Component | What it is | Where it is used again |
| --- | --- | --- |
| `life_blocks` | Titled text blocks beside a column of photos | Careers |

Careers' other three sections were variants of things that already existed:

| Section on ondc.org | Handled by | How |
| --- | --- | --- |
| `.bk-hero.bk-hero-about` | `page_hero` | new **animation** field — `reveal` (About) or `intro` (Careers) |
| `.bk-culture` | `numbered_lists` | new **variant: culture** — same numbered points, plainer box, group headings hidden |
| `.bk-about-close` | `closing_cta` | unchanged, Plain layout |

### A variant, not a new component

`bk-role-close` (the white rounded panel at the foot of 9 role pages) is the
same content as `bk-about-close` in a different box, so it became a **`variant`
field on `closing_cta`** rather than a tenth component:

| `variant` | Markup | Extra field |
| --- | --- | --- |
| *(empty)* — "Plain" | `section.bk-about-close` | — |
| `role` — "Panel" | `section.bk-role-close` | `body`, one paragraph |

This is the rule that keeps the library at 21 instead of 45: **a new visual
treatment of the same content is a variant field; only a new content shape is a
new component.**

### The ledger: tenders are CMS content, not a Google Sheet

ondc.org fetches its tender rows from a Google Sheet at runtime. **This build
does not.** Tenders are a `tenders` array on the `rfp_ledger` section, so
publishing one is a form with a file upload rather than a spreadsheet edit, and
the page has no dependency on Google at all.

Clicking **+** on the list offers three things to add — **Open RFP / RFQ**,
**Closed RFP / RFQ**, **Empanelled agency** — and all three take the same
fields: `tab`, `rfp_no`, `name`, `last_date` (dd.mm.yyyy) and a `documents`
list. Each document has `doc_type` plus **either** `file` (uploaded through
CloudCannon into `files/rfp/`) **or** `url` (a link to something already
online, such as ONDC's S3). `file` wins when both are set.

The three tabs are an array too, with one entry per tab (`source` is `open`,
`closed` or `empanelled`) carrying its own empty-state heading and message. A
tab with nothing in it shows that message — which is how "No empanelled
agencies yet" works now, rather than being a hard-coded message tab.

Three decisions behind that shape, each with a reason worth keeping:

**Why an array on the section, not a CloudCannon collection.** A collection
would give each tender its own sidebar entry, which is nicer at 50+ tenders.
But collection data is not exposed to Bookshop's browser re-render, so the rows
would vanish while editing the section — the same failure that moved the chrome
into the layout. An array is a plain component prop, so it survives. If the list
ever outgrows this, a shared data file under `data_config` is the next step, not
a collection.

**Why the deadline is a datetime, and how the timezone trap was closed.** A
tender closes at a moment, not on a day, so `rfp_deadline` is `type: datetime`
and stores an ISO instant. The trap: formatting an instant is timezone-
dependent, and on a UTC build server a deadline late in the IST evening renders
as the previous day. Two things close it —

- `eleventy.config.js` pins `process.env.TZ` to `Asia/Kolkata`, so build-time
  formatting is IST;
- the template writes the deadline into `data-rfp-due` as **epoch seconds**
  (`| date: "%s"`), which has no timezone at all, and the browser formats the
  visible text in `Asia/Kolkata` through `Intl.DateTimeFormat`.

So every reader sees the same `30.11.2026, 17:30 IST` wherever they are, and
the open/closed comparison is an integer comparison. Verified by loading the
same built page with the viewer timezone set to `America/New_York`: identical
output.

**Why `tab` and the date both exist.** The editor picks a tab when adding an
entry, and that is what an empanelled agency goes by — it is never moved. For a
tender, the **Move tenders between Open and Closed automatically** switch
(`auto_by_date`, on by default) lets the closing date override that choice: a
tender has to move to Closed the day after its deadline and nobody will rebuild
the site at midnight. The editor's `tab` is the fallback — when the switch is
off, or when the date is missing or unreadable, which is also what stops a typo
hiding a live tender.

Each tender is rendered into **both** the open and closed panels and the script
hides the wrong one; an empanelled entry is rendered only into its own panel.
That keeps the DOM static — see the rule below.

Verified by running the same built page with the clock moved forward:

| Browser's date | Open | Closed | Counter |
| --- | --- | --- | --- |
| 14.10.2026 | 001, 014 | 009 | 2 |
| 30.11.2026 *(the deadline itself)* | 001, 014 | 009 | 2 |
| 01.12.2026 | 014 | 001, 009 | 1 |
| 01.03.2027 | — | all three | 0 |

With `auto_by_date` off, the same page holds the editor's choice (001, 014 open
/ 009 closed, counter 2) at every one of those dates. The empanelled agency
stays in its own tab throughout, under both settings.

### The rule that keeps that script safe in the editor

Every feed panel is rendered with **all** tenders in it and the script hides the
ones that do not belong. It never moves or creates row elements.

That is deliberate. Inside the editor, Bookshop replaces the section's DOM on
every keystroke, and a script that reshuffled rows would fight the re-render in
a loop. Hiding is idempotent — running it twice does what running it once does.
The only node it ever adds is the "nothing here" block, and the observer is
muted while that happens. Verified by forcing three re-renders in a row and
confirming the output does not drift.

Apply the same discipline to any future component that reacts to a re-render.

### Six rules that are not optional

**1. A component reads the data it needs itself.** It must not receive data
through a helper or the layout — Bookshop re-renders components in the browser,
and anything passed in from outside is gone. This is the same failure that moved
the chrome into the layout.

**2. Anything that animates needs an editor rule in `css/ondc/cms.css`.**
`.bk-rv` starts at `opacity: 0` and only reveals on scroll. The editor never
scrolls, so without a rule the page renders invisible. The same applies to
`.bk-scrub-w`, the per-word spans `beckn.js` creates inside a `[data-bk-scrub]`
paragraph: they start grey and colour in as the block scrolls past, so in the
editor the paragraph sits there unreadable. Both rules mirror what `beckn.css`
already does under `prefers-reduced-motion` — that block is a good place to
look when adding a page, because it lists everything on the site that animates. The navbar is also pinned
to `position: static` in editor mode — left sticky it floats over the first
section and swallows that section's hover controls, making the top section
impossible to select.

**3. Never hide half of a cancelling pair.** Several sections are built from two
elements whose heights cancel out: a sticky stage that is one viewport tall, and
the content after it that pulls itself back up with a matching negative margin.

```css
.bk-tl-stage   { position: sticky; height: calc(100vh / var(--ui-scale, 1)); }
.bk-tl-content { margin-top: calc(-100vh / var(--ui-scale, 1)); }
```

On the live page the pair nets to zero. Hide the stage in editor mode and the
negative margin survives with nothing to cancel it, dragging the whole first
section a full viewport upward — straight under the navbar. That is what made
About look broken in the editor while the live URL looked fine; the navbar was
never the cause. If you hide a stage, zero its partner's margin in the same rule:

```css
html.is-editing .bk-tl-stage  { display: none !important; }
html.is-editing .bk-tl-content { margin-top: 0 !important; }   /* required */
```

`.bk-people-stage` carries both halves on itself (`height` and `margin-bottom`),
so hiding it alone is safe. Check which shape a new stage has before hiding it.

**4. Anything hidden behind a click must be unhidden in editor mode.** Text
inside a tab, an accordion or a dialog cannot be clicked to edit while it is
`hidden`. Tabs appear on 14 ondc.org pages, so this will come up again. The
ledger's rule shows the shape:

```css
html.is-editing .bk-rfp-panel[hidden] { display: block !important; }
```

All the panels then stack, and the tab buttons stop switching anything while
editing. That is the intended trade: everything on the page is reachable.

Watch for inline styles too. `beckn.js` sets `opacity: 0` *as an inline style*
on every `[data-bk-intro]` before animating it back, and an inline style beats a
stylesheet — so that rule needs `!important`, which is exactly what `beckn.css`
itself does under `prefers-reduced-motion`.

**5. A Bookshop component's inputs — including every nested field — go in its
own `.bookshop.yml`, written out in full.** Three placements were tried on this
component. Only one works:

| Where | Result |
| --- | --- |
| `_inputs` at the top of `cloudcannon.config.yml` | reaches page front matter and data files, **not** a component's fields |
| `_inputs` nested in a `_structures.<name>` entry, reached by `structures: _structures.<name>` | the values arrive, their `_inputs` **do not** |
| `_inputs` in the component's `.bookshop.yml`, structures written inline | **works, including nested arrays** |

The reason is in `@bookshop/generate`: `lib/structure-connector.js` does
`let { structures, ...fields } = structure` and copies everything else verbatim
into `_cloudcannon/info.json`. An inline structure keeps its per-value `_inputs`
all the way through; a string reference arrives as the literal string
`"_structures.rfp_tenders"` with nothing attached.

You can check this yourself without pushing anything:

```bash
npx @11ty/eleventy
npx @bookshop/generate --skip-live --skip-components
# then read _site/_cloudcannon/info.json — whatever is not in there
# is not something CloudCannon can act on
```

(`--skip-live` matters locally: info.json is written *after* the live-editing
bundle, so an esbuild failure means it never gets written at all.)

Symptoms of getting this wrong: auto-titled labels like "Rfp No", a `file`
input rendering as a plain text box with nothing to type into, a `select`
rendering as text, and a same-named input from an unrelated component leaking
in. Watch for name-based type detection too — a field called `last_date` is
turned into a date input whether you asked for one or not, then errors if the
value is not ISO8601.

**6. `hidden` is a key on an input, not an input type.** To hide a field from
editors:

```yaml
heading_id:
  type: text        # a real type is still required
  hidden: true
```

`type: hidden` is **not** valid and CloudCannon shows "This hidden input is
misconfigured" in the sidebar for every field that uses it. A field whose name
starts with an underscore is hidden by default and needs neither.

---

## Adding the next page

1. **Read the original.** Note its `<section>` classes, stylesheets and scripts.
2. **Match sections to components.** Most pages are the archetypes above. A new
   *visual treatment* of an existing content model is a variant field, not a new
   component — that is what keeps this at 19 rather than 45.
3. **Copy any new CSS/JS** into `css/ondc/` and `js/ondc/`, new images into
   `images/<page>/`.
4. **Create `src/pages/<slug>.liquid`** with `permalink: /<slug>.html` and the
   content as front matter under `sections:`, each item carrying
   `_bookshop_name: <component>`.
5. **Declare its assets** with `override:styles` and `override:scripts`. Do not
   list `category-chrome` — the layout always loads it.
6. **Do not add header, footer or sector rail to `sections`.** Set
   `show_sector_rail: true` if the page needs the pill row.
7. **If a new component was needed**, add its `_inputs` entries to
   `cloudcannon.config.yml` and its editor rules to `cms.css`.
8. **Build and check**: `npx @11ty/eleventy && npx @bookshop/generate --editable-regions`.

### Inline page scripts

The About page carried 20 KB of inline JavaScript, split by responsibility:

- `js/ondc/scroll-progress.js` — generic, ~20 pages, made null-safe
- `js/ondc/awards-lightbox.js` — belongs with `awards`
- `js/ondc/journey-map.js` — belongs with `timeline`

Expect the same for `careers`, `complaint` and `network-participants`, which each
carry 20 KB+ of inline script.

---

## Verified by building

| Check | Result |
| --- | --- |
| Careers page sections, text vs ondc.org | **257 / 257 words identical** |
| Careers markup vs ondc.org | identical but for the Bookshop wrapper, our flat image paths and our flat page URLs |
| RFP page chrome + headings, text vs ondc.org | **97 / 97 words identical** (the tender rows are now CMS content, so they differ by design) |
| About page sections, text vs ondc.org | **1044 / 1044 words identical** |
| Footer text vs ondc.org | **83 / 83 words identical** |
| Sector rail text vs ondc.org | **22 / 22 words identical** |
| RFP stylesheet order vs ondc.org | identical (6 of 6) |
| RFP page links | 38 local, **0 missing assets**, 14 pages not built yet |
| Home and About output, before vs after adding RFP | **byte-identical** |
| Nested `<main>` elements | none |
| Components loaded by Bookshop | 22, one Bookshop |
| Live editing applied | 3 of 3 pages |

### Editor geometry, measured

The built pages were loaded in a headless Chromium with `is-editing` applied —
the same class CloudCannon's frame triggers — and the real boxes measured:

| Page | Mode | Navbar | First section | Overlap |
| --- | --- | --- | --- | --- |
| `home.html` | editor | static, `0 → 88` | starts at `88` | none |
| `about-us.html` | editor | static, `0 → 88` | starts at `88` | none |
| `rfp.html` | live | sticky, `0 → 88` | starts at `88` | none |
| `rfp.html` | editor | static, `0 → 88` | starts at `88` | none |
| `careers.html` | live | sticky, `0 → 88` | starts at `88` | none |
| `careers.html` | editor | static, `0 → 88` | starts at `88` | none |

Also checked on `rfp.html`: no section left at `opacity: 0`, no
`[data-bk-intro]` still hidden, and **1 of 3 tab panels visible live vs 3 of 3
in the editor** — the rule that makes the hidden tabs editable.

The ledger itself was driven in a real browser, in both modes: tab switching,
search (matching, non-matching and cleared), the open/closed split, the hero
counter, and three forced section re-renders with no drift and no console
errors. A deliberately mistyped date (`20th Aug`) keeps its tender visible under
Open and logs a warning naming it, rather than silently dropping a live
tender.

Before the earlier fix, About's first section measured `top: -812` — exactly
`88 − 900`, one viewport — which is how the cancelling pair was found.

### Not verified

The CloudCannon editor itself. Worth checking on a test branch:

- **The timeline in editor mode.** It is the most heavily pinned section on the
  site and `cms.css` flattens it.
- **The footer shows content.** It is now in the built HTML, so it should appear
  immediately — but it will not update until you save and rebuild.
One local-only note: `npx @bookshop/generate --editable-regions` cannot finish
in this sandbox because the `node_modules` in the handover zip carries the macOS
esbuild binary and this machine has no npm access. Component discovery and the
"added live editing to 3 pages" step both succeed; only the final bundling step
stops. On CloudCannon the postbuild runs `npm i` on a Linux builder first, so it
gets the right binary — the same path the About page already builds through.
