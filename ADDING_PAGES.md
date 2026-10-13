# Adding pages — architecture and how-to

The About page (`/about-us.html`) is now in the CMS. It is also the worked example
for the remaining 47 ondc.org pages: everything below is the pattern it follows.

---

## What changed to make a second page possible

The repo previously hard-coded the home page's CSS and JavaScript into
`src/_includes/base.liquid`. That works for one page and breaks on the second,
because About needs `beckn.css` and `type-boost.css` and must **not** load the
home page's carousel code.

**Assets are now declared per page.** `base.liquid` loops over two lists:

```liquid
{% for sheet in styles %}  <link rel="stylesheet" href="/css/ondc/{{ sheet }}.css">
{% endfor %}
...
{% for script in scripts %}  <script src="{{ script }}" defer></script>
{% endfor %}
```

Defaults live in `src/pages/pages.json`; a page overrides them in its own front
matter. Note the `override:` prefix — Eleventy **concatenates** arrays through the
data cascade, so without it a page's list is appended to the default instead of
replacing it:

```yaml
override:styles: [fx, scale, type-boost, beckn, mobile]
override:scripts:
  - /js/ondc/fx.js
  - /js/ondc/beckn.js
```

`blocks.css` and `cms.css` are always loaded last, in that order. `cms.css` must
stay last: it is the editor layer.

Three more per-page switches, all `type: hidden` so editors never see them:

| Field | Purpose | Home | About |
| --- | --- | --- | --- |
| `body_class` | class on `<body>` | `home` | *(none)* |
| `wrapper_tag` / `wrapper_id` / `wrapper_class` | the element wrapping the sections | `div#root` | `main.bk` |
| `show_progress` | the scroll-progress bar | off | on |

---

## URLs

Every page is served flat at `/<slug>.html`, which is what
`collections_config.pages.url: /[slug].html` in `cloudcannon.config.yml` expects.
The two must agree — when they disagree CloudCannon shows "No preview available"
even though the build succeeded.

ondc.org serves most pages under `/pages/`. All 27 of those links in
`src/_data/site.json`, plus 12 in the home page's own content, were rewritten to
the flat form. Keep new pages flat too.

The links in the header, footer and sector rail already point at the remaining 46
pages. They 404 until each page is built — that is expected, and each one starts
working the moment its page lands.

---

## The component library

22 components. Each is a folder under `component-library/components/<name>/` with
a template and a `.bookshop.yml` spec.

**Added for the About page**, and all reusable:

| Component | What it is | Where it is used again |
| --- | --- | --- |
| `page_hero` | Full-bleed hero: photo, heading, paragraphs, buttons | ~46 of the 48 pages |
| `closing_cta` | Short closing heading + buttons above the footer | ~44 pages |
| `numbered_lists` | A lead beside groups of auto-numbered points | sector pages, careers |
| `institutions` | Named organisations + a logo strip with a counter | about, investor pages |
| `people_grid` | Photo, name, role, organisation | about, careers |
| `awards` | Featured award + awards grouped by year, with a lightbox | about |
| `timeline` | Year-by-year story with the animated India map | about |
| `sector_rail` | The sector pill row above the footer | 21 pages |

`site_header` is the one component with **no** `structures` key, so it does not
appear in "Add Page section". It is page chrome, not a section.

### Two rules that are not optional

**1. A component reads shared data itself.** It must not receive it through a
helper or the layout. `site_footer` and `sector_rail` read `site.footer.*` and
`site.sectors.*` directly, and those keys are exposed to live editing by
`data_config` in `cloudcannon.config.yml`. Pass data in from outside and the
section renders empty in the editor while looking fine on the live site.

**2. Anything that animates needs an editor rule in `css/ondc/cms.css`.**
`.bk-rv` starts at `opacity: 0` and only reveals on scroll. The editor never
scrolls, so without a rule the whole page renders invisible. The rules added for
About cover `.bk-rv`, the two canvases, the pinned timeline, the full-height hero,
the award lightbox and the progress bar.

---

## Adding the next page

1. **Read the original.** Note its `<section>` classes, its stylesheets and its
   scripts.
2. **Match sections to components.** Most pages are the archetypes in the table
   above. A new *visual treatment* of an existing content model is a variant
   field, not a new component — that is what keeps this at 22 rather than 45.
3. **Copy any new CSS/JS** into `css/ondc/` and `js/ondc/`, and new images into
   `images/<page>/`.
4. **Create `src/pages/<slug>.liquid`** with `permalink: /<slug>.html` and the
   content as front matter under `sections:`, each item carrying
   `_bookshop_name: <component>`.
5. **Declare its assets** with `override:styles` and `override:scripts`.
6. **If a new component was needed**, add its `_inputs` entries to
   `cloudcannon.config.yml` and its editor rules to `cms.css`.
7. **Build and check**: `npx @11ty/eleventy && npx @bookshop/generate --editable-regions`.

### Inline page scripts

The About page carried 20 KB of inline JavaScript. It was split into three files
by responsibility rather than copied as one blob:

- `js/ondc/scroll-progress.js` — generic, reused by ~20 pages, and made null-safe
- `js/ondc/awards-lightbox.js` — belongs with the `awards` component
- `js/ondc/journey-map.js` — belongs with the `timeline` component

Expect to do the same for the other bespoke pages (`careers`, `complaint`,
`network-participants` each carry 20 KB+ of inline script).

---

## How this page was verified

The build was run and the output compared against the live ondc.org page:

| Check | Result |
| --- | --- |
| Visible page text | **1066 of 1066 words identical (100%)** |
| Sections, in order | 7 of 7 match |
| Numbered points / people / awards | 9 / 11 / 7 — all match |
| Timeline years, entries, milestones | 6 / 26 / 5 — all match |
| Sector pill classes | 12 of 12 match, including `pill-life` |
| Local asset references | 103 resolve, 0 missing |
| Bookshop components loaded | 22, one Bookshop |
| Editable regions on the page | 9 |
| Home page stylesheet + script order | unchanged |

### What was not verified

The CloudCannon editor itself. Live re-rendering, click-to-edit on the new
sections and the editor-mode CSS can only be confirmed in a real editor — push to
a test branch and check there before merging.

Two things to look at specifically:

- **The timeline in the editor.** It is the most heavily pinned section on the
  site. The `cms.css` rules flatten it, but that is untested.
- **The board-of-directors canvas.** `about-board-network.js` targets
  `#boardNetworkCanvas`; the canvas is hidden in editor mode, so the script should
  idle rather than error.
