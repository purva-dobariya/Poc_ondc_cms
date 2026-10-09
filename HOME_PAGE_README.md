# ONDC home page (CloudCannon edition)

Files added to the repo:

| Path | Purpose |
|---|---|
| `home.html` | The new home page. 9 sections, 83 `data-editable="source"` regions. |
| `css/home.css` | Theme ported from the original site (tokens, Space Grotesk + Inter, section looks). |
| `js/home.js` | Carousel + rail arrows. Never touches content inside editable regions. |
| `fonts/` | Space Grotesk 400/600/700, Inter 400–700 (woff2). |
| `images/home/…` | Hero, building-block, audience, story, news images, logo, India map. |
| `cloudcannon.config.yml` | Added an `_editables.content` toolbar config. |

Rules for editing markup later
1. Every editable region needs a unique `data-key` (per file) and `data-path="/home.html"`.
2. Style regions by tag/position (`.slide-content > p:first-child`), not by classes an editor could drop.
3. JS may not change text/classes/attributes inside a region — CloudCannon saves its innerHTML.
4. `html.is-editing` (set when `window.inEditorMode`) un-hides all carousel slides so each is editable.
