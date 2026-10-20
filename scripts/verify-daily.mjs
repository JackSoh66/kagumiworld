import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { localDate } from './date.mjs';
import { validate } from './validate.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const date = process.env.KAGUMI_DATE || localDate();
assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 'Invalid run date.');
const baseline = process.env.KAGUMI_BASE_SHA || 'HEAD';
assert(baseline === 'HEAD' || /^[a-f0-9]{40}$/.test(baseline), 'Invalid baseline.');
assert.equal(git('rev-parse', 'HEAD'), git('rev-parse', baseline), 'The agent must not commit or change branches.');
const before = JSON.parse(git('show', `${baseline}:data/experiments.json`));
const after = await validate();
const added = after.filter((entry) => !before.some((old) => old.slug === entry.slug));
assert.equal(added.length, 1, 'Exactly one new experiment is required.');
assert.equal(added[0].date, date, 'The new experiment must use the run date in Kuala Lumpur.');
assert.equal(after.length, before.length + 1, 'Do not remove archived work.');
assert.deepEqual(after.filter((entry) => entry.slug !== added[0].slug), before, 'Preserve existing metadata and its order.');
const slug = added[0].slug;
const allowed = (file) => file === 'data/experiments.json' || file === `research/${date}.md` || file === `public/previews/${slug}.svg` || file === `tests/${date}.spec.js` || file.startsWith(`public/experiments/${slug}/`);
const changed = git('diff', '--name-only', baseline).split('\n').filter(Boolean);
const untracked = git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
for (const file of new Set([...changed, ...untracked])) assert(allowed(file), `Out-of-scope daily change: ${file}`);
for (const file of changed) {
  if (file !== 'data/experiments.json') {
    const existed = git('ls-tree', '--name-only', baseline, '--', file);
    assert(!existed, `Daily runs can only add new work, not overwrite: ${file}`);
  }
}
const note = await readFile(new URL(`../research/${date}.md`, import.meta.url), 'utf8');
assert(note.length >= 700, 'Explain evidence, selection, interaction, limitations, and checks in the daily note.');
const testPath = new URL(`../tests/${date}.spec.js`, import.meta.url);
assert((await readFile(testPath, 'utf8')).includes('test('), 'Add a real interaction test for the new work.');
console.log(`Daily scope verified: one new experiment, ${date}; archive and automation preserved.`);
