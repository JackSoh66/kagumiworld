import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

export async function validate() {
  const entries = JSON.parse(await readFile(new URL('../data/experiments.json', import.meta.url), 'utf8'));
  assert(Array.isArray(entries) && entries.length > 0, 'The collection must contain at least one real experiment.');
  const dates = new Set();
  const slugs = new Set();
  for (const entry of entries) {
    for (const field of ['title', 'subtitle', 'description', 'interaction']) {
      assert(typeof entry[field] === 'string' && entry[field].trim(), `${entry.slug}: missing ${field}`);
    }
    assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.date), 'Use ISO dates.');
    assert(new Date(`${entry.date}T00:00:00Z`).toISOString().startsWith(entry.date), 'Invalid calendar date.');
    assert(!dates.has(entry.date), `Duplicate experiment date: ${entry.date}`);
    assert(!slugs.has(entry.slug), `Duplicate slug: ${entry.slug}`);
    assert(new RegExp(`^${entry.date}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(entry.slug), 'Slug must start with the date.');
    assert(['Playground', 'Landing page', 'System'].includes(entry.category), 'Unknown category.');
    assert(Array.isArray(entry.tags) && entry.tags.length >= 2 && entry.tags.every((tag) => typeof tag === 'string' && tag.trim()), 'Supply at least two tags.');
    assert.equal(entry.path, `experiments/${entry.slug}/`, 'Each experiment must have an independent folder.');
    assert.equal(entry.preview, `previews/${entry.slug}.svg`, 'Each experiment must have a local SVG preview.');
    assert.equal(entry.research, `research/${entry.date}.md`, 'Each experiment must have a research note.');
    const html = await readFile(new URL(`../public/${entry.path}index.html`, import.meta.url), 'utf8');
    assert(/<h1[\s>]/i.test(html), `${entry.slug} needs a real heading.`);
    assert(/name=["']viewport["']/i.test(html), `${entry.slug} needs responsive viewport metadata.`);
    await access(new URL(`../public/${entry.preview}`, import.meta.url));
    const note = await readFile(new URL(`../${entry.research}`, import.meta.url), 'utf8');
    assert(note.includes(entry.date), 'The research note must include the date.');
    assert((note.match(/https:\/\//g) || []).length >= 2, 'Cite at least two sources, explaining access limits honestly.');
    dates.add(entry.date);
    slugs.add(entry.slug);
  }
  console.log(`Validated ${entries.length} experiment(s), local previews, independent pages, and research notes.`);
  return entries;
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) await validate();
