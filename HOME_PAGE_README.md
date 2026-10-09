# ONDC home page (v2) — CloudCannon

Copy these into your repo root (merge, keep your existing files):
- `home.html`
- `css/ondc/` (original ONDC CSS + `cms.css`)
- `js/ondc/` (original ONDC scripts) and `js/ondc-home.js` (the animation port; delete the OLD `js/home.js`)
- `fonts/`, `images/`
- the `_editables.content` block in `cloudcannon.config.yml`

## Seeing the animations
The visual editor never plays animations (it stacks everything flat so you can click and edit).
Open the **preview/live URL of the built site** (e.g. `https://<your-site>.cloudvent.net/home.html`) in a normal browser tab.
Edit in CloudCannon -> save -> the live URL updates after the build.

## Editing notes
- Hero text: edit the dark "HERO" block at the top of the editor. Keep the order.
- Link URLs are edited in the Source editor, not the visual editor.
- Sector pills and the news "Read on..." line are static.
