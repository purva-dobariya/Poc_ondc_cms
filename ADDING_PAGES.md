# Adding pages — architecture and how-to

Two pages are in the CMS: the home page and `/about-us.html`. The About page is
the worked example for the remaining 47 ondc.org pages.

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

Three more per-page switches, all hidden from editors:

| Field | Purpose | Home | About |
| --- | --- | --- | --- |
| `body_class` | class on `<body>` | `home` | *(none)* |
| `wrapper_tag` / `wrapper_id` / `wrapper_class` | the element around the sections | `div#root` | `main.bk` |
| `show_progress` | the scroll-progress bar | off | on |

---

## URLs

Every page is served flat at `/<slug>.html`, which is what
`collections_config.pages.url: /[slug].html` expects. The two must agree — when
they disagree CloudCannon shows "No preview available" even though the build
succeeded.

Links in the header, footer and sector rail already point at the remaining 46
pages. They 404 until each page is built, and start working the moment it lands.

---

## The component library

19 components, each a folder under `component-library/components/<name>/` with a
template and a `.bookshop.yml` spec. All are page content; none is chrome.

**Added for the About page**, all reusable:

| Component | What it is | Where it is used again |
| --- | --- | --- |
| `page_hero` | Full-bleed hero: photo, heading, paragraphs, buttons | ~46 of the 48 pages |
| `closing_cta` | Short closing heading + buttons | ~44 pages |
| `numbered_lists` | A lead beside groups of auto-numbered points | sector pages, careers |
| `institutions` | Named organisations + a logo strip with a counter | about, investor pages |
| `people_grid` | Photo, name, role, organisation | about, careers |
| `awards` | Featured award + awards by year, with a lightbox | about |
| `timeline` | Year-by-year story with the animated India map | about |

### Two rules that are not optional

**1. A component reads the data it needs itself.** It must not receive data
through a helper or the layout — Bookshop re-renders components in the browser,
and anything passed in from outside is gone. This is the same failure that moved
the chrome into the layout.

**2. Anything that animates needs an editor rule in `css/ondc/cms.css`.**
`.bk-rv` starts at `opacity: 0` and only reveals on scroll. The editor never
scrolls, so without a rule the page renders invisible. The navbar is also pinned
to `position: static` in editor mode — left sticky it floats over the first
section and swallows that section's hover controls, making the top section
impossible to select.

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
| About page sections, text vs ondc.org | **1044 / 1044 words identical** |
| Footer text vs ondc.org | **83 / 83 words identical** |
| Sector rail text vs ondc.org | **22 / 22 words identical** |
| Footer rendered into the HTML | both pages: 21 links, 3 columns, logo, copyright |
| Home page body text, before vs after | **1708 / 1708 words identical** |
| Local asset references | 0 missing |
| Nested `<main>` elements | fixed — the sections wrapper is now a `div` |
| Components loaded by Bookshop | 19, one Bookshop |

### Not verified

The CloudCannon editor itself. Worth checking on a test branch:

- **The first section is selectable.** This was the navbar overlap; the fix is a
  `cms.css` rule, untested in a real editor.
- **The timeline in editor mode.** It is the most heavily pinned section on the
  site and `cms.css` flattens it.
- **The footer shows content.** It is now in the built HTML, so it should appear
  immediately — but it will not update until you save and rebuild.
