# Nunjucks → Liquid migration (home page)

Step 1 of the move to click-to-edit and live re-render. **Everything here is done.**
Step 2 (Bookshop) is scaffolded at the bottom but not applied — it needs `npm install`.

---

## What changed

| File group | Change |
| --- | --- |
| `src/_includes/**/*.njk` | → `.liquid`, 18 templates ported |
| `src/pages/home.njk` | → `home.liquid` (rename only — the file is 100% front matter, 0 bytes of template code) |
| `src/pages/about.njk`, `index.njk` | **deleted** (POC pages) |
| `schemas/*.njk` | → `.liquid` |
| `src/pages/pages.json` | `layout: base.njk` → `base.liquid` |
| `eleventy.config.js` | `htmlTemplateEngine` / `markdownTemplateEngine`: `njk` → `liquid` |
| `cloudcannon.config.yml` | collection glob, `create.path` and both schema paths → `.liquid` |

The custom filters (`nl2br`, `embedUrl`) needed **no change**: `eleventyConfig.addFilter`
registers across all engines, including Liquid, and neither filter takes arguments.

### Syntax substitutions applied

| Nunjucks | Liquid | Count |
| --- | --- | --- |
| `{% set x = y %}` | `{% assign x = y %}` | 7 |
| `\| default("x")`, `\| default(3)` | `\| default: "x"`, `\| default: 3` | 12 |
| `loop.index0`, `loop.index`, `loop.first` | `forloop.*` | 12 |
| `\| safe` | removed (liquidjs does not escape output) | 5 |
| `\| length` | `\| size` | 3 |
| `{% elif %}` | `{% elsif %}` | 5 |
| `{% if not x %}…{% endif %}` | `{% unless x %}…{% endunless %}` | 1 |
| `{{ loop.index0 * 90 }}` | `{{ forloop.index0 \| times: 90 }}` | 6 |
| `{% include "x.njk" %}` | `{% include "x" %}` | 6 |

Liquid has no inline arithmetic operators, but it **does** support filters in output,
so the delay expressions became `| times:` / `| plus:` rather than needing `assign`.

### Two hand-written changes

**The dynamic section include** — the one line that needed real thought:

```liquid
{%- for section in sections %}
{%- assign section_template = "sections/" | append: section._type %}
{% include section_template %}
{%- endfor %}
```

Eleventy sets liquidjs `dynamicPartials: true`, so a variable resolves as a partial name
and the `.liquid` extension is implied.

**The `media.njk` image bug is fixed.** The `<img>` tag had leftover text producing two
junk attributes on every rendered image:

```
- loading="lazy"media") }}.image"media") }}.alt"/>
+ loading="lazy"/>
```

---

## How to verify

```bash
npm install
npx @11ty/eleventy
```

Then diff `_site/home.html` against a build of the previous Nunjucks version. The output
should be byte-identical except for the two junk `<img>` attributes, which are now gone.

---

## What I could and could not check

**Checked** (by a static validator over all 18 templates):

- No Nunjucks-only syntax remains
- Every `{% if %}` / `{% for %}` / `{% unless %}` is balanced and correctly closed
- Every `{% include %}` resolves to a file that exists
- All 9 `_type` values used by `home.liquid` have a matching `sections/<type>.liquid`

**Not checked** — the sandbox had no network access to npm, so Eleventy could not be
installed or run. The build itself, the rendered HTML, and CloudCannon's editor behaviour
are all unverified. Run the two commands above before trusting this.

### One behavioural difference to watch

Nunjucks auto-escapes `{{ }}`; **liquidjs does not**. Today this changes nothing: all 8
`&amp;` and all 16 `<strong>` tags in `home.liquid` sit in fields rendered with `| safe`
(`point.text`, `bullet.text`), which were already unescaped. No plain-text field currently
contains `&` or `<`.

It is still a latent difference. If an editor ever types `<` or `&` into a heading or
label, Liquid will emit it raw where Nunjucks escaped it. The fix is `| escape` on
plain-text outputs — worth doing deliberately, after confirming against real content,
rather than as part of this port.

---

## Step 2 — Bookshop, for live re-render

Live re-render on Eleventy comes from Bookshop, and Bookshop's docs state:
*"Currently, Bookshop only supports liquid templating on Eleventy sites."* The port above
is the prerequisite.

```bash
npx @bookshop/init --new _component-library --framework eleventy
npm i --save-exact @bookshop/eleventy-bookshop
npm i --save-exact --save-dev @bookshop/generate @bookshop/browser @bookshop/eleventy-engine
```

`eleventy.config.js`:

```js
const pluginBookshop = require("@bookshop/eleventy-bookshop");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginBookshop({
    bookshopLocations: ["_component-library"],
    pathPrefix: ''
  }));
  // …existing filters and passthrough stay as they are
};
```

`.cloudcannon/postbuild` (repo root, executable):

```bash
#!/usr/bin/env bash
npx @bookshop/generate --editable-regions
```

The `--editable-regions` flag is what adds text, image and **array** regions — array
regions are what let editors add, remove and reorder sections on the page itself. It
requires Bookshop 3.17.1 or later.

### What moves

Each section becomes a folder instead of a single file:

```
_component-library/components/metrics/
  metrics.bookshop.yml      ← label, icon, preview, starting content
  metrics.eleventy.liquid   ← the template, unchanged from src/_includes/sections/
```

The `.bookshop.yml` files **generate** the CloudCannon Structures, replacing the
hand-written `_structures.sections` block — about 360 of the current 797 lines of
`cloudcannon.config.yml`. The `_inputs` block stays where it is.

`shared/eleventy/page.eleventy.liquid` takes over the sections loop currently in
`base.liquid`.

### Two things to handle

1. **`nl2br` and `embedUrl`** must be registered as Bookshop plugins, or guarded with
   `{% if env_bookshop_live %}`, so the Visual Editor can parse templates that call them.
2. **The scroll animations are fine.** `fx.js`, `ondc-home.js`, `hero-map.js` and
   `home-network.js` act on rendered HTML rather than being template plugins, so templates
   re-render cleanly while the animations stay inert in the editor — which the existing
   `html.is-editing` rules in `cms.css` already handle.

### Validate before converting all 30 components

CloudCannon currently has two generations of visual-editing tooling — Bookshop and the
newer `@cloudcannon/editable-regions` package — and its own starter templates have begun
moving from the first to the second, while the second's Component region type remains
Astro/React only.

Convert two or three sections, enable `--editable-regions`, and confirm live re-render and
on-page section reordering in a real CloudCannon editor before committing the rest.

### CloudCannon build settings

Unchanged from today:

| Setting | Value |
| --- | --- |
| Site generator | Eleventy |
| Install command | `npm install` |
| Build command | `npx @11ty/eleventy --config=eleventy.config.js` |
| Output path | `_site` |
