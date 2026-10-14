#!/usr/bin/env node
/* Delete RFP documents that nothing points at any more.
 *
 * CloudCannon does not remove an uploaded file when you delete the entry that
 * referenced it — the upload and the page content are separate things, and it
 * has no way of knowing the file is not used somewhere else. So removing a
 * document, or a whole tender, leaves its PDF behind in files/rfp/ forever.
 * This finds those and removes them.
 *
 *   node scripts/prune-rfp-uploads.mjs              # report only (default)
 *   node scripts/prune-rfp-uploads.mjs --delete     # actually remove them
 *   node scripts/prune-rfp-uploads.mjs --delete --min-age-hours=0
 *
 * Two deliberate safety rules:
 *
 * 1. ONLY files/rfp/ is ever touched. Nothing else in the repo is considered.
 * 2. A file must be older than --min-age-hours (default 48) to be removed.
 *    An editor can upload a document and not attach it until later; without
 *    this, an automated run between those two moments would delete their file.
 *
 * Note on repository size: deleting a file here tidies the working tree, but
 * Git history still holds every version ever committed, so the clone does not
 * get smaller. For genuinely large documents, host them elsewhere and use the
 * "link to a file already online" field instead of uploading.
 */
import { readFile, readdir, stat, unlink } from 'node:fs/promises';
import { join, relative } from 'node:path';

const UPLOAD_DIR = 'files/rfp';
const SEARCH_ROOTS = ['src'];          // where references can legitimately live
const KEEP = new Set(['README.md']);   // never remove these

const args = process.argv.slice(2);
const doDelete = args.includes('--delete');
const minAgeHours = Number(
  (args.find((a) => a.startsWith('--min-age-hours=')) || '--min-age-hours=48').split('=')[1]
);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;                        // directory does not exist — fine
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/* Every string in the sources that looks like a reference to an upload. Kept
 * deliberately loose — it matches the filename anywhere in any source file, so
 * a reference written in a way this script does not anticipate still counts
 * and the file is kept. Erring toward keeping is the right bias here. */
async function referencedNames() {
  const names = new Set();
  for (const root of SEARCH_ROOTS) {
    for (const file of await walk(root)) {
      let text;
      try {
        text = await readFile(file, 'utf8');
      } catch {
        continue;                      // binary or unreadable — skip
      }
      for (const m of text.matchAll(/files\/rfp\/([^\s"'<>)\]]+)/g)) {
        names.add(decodeURIComponent(m[1]));
      }
    }
  }
  return names;
}

const referenced = await referencedNames();
const onDisk = (await walk(UPLOAD_DIR)).map((p) => relative(UPLOAD_DIR, p));

const now = Date.now();
const orphans = [];
const tooNew = [];

for (const name of onDisk) {
  if (KEEP.has(name) || referenced.has(name)) continue;
  const { mtimeMs } = await stat(join(UPLOAD_DIR, name));
  const ageHours = (now - mtimeMs) / 36e5;
  (ageHours >= minAgeHours ? orphans : tooNew).push({ name, ageHours });
}

console.log(`${UPLOAD_DIR}: ${onDisk.length} file(s), ${referenced.size} referenced`);

if (tooNew.length) {
  console.log(`\nUnreferenced but kept (newer than ${minAgeHours}h):`);
  for (const o of tooNew) console.log(`  ${o.name}  (${o.ageHours.toFixed(1)}h old)`);
}

if (!orphans.length) {
  console.log('\nNothing to remove.');
  process.exit(0);
}

console.log(`\n${orphans.length} unreferenced file(s)${doDelete ? '' : ' — run with --delete to remove'}:`);
for (const o of orphans) console.log(`  ${o.name}`);

if (doDelete) {
  for (const o of orphans) await unlink(join(UPLOAD_DIR, o.name));
  console.log(`\nRemoved ${orphans.length} file(s).`);
}
