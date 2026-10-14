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

Pages are served flat: `/home.html`, `/about-us.html`, `/rfp.html`. Each new page
keeps that shape.

The postbuild hook `.cloudcannon/postbuild` must stay **executable in Git** — it is
what turns on click-to-edit. If click-to-edit stops working after a change, check
that first: `git update-index --chmod=+x .cloudcannon/postbuild`.

---

## 2. What editors can do

### Text, numbers, headings, buttons
Open **Pages → Home**. The page preview is on the right; the form is on the left.
Open a section in **Page sections** and every number, heading, description, button
label and piece of small print in it is a field. Save, and the preview refreshes once
the build finishes.

You can also **click text on the page itself** and type. Both routes edit the same
thing: use the form when you want to see every field at once, click the page when
you know exactly which words you want to change. Text edited on the page updates in
the preview as you type.

Two things are edited only from the sidebar, never by clicking the page: the
**navbar** and the **footer**. They appear on every page, so they live under
**Header & Footer** — and because they are baked in when the site builds, a change
to them shows up after you save, not as you type.

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

### The navbar and footer
These are **not** page sections — they are the same on every page, so they are edited
once under **Header & Footer** in the sidebar.

- **Menu** — the top navigation, including the drop-down. The current page's item is
  highlighted automatically. A link written as `#find-your-place` points at a spot on
  the home page and works from every page; you do not need to write the page part.
- **Footer** — the logo, blurb, link columns, social links, copyright line and the wide
  background illustration (a long, low picture works best, about 2400 x 900).

Because they are built into every page, these two update after you **save**, not as
you type. That is the trade for them never rendering blank.

A single page can override the footer if it ever needs its own — ask a developer to
set `page_footer` on it.

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
| Page hero | Full-bleed opening banner with a background photo. |
| Role page hero | Opening band with a big heading and an optional live counter. |
| Closing call to action | A closing heading and buttons. Two layouts — see below. |
| Numbered points | A summary beside groups of auto-numbered points. |
| Institutions | Named organisations plus a logo strip with a counter. |
| People | Photo, name, role and organisation. |
| Awards | A featured award plus awards grouped by year. |
| Timeline | A year-by-year story with the animated India map. |
| RFP / RFQ ledger | Tabs and a search box over the live tender table. |

**Closing call to action** has a **Layout** choice: *Plain* is the wide band used at
the foot of the About page, *Panel* is the white rounded card used at the foot of the
role pages — the Panel layout can also carry a paragraph.

**Use once per page:** Hero — scrolling story, Sector carousel, Building blocks deck,
Timeline. They each take over the scroll, so a second copy on the same page will fight
the first. The other sections can be used as many times as you like.

---

## 3a. Publishing a new RFP, RFQ or empanelled agency

Everything happens in CloudCannon — there is no spreadsheet and no S3 step.

1. Open **Pages → RFPs/RFQs**.
2. In **Page sections**, open the **RFP / RFQ ledger** section.
3. Scroll to **RFPs, RFQs and empanelled agencies** and click **+**. Pick one:

   | Choose | For |
   | --- | --- |
   | **Open RFP / RFQ** | A tender you are inviting proposals for |
   | **Closed RFP / RFQ** | A past tender, for the record |
   | **Empanelled agency** | An agency on the empanelled list |

4. Fill in the fields:

   | Field | What to put |
   | --- | --- |
   | Which tab it appears under | Already set by what you picked |
   | RFP / RFQ number | The reference, e.g. `ONDC/RFP/2026/001` |
   | Name | The title applicants will read |
   | Deadline — last date and time to apply | Pick the day on the left, then set the time on the right. Leave empty for an agency. |

   To set the **time**: click on the hour, type it, and keep typing through the
   minutes and AM/PM — or use the up and down arrow keys. The box shows the
   time in India Standard Time.

5. Add the documents — see below.
6. **Save.** It is live once the build finishes, about a minute.

### Attaching a document

Under **Documents**, click **+**. Each document has three fields:

| Field | What to do |
| --- | --- |
| **What this document is** | Type the wording that will appear as the download link — *RFP document*, *Corrigendum 1*, *Annexure A* |
| **Upload the document** | **Click the field and a file picker opens.** Choose the PDF from your computer. You never type a path here. |
| **…or link to a file already online** | Only if the file is hosted elsewhere. Paste the full web address, for example an existing link on ONDC's S3. |

Use **one** of the last two. If both are filled in, the uploaded file wins.

Once a document is attached, the collapsed row shows what it is and **which
file is on it** — the filename, or "No file attached yet" if you have not added
one. An image shows a thumbnail; a PDF shows a document icon.

> If **Upload the document** shows as a plain empty text box with no file
> picker, the site is running an older version of the configuration. Nothing
> you type into it will work.

Uploaded files are stored with the website under `files/rfp/`, and the download
link on the page points at them automatically. Keep them sensible in size — a
few MB is normal for a tender PDF. Over roughly 10 MB, host it on S3 and paste
the link instead.

### Deadlines have a time, not just a date

The deadline is a date **and** a time of day, and the tender closes at exactly
that moment — 17:30 means half past five that afternoon, not midnight.

Times are **India Standard Time** for everyone. Someone reading the page in
London or New York sees the same `30.11.2026, 17:30 IST`, not a time converted
into their own zone. That is deliberate: a tender deadline is a single moment,
and quoting it in each reader's local time invites mistakes.

Seconds appear only when you set them, so an ordinary deadline reads
`30.11.2026, 17:30` and a last-moment one reads `15.12.2026, 23:59:59`.

### Open and Closed look after themselves

You never move a tender between tabs. It sits under **Open** until its deadline
passes and appears under **Closed** straight after, and the big number in the
hero counts whatever is open. That happens in the reader's browser, so it stays
right even if nobody touches the site for months.

That is the **Move tenders between Open and Closed automatically** tick box, and
it should stay ticked. Untick it only if you want to decide every tender's tab
by hand — then whatever you picked in step 3 is final.

Empanelled agencies are never moved either way. An entry with no usable
deadline stays in the tab you chose rather than disappearing.

### When a tab is empty

Each tab has its own **Heading when this tab is empty** and **Message when this
tab is empty**. That is where "No empanelled agencies yet" comes from — put a
real agency in that tab and the message is replaced by the list.

### The four example entries

The page ships with four made-up entries so every tab has something in it.
**Delete all four** before the page goes live, and delete the two sample PDFs in
`files/rfp/` with them.

### While you are editing

All three tabs are shown stacked so you can click into any of them. On the live
page only the selected tab shows.

---

## 4. How it fits together (for developers)

```
eleventy.config.js             build config (passthrough for css/js/images/fonts/files)
cloudcannon.config.yml         collections, structures and every field's editor
.cloudcannon/postbuild         runs @bookshop/generate --editable-regions  (must be +x)
schemas/                       the "blank page" / "landing page" starting points
src/_data/site.json            logo, menu, footer — every page uses it
src/pages/*.liquid             one file per page; front matter holds `sections`
src/_includes/base.liquid      the page shell
src/_includes/chrome/          header, sector rail, footer — rendered at build time
component-library/components/  one folder per section type (template + .bookshop.yml)
component-library/shared/      the page helper that loops over `sections`
css/ js/ images/ fonts/        unchanged assets, copied straight through
css/ondc/cms.css               editor-mode overrides. Loads LAST. See ADDING_PAGES.md
files/rfp/                     RFP documents uploaded through the CMS
```

**To add a new KIND of section**, create
`component-library/components/<name>/` with `<name>.eleventy.liquid` and
`<name>.bookshop.yml`, then add any new field names to `_inputs` in
`cloudcannon.config.yml` so they get a proper label. Bookshop finds it
automatically — there is no list of sections to update.

`ADDING_PAGES.md` is the full version of this, including the four rules a
component has to follow to behave in the editor. Read it before writing one.

**Click-to-edit works**, through Bookshop. Components are authored as plain
`{{ field }}` output and `@bookshop/generate --editable-regions` does the rest
in the postbuild step. Two things stay sidebar-only on purpose: the navbar and
footer, which are rendered by the layout so they can never come out blank.

**`js/ondc-home.js`** only animates what the HTML already contains — it never
rewrites the contents of an editable region, and it skips the scroll story on
pages that do not have one.
