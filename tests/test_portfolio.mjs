// Portfolio work entries: every card needs the fields the page renders, and links must be real https URLs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../portfolio/works.js', import.meta.url), 'utf8'), ctx);
const works = ctx.window.WORKS;
const CATS = ['ai', 'research', 'creative', 'web3', 'tool'];

assert.ok(Array.isArray(works) && works.length > 0, 'works.js defines window.WORKS');
assert.equal(new Set(works.map((w) => w.id)).size, works.length, 'ids are unique');
for (const w of works) {
  assert.match(w.id, /^[a-z0-9-]+$/, `${w.id}: id is usable as an anchor`);
  for (const key of ['title', 'sub', 'summary']) assert.ok(w[key], `${w.id}: ${key} is set`);
  assert.match(w.date, /^\d{4}\.(0[1-9]|1[0-2])$/, `${w.id}: date is YYYY.MM`);
  assert.ok(w.cats.length && w.cats.every((c) => CATS.includes(c)), `${w.id}: categories are known`);
  assert.ok(Array.isArray(w.tech) && w.tech.length, `${w.id}: tech is listed`);
  assert.ok(Number.isFinite(w.hue), `${w.id}: hue is a number`);
  assert.ok(w.links.live || w.links.repo, `${w.id}: has a link`);
  const urls = [w.links.live, w.links.repo, ...(w.links.extra || []).map((x) => x.url)].filter(Boolean);
  for (const u of urls) assert.match(u, /^https:\/\/[^\s"'<>]+$/, `${w.id}: ${u} is an https URL`);
  if (w.series) assert.ok(['phantom', 'mythos'].includes(w.series), `${w.id}: series is known`);
  if (w.featured) for (const key of ['problem', 'build', 'point']) assert.ok(w[key], `${w.id}: featured work has ${key}`);
}
assert.ok(works.filter((w) => w.featured).length >= 1, 'at least one featured work');

const html = readFileSync(new URL('../portfolio/index.html', import.meta.url), 'utf8');
assert.ok(html.includes('<script src="works.js"></script>'), 'page loads works.js');
console.log(`portfolio: ${works.length} works OK`);
