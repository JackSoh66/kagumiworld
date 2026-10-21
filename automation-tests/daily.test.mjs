import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { localDate } from '../scripts/date.mjs';

test('daily dates respect Kuala Lumpur midnight rather than the runner timezone', () => {
  assert.equal(localDate(new Date('2026-10-20T15:59:59Z')), '2026-10-20');
  assert.equal(localDate(new Date('2026-10-20T16:00:00Z')), '2026-10-21');
});

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'kagumi-daily-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const write = async (file, text) => {
    const target = join(root, file);
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, text);
  };
  const entry = (date, name) => ({ slug: `${date}-${name}`, title: name, subtitle: 'A real study', description: 'An interactive study', interaction: 'A working control', date, category: 'Playground', tags: ['Canvas', 'Art'], path: `experiments/${date}-${name}/`, preview: `previews/${date}-${name}.svg`, research: `research/${date}.md` });
  const old = entry('2026-10-20', 'old');
  const next = entry('2026-10-21', 'new');
  const add = async (item) => {
    await write(`public/${item.path}index.html`, '<html><head><meta name="viewport" content="width=device-width"></head><body><h1>Study</h1></body></html>');
    await write(`public/${item.preview}`, '<svg xmlns="http://www.w3.org/2000/svg"/>');
    await write(item.research, `${item.date}\nhttps://example.org/one\nhttps://example.org/two\n${'Real source observations and specific design reasoning. '.repeat(25)}`);
    await write(`tests/${item.date}.spec.js`, "test('interaction', async () => {});\n");
  };
  await mkdir(join(root, 'scripts'));
  for (const file of ['date.mjs', 'validate.mjs', 'verify-daily.mjs', 'prepare-daily.mjs']) await copyFile(new URL(`../scripts/${file}`, import.meta.url), join(root, 'scripts', file));
  await write('data/experiments.json', JSON.stringify([old]));
  await add(old);
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init', '-b', 'main');
  git('config', 'user.name', 'Daily test');
  git('config', 'user.email', 'daily-test@example.invalid');
  git('add', '.');
  git('commit', '-m', 'fixture');
  await add(next);
  await write('data/experiments.json', JSON.stringify([next, old]));
  const verify = () => spawnSync(process.execPath, ['scripts/verify-daily.mjs'], { cwd: root, encoding: 'utf8', env: { ...process.env, KAGUMI_DATE: next.date, KAGUMI_BASE_SHA: git('rev-parse', 'HEAD').toString().trim() } });
  return { root, write, old, next, verify, git };
}

test('daily verification accepts exactly one new independent experiment, including a staged patch', async (t) => {
  const f = await fixture(t);
  let result = f.verify();
  assert.equal(result.status, 0, result.stderr);
  f.git('add', '.');
  result = f.verify();
  assert.equal(result.status, 0, result.stderr);
});

test('daily verification rejects edits to archived metadata', async (t) => {
  const f = await fixture(t);
  await f.write('data/experiments.json', JSON.stringify([f.next, { ...f.old, title: 'Overwritten' }]));
  const result = f.verify();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Preserve existing metadata/);
});

test('daily verification rejects shared-code changes and older asset edits', async (t) => {
  const f = await fixture(t);
  await f.write('src/main.js', 'unrelated change');
  let result = f.verify();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Out-of-scope daily change/);
  await rm(join(f.root, 'src'), { recursive: true });
  await f.write(`public/${f.old.path}index.html`, '<h1>Overwritten</h1><meta name="viewport">');
  result = f.verify();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Out-of-scope daily change/);
});

test('daily verification rejects duplicate dates', async (t) => {
  const f = await fixture(t);
  await f.write('data/experiments.json', JSON.stringify([f.next, f.next, f.old]));
  const result = f.verify();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Duplicate experiment date/);
});

test('daily preparation skips an existing day without changing the repository', async (t) => {
  const f = await fixture(t);
  await f.write('data/experiments.json', JSON.stringify([{ ...f.old, date: localDate() }]));
  const result = spawnSync(process.execPath, ['scripts/prepare-daily.mjs'], { cwd: f.root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /exists=true/);
});

test('daily preparation uses the pinned Codex run date across midnight', async (t) => {
  const f = await fixture(t);
  const result = spawnSync(process.execPath, ['scripts/prepare-daily.mjs'], {
    cwd: f.root, encoding: 'utf8', env: { ...process.env, KAGUMI_DATE: '2026-10-22' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /date=2026-10-22\nexists=false/);
});
