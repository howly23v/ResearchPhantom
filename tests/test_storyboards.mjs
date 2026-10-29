// Daily pick selection and LLM output validation, without any network access.
import assert from 'node:assert/strict';
import { CATEGORY_GROUPS, chooseGeminiModel, pickDailyPapers, parseStoryboard } from '../scripts/generate_storyboards.mjs';

const paper = (id, categories, summary = 'A method.', announce_type = 'new') =>
  ({ id, title: 'Paper ' + id, summary, categories, announce_type });
const papers = [
  paper('1', ['quant-ph'], 'Fidelity improves by 12% over baselines.'),
  paper('2', ['quant-ph'], 'A method.', 'replace'),
  paper('3', ['quant-ph']),
  paper('4', ['cs.CL', 'cs.AI']),
  paper('5', ['cs.AI'], 'This paper has been withdrawn.'),
];

const picked = pickDailyPapers(papers, 2);
const ids = picked.map((p) => p.id);
assert.equal(new Set(ids).size, ids.length, 'a paper is picked at most once');
assert.deepEqual(ids.filter((id) => ['1', '2', '3'].includes(id)), ['1', '3'], 'numeric new results beat replacements');
assert.ok(ids.includes('4'), 'cross-listed papers are eligible');
assert.equal(pickDailyPapers(papers, 1).length <= Object.keys(CATEGORY_GROUPS).length, true);

const sb = parseStoryboard('```json\n{"title_ja":"<script>x</script>量子","summary_ja":"まとめ","problem":"課題","method":["a","b","c","d"],"result":"結果","impact":"意義","viz":{"type":"gauge","value":140}}\n```');
assert.equal(sb.title_ja, 'scriptx/script量子', 'markup characters are removed');
assert.equal(sb.summary_ja, 'まとめ');
assert.equal(sb.method.length, 3);
assert.equal(sb.viz, null, 'out-of-range gauge is rejected');
assert.throws(() => parseStoryboard('{"problem":"only"}'));
assert.equal('title_ja' in parseStoryboard('{"problem":"p","result":"r","impact":"i"}'), false);

const gen = ['generateContent'];
assert.equal(chooseGeminiModel([
  { name: 'models/gemini-3.8-flash', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.10-flash-lite-preview', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.6-flash-lite', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.9-pro', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.7-flash-lite', supportedGenerationMethods: ['embedContent'] },
]), 'gemini-3.6-flash-lite', 'newest stable Flash-Lite that can generate content');
assert.equal(chooseGeminiModel([{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: gen }]), 'gemini-3.8-flash');
assert.equal(chooseGeminiModel([]), null);

console.log('PASS: daily picks are unique, prefer new numeric results, LLM output is sanitized, Gemini model choice');
