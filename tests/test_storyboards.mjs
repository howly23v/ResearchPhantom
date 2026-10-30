// Daily pick selection and LLM output validation, without any network access.
import assert from 'node:assert/strict';
import { CATEGORY_GROUPS, buildDigestPrompt, chooseGeminiModels, chooseOpenCodeModels, parseDigests, pickDailyPapers, parseStoryboard } from '../scripts/generate_storyboards.mjs';

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
assert.deepEqual(chooseGeminiModels([
  { name: 'models/gemini-3.6-flash', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.10-flash', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.10-flash-lite-preview', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.6-flash-lite', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.9-pro', supportedGenerationMethods: gen },
  { name: 'models/gemini-3.7-flash-lite', supportedGenerationMethods: ['embedContent'] },
]), { flash: ['gemini-3.10-flash', 'gemini-3.6-flash'], lite: ['gemini-3.6-flash-lite', 'gemini-3.5-flash-lite'] },
'stable models that can generate content, Flash and Flash-Lite each newest first');
assert.deepEqual(chooseGeminiModels([]), { flash: [], lite: [] });

assert.deepEqual(chooseOpenCodeModels([
  { id: 'claude-sonnet-5' }, { id: 'nemotron-3-ultra-free' }, { id: 'big-pickle' },
  { id: 'mimo-v2.5-free' }, { id: 'deepseek-v4-flash-free' }, { id: 'zeta-free' },
]), ['deepseek-v4-flash-free', 'mimo-v2.5-free', 'nemotron-3-ultra-free', 'zeta-free', 'big-pickle'],
'only free models, preferred families first, big-pickle last');
assert.deepEqual(chooseOpenCodeModels([{ id: 'gpt-5' }]), []);

// Batched Japanese summaries for papers outside the daily picks.
const digestPrompt = buildDigestPrompt([paper('a1', ['cs.AI'], 'Long  abstract\nwith spaces.'), paper('b2', ['quant-ph'])]);
assert.match(digestPrompt, /2本のarXiv論文/);
assert.match(digestPrompt, /\[1\] id: a1\nタイトル: Paper a1\n要旨: Long abstract with spaces\./);
const digests = parseDigests('```json\n[{"id":"a1","title_ja":"<i>題</i>","summary_ja":"要約","point":"成果"},' +
  '{"id":"zz","title_ja":"x","summary_ja":"y"},{"id":"b2","title_ja":"題2"},{"id":"a1","title_ja":"重複","summary_ja":"z"}]\n```', ['a1', 'b2']);
assert.deepEqual(digests, { a1: { kind: 'digest', title_ja: 'i題/i', summary_ja: '要約', point: '成果' } },
  'only requested ids with title and summary are kept, first answer wins, markup is removed');
assert.deepEqual(Object.keys(parseDigests('{"papers":[{"id":"b2","title_ja":"t","summary_ja":"s"}]}', ['b2'])), ['b2'], 'wrapped arrays are accepted');
assert.throws(() => parseDigests('[]', ['a1']), /0件/);
assert.throws(() => parseDigests('not json', ['a1']));

console.log('PASS: daily picks are unique, prefer new numeric results, LLM output is sanitized, Gemini/OpenCode model choice, batched summaries');
