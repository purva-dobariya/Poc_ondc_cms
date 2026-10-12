# ONDC site — CloudCannon guide

The site is now built from **sections**. A page is a list of sections; editors add,
duplicate, reorder and delete them without a developer. The look, the theme and the
animations are unchanged.

---

## 1. One-time setup in CloudCannon (do this first)

The site used to be plain HTML with no build. It now builds with Eleventy, so the
build settings have to change once. In CloudCannon: **Site Settings → Build**

| Setting         | Value                |
| --------------- | -------------------- |
| Site generator  | Eleventy             |
| Install command | `npm install`        |
| Build command   | `npx @11ty/eleventy --config=eleventy.config.js` |
| Output path     | `_site`              |

> The repo deliberately contains **no hidden (dot) files**. macOS Finder hides
> those, and copying a folder without them is what makes the build fail with a
> `TemplateLayoutPathResolver` error.

Then push this repo and let the build run. Until the build settings are changed the
site will not publish.

The page addresses do not change: `/home.html`, `/index.html`, `/about.html`.

---

## 2. What editors can do

### Text, numbers, headings, buttons
Open **Pages → Home**. The page preview is on the right; the form is on the left.
Open a section in **Page sections** and every number, heading, description, button
label and piece of small print in it is a field. Save, and the preview refreshes once
the build finishes.

Editing happens in that form rather than by clicking text on the page. Click-to-edit
needs a framework renderer (Astro, React or Vue) that Eleventy does not have, so the
preview here is read-only. Everything is still editable without a developer.

### Images and video
Every picture is an image field: **Upload** a new one or pick an existing one, and use
**Crop** in CloudCannon's image editor to change the framing.

The **Image or video** section (and each card in a **Cards** section) also offers:

- a picture,
- a video file you upload (an `.mp4` under about 20 MB),
- a YouTube or Vimeo link — paste the normal address and the player is embedded.

### Sections: add, duplicate, reorder, delete
In the page's sidebar, open **Page sections**:

- **+** adds a section — pick one from the list,
- the **⋮** menu on a section duplicates or deletes it,
- **drag** a section by its handle to move it up or down.

Save, and the change is live after the build.

### Pages: create, duplicate
In **Pages**, click **+**:

- **Blank page** — starts with one text section,
- **Landing page starter** — text, an image, three cards and a call to action.

To copy an existing page, use the **⋮** menu on it in the Pages list and choose
Duplicate. Set **Page address** (for example `/contact.html`) and keep it unique.

Developers: never point a schema at a file inside `src/pages`. CloudCannon treats a
file used as a schema as a template and hides it from the Pages list.

### Site-wide bits
**Site settings** holds the logo, the top menu (including the drop-down) and the shared
footer. Changing it changes every page.

### The footer
Every page ends with a **Footer** section, the last item in **Page sections**. It has one
tick box, *Use the shared footer from Site settings*:

- **Ticked** (the normal case) — the footer comes from **Site settings → Footer**, so one
  edit updates every page. The fields there are the logo, the blurb, the link columns,
  the social links, the copyright line and the background artwork.
- **Unticked** — that one page gets its own footer, and the same fields appear right there
  in the section.

The wide illustration behind the footer is now a normal image field, so it can be
replaced without a developer. A long, low picture works best, about 2400 x 900.

To drop the footer from a page entirely, delete the Footer section. Add it back from
**+ Add Page section** whenever you want it again.

### Previewing
The visual editor shows the page as it will look, next to the form. Use the device
buttons for desktop and mobile. Nothing is public until the build finishes and the site
is published.

---

## 3. The section library

| Section | What it is |
| --- | --- |
| Rich text | Heading + body text. The everyday section. |
| Image or video | One picture, an uploaded video, or a YouTube / Vimeo embed. |
| Cards | A row of 2–4 cards, each with a picture or video, a title and text. |
| Call to action | Wide banner with a heading and buttons. |
| Hero — scrolling story | The animated opening story. One per page, at the top. |
| Tagline strip | One large statement with a line underneath. |
| Sector carousel | The full-screen sector slides with "By the numbers". One per page. |
| Key numbers | The row of big numbers that count up. |
| Building blocks deck | The dark deck of cards that slide across on scroll. |
| Doors — find your place | Swipeable row of large cards with a list and a button. |
| Story posters | Quote posters linked to LinkedIn posts. |
| News rail | Swipeable press cards, numbered automatically. |
| Footer | The site footer. Shared across pages by default. |

**Use once per page:** Hero — scrolling story, Sector carousel, Building blocks deck.
They each take over the scroll, so a second copy on the same page will fight the first.
The other sections can be used as many times as you like.

---

## 4. How it fits together (for developers)

```
eleventy.config.js        build config (passthrough for css/js/images/fonts)
cloudcannon.config.yml    the section library + every field's editor
schemas/page.njk          the "blank page" starting point
src/_data/site.json       logo, menu, footer — every page uses it
src/pages/*.njk           one file per page; front matter holds `sections`
src/_includes/base.njk    the page shell; loops over `sections`
src/_includes/sections/   one template per section type
src/_includes/partials/   header, footer body, social icon, media (image/video/embed)
css/ js/ images/ fonts/   unchanged assets, copied straight through
css/ondc/blocks.css       styles for the section types editors can add
```

**To add a new KIND of section:**

1. Add `src/_includes/sections/<name>.njk`. Its data arrives as `section`.
2. Add a value to `_structures.sections` in `cloudcannon.config.yml` with `_type: <name>`,
   a label, an icon and sensible starting content.
3. Add any new field names to `_inputs` so they get a proper label in the editor.

**No `data-editable` attributes.** CloudCannon's array and component regions need a
registration script that only the Astro / React / Vue renderers provide; on Eleventy they
fail with "Failed to find a registered component". Editing therefore runs through the
sidebar form, which is driven entirely by `cloudcannon.config.yml`.

**`js/ondc-home.js`** only animates what the HTML already contains — it never rewrites
the contents of an editable region, and it skips the scroll story on pages that do not
have one.
